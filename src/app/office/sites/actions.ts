"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addMonthsToDateKey, dateKeyInTimeZone } from "@/lib/timezone";

export async function updateSite(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const customerId = String(formData.get("customer_id") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const postcode = String(formData.get("postcode") ?? "").trim();
  const accessNotes = String(formData.get("access_notes") ?? "").trim();
  if (!id || !address) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("sites")
    .update({
      address,
      city: city || null,
      postcode: postcode || null,
      access_notes: accessNotes || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/office/sites/${id}`);
  if (customerId) revalidatePath(`/office/customers/${customerId}`);
}

export async function addAppliance(formData: FormData) {
  const siteId = String(formData.get("site_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const assetNumber = String(formData.get("asset_number") ?? "").trim();
  const make = String(formData.get("make") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const serialNumber = String(formData.get("serial_number") ?? "").trim();
  if (!siteId || !description) return;

  const supabase = await createClient();
  const { error } = await supabase.from("appliances").insert({
    site_id: siteId,
    description,
    location: location || null,
    asset_number: assetNumber || null,
    make: make || null,
    model: model || null,
    serial_number: serialNumber || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/office/sites/${siteId}`);
  revalidatePath("/office/pat");
}

export async function recordPatTest(formData: FormData) {
  const siteId = String(formData.get("site_id") ?? "");
  const applianceId = String(formData.get("appliance_id") ?? "");
  const visualPass = formData.get("visual_pass") === "on";
  const result = String(formData.get("result") ?? "pass");
  const notes = String(formData.get("notes") ?? "").trim();
  const retestMonths = Number(formData.get("retest_months") ?? 12);
  if (!siteId || !applianceId) return;

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
    tested_by: user?.id ?? null,
    tested_at: testedAt.toISOString(),
    visual_pass: visualPass,
    result,
    notes: notes || null,
    retest_months: retestMonths,
    next_due_date: nextDueDate,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/office/sites/${siteId}`);
  revalidatePath("/office/pat");
}
