"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addMonthsToDateKey, dateKeyInTimeZone } from "@/lib/timezone";

export async function addMaterial(formData: FormData) {
  const jobId = String(formData.get("job_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  const unitCost = Number(formData.get("unit_cost") ?? 0);
  if (!jobId || !description) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("job_materials").insert({
    job_id: jobId,
    description,
    quantity,
    unit_cost: unitCost,
    added_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/engineer/jobs/${jobId}`);
}

export async function addExpense(formData: FormData) {
  const jobId = String(formData.get("job_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const category = String(formData.get("category") ?? "").trim();
  if (!jobId || !description) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("job_expenses").insert({
    job_id: jobId,
    description,
    amount,
    category: category || null,
    added_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/engineer/jobs/${jobId}`);
}

export async function addPhoto(formData: FormData) {
  const jobId = String(formData.get("job_id") ?? "");
  const caption = String(formData.get("caption") ?? "").trim();
  const file = formData.get("file") as File | null;
  if (!jobId || !file || file.size === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${jobId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("job-photos")
    .upload(path, file, { contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase.from("job_photos").insert({
    job_id: jobId,
    storage_path: path,
    caption: caption || null,
    uploaded_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/engineer/jobs/${jobId}`);
}

export async function addAppliance(formData: FormData) {
  const jobId = String(formData.get("job_id") ?? "");
  const siteId = String(formData.get("site_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const assetNumber = String(formData.get("asset_number") ?? "").trim();
  if (!jobId || !siteId || !description) return;

  const supabase = await createClient();
  const { error } = await supabase.from("appliances").insert({
    site_id: siteId,
    description,
    location: location || null,
    asset_number: assetNumber || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/engineer/jobs/${jobId}`);
}

export async function recordPatTest(formData: FormData) {
  const jobId = String(formData.get("job_id") ?? "");
  const applianceId = String(formData.get("appliance_id") ?? "");
  const visualPass = formData.get("visual_pass") === "on";
  const result = String(formData.get("result") ?? "pass");
  const notes = String(formData.get("notes") ?? "").trim();
  const retestMonths = Number(formData.get("retest_months") ?? 12);
  if (!jobId || !applianceId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const testedAt = new Date();
  const nextDueDate = addMonthsToDateKey(
    dateKeyInTimeZone(testedAt.toISOString()),
    retestMonths
  );

  const { error } = await supabase.from("pat_tests").insert({
    appliance_id: applianceId,
    job_id: jobId,
    tested_by: user?.id ?? null,
    tested_at: testedAt.toISOString(),
    visual_pass: visualPass,
    result,
    notes: notes || null,
    retest_months: retestMonths,
    next_due_date: nextDueDate,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/engineer/jobs/${jobId}`);
}
