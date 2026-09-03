"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addTimeEntry(formData: FormData) {
  const jobId = String(formData.get("job_id") ?? "");
  const engineerIdInput = String(formData.get("engineer_id") ?? "").trim();
  const hours = Number(formData.get("hours") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!jobId || !Number.isFinite(hours) || hours <= 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const engineerId = engineerIdInput || user?.id;
  if (!engineerId) return;

  const durationMinutes = Math.round(hours * 60);
  const startedAt = new Date();
  const endedAt = new Date(startedAt.getTime() + durationMinutes * 60000);

  const { error } = await supabase.from("job_time_entries").insert({
    job_id: jobId,
    engineer_id: engineerId,
    started_at: startedAt.toISOString(),
    ended_at: endedAt.toISOString(),
    duration_minutes: durationMinutes,
    note: note || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/office/jobs/${jobId}`);
  revalidatePath(`/engineer/jobs/${jobId}`);
}

export async function deleteTimeEntry(formData: FormData) {
  const entryId = String(formData.get("entry_id") ?? "");
  const jobId = String(formData.get("job_id") ?? "");
  if (!entryId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("job_time_entries")
    .delete()
    .eq("id", entryId);

  if (error) throw new Error(error.message);

  revalidatePath(`/office/jobs/${jobId}`);
  revalidatePath(`/engineer/jobs/${jobId}`);
}
