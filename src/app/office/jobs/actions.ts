"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/database.types";
import { validScheduledEnd } from "@/lib/scheduleLayout";
import { localInputToUtcIso } from "@/lib/timezone";

function generatePoReference() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `PO-${random}`;
}

export async function createJob(formData: FormData) {
  const customerId = String(formData.get("customer_id") ?? "");
  const siteId = String(formData.get("site_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium");
  const jobTypeId = String(formData.get("job_type_id") ?? "");
  const categoryId = String(formData.get("category_id") ?? "");
  const poReferenceInput = String(formData.get("po_reference") ?? "").trim();
  const assignedEngineerId = String(formData.get("assigned_engineer_id") ?? "");
  const scheduledStartLocal = String(formData.get("scheduled_start") ?? "");
  const scheduledEndLocal = validScheduledEnd(
    scheduledStartLocal,
    String(formData.get("scheduled_end") ?? "")
  );
  const scheduledStart = localInputToUtcIso(scheduledStartLocal);
  const scheduledEnd = localInputToUtcIso(scheduledEndLocal);

  if (!customerId || !siteId || !title) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const status = scheduledStart
    ? assignedEngineerId
      ? "scheduled"
      : "unscheduled"
    : "unscheduled";

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      customer_id: customerId,
      site_id: siteId,
      title,
      description: description || null,
      priority,
      job_type_id: jobTypeId || null,
      category_id: categoryId || null,
      po_reference: poReferenceInput || generatePoReference(),
      status,
      assigned_engineer_id: assignedEngineerId || null,
      scheduled_start: scheduledStart || null,
      scheduled_end: scheduledEnd || null,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("job_status_history").insert({
    job_id: data.id,
    status,
    changed_by: user?.id ?? null,
    note: "Job created",
  });

  revalidatePath("/office/jobs");
  redirect(`/office/jobs/${data.id}`);
}

export async function updateJobDetails(formData: FormData) {
  const jobId = String(formData.get("job_id") ?? "");
  const customerId = String(formData.get("customer_id") ?? "");
  const siteId = String(formData.get("site_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium");
  const jobTypeId = String(formData.get("job_type_id") ?? "");
  const categoryId = String(formData.get("category_id") ?? "");
  const poReference = String(formData.get("po_reference") ?? "").trim();
  const isOvertime = formData.get("is_overtime") === "on";
  const chargeCallout = formData.get("charge_callout") === "on";
  const mileageKmRaw = String(formData.get("mileage_km") ?? "").trim();
  if (!jobId || !customerId || !siteId || !title) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({
      customer_id: customerId,
      site_id: siteId,
      title,
      description: description || null,
      priority,
      job_type_id: jobTypeId || null,
      category_id: categoryId || null,
      po_reference: poReference || null,
      is_overtime: isOvertime,
      charge_callout: chargeCallout,
      mileage_km: mileageKmRaw === "" ? null : Number(mileageKmRaw),
    })
    .eq("id", jobId);

  if (error) throw new Error(error.message);

  revalidatePath(`/office/jobs/${jobId}`);
  revalidatePath("/office/jobs");
}

async function applySchedule(
  jobId: string,
  assignedEngineerId: string,
  scheduledStartLocal: string,
  scheduledEndLocalInput: string
) {
  const scheduledEndLocal = validScheduledEnd(
    scheduledStartLocal,
    scheduledEndLocalInput
  );
  const scheduledStart = localInputToUtcIso(scheduledStartLocal);
  const scheduledEnd = localInputToUtcIso(scheduledEndLocal);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: current } = await supabase
    .from("jobs")
    .select("status")
    .eq("id", jobId)
    .single();

  let status = current?.status ?? "unscheduled";
  if (status === "unscheduled" && scheduledStart && assignedEngineerId) {
    status = "scheduled";
  }

  const { error } = await supabase
    .from("jobs")
    .update({
      assigned_engineer_id: assignedEngineerId || null,
      scheduled_start: scheduledStart || null,
      scheduled_end: scheduledEnd || null,
      status,
    })
    .eq("id", jobId);

  if (error) throw new Error(error.message);

  if (status !== current?.status) {
    await supabase.from("job_status_history").insert({
      job_id: jobId,
      status,
      changed_by: user?.id ?? null,
      note: "Rescheduled/assigned",
    });
  }

  revalidatePath(`/office/jobs/${jobId}`);
  revalidatePath("/office/schedule");
}

export async function updateJobSchedule(formData: FormData) {
  const jobId = String(formData.get("job_id") ?? "");
  const assignedEngineerId = String(formData.get("assigned_engineer_id") ?? "");
  const scheduledStart = String(formData.get("scheduled_start") ?? "");
  const scheduledEnd = String(formData.get("scheduled_end") ?? "");
  if (!jobId) return;

  await applySchedule(jobId, assignedEngineerId, scheduledStart, scheduledEnd);
}

export async function rescheduleJobDrag(
  jobId: string,
  assignedEngineerId: string,
  scheduledStart: string,
  scheduledEnd: string
) {
  if (!jobId) return;
  await applySchedule(jobId, assignedEngineerId, scheduledStart, scheduledEnd);
}

export async function deleteJob(formData: FormData) {
  const jobId = String(formData.get("job_id") ?? "");
  if (!jobId) return;

  const supabase = await createClient();

  const { data: photos } = await supabase
    .from("job_photos")
    .select("storage_path")
    .eq("job_id", jobId);

  if (photos && photos.length > 0) {
    await supabase.storage
      .from("job-photos")
      .remove(photos.map((p) => p.storage_path));
  }

  await supabase.from("job_photos").delete().eq("job_id", jobId);
  await supabase.from("job_materials").delete().eq("job_id", jobId);
  await supabase.from("job_expenses").delete().eq("job_id", jobId);
  await supabase.from("job_time_entries").delete().eq("job_id", jobId);
  await supabase.from("job_status_history").delete().eq("job_id", jobId);
  await supabase.from("pat_tests").delete().eq("job_id", jobId);
  await supabase.from("job_legs").delete().eq("job_id", jobId);

  const { error } = await supabase.from("jobs").delete().eq("id", jobId);
  if (error) throw new Error(error.message);

  revalidatePath("/office/jobs");
  revalidatePath("/office/schedule");
  redirect("/office/jobs");
}

export async function updateJobStatus(formData: FormData) {
  const jobId = String(formData.get("job_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!jobId || !status) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const update: TablesUpdate<"jobs"> = { status };
  if (status === "completed") update.completed_at = new Date().toISOString();

  const { error } = await supabase.from("jobs").update(update).eq("id", jobId);
  if (error) throw new Error(error.message);

  await supabase.from("job_status_history").insert({
    job_id: jobId,
    status,
    changed_by: user?.id ?? null,
  });

  revalidatePath(`/office/jobs/${jobId}`);
  revalidatePath("/office/jobs");
  revalidatePath("/office/schedule");
}
