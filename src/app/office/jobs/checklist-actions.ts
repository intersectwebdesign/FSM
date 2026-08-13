"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addChecklistItem(formData: FormData) {
  const jobId = String(formData.get("job_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  if (!jobId || !description) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("job_checklist_items").insert({
    job_id: jobId,
    description,
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/office/jobs/${jobId}`);
  revalidatePath(`/engineer/jobs/${jobId}`);
}

export async function toggleChecklistItem(formData: FormData) {
  const itemId = String(formData.get("item_id") ?? "");
  const jobId = String(formData.get("job_id") ?? "");
  const checked = formData.get("checked") === "true";
  if (!itemId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("job_checklist_items")
    .update({
      is_checked: checked,
      checked_by: checked ? (user?.id ?? null) : null,
      checked_at: checked ? new Date().toISOString() : null,
    })
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  revalidatePath(`/office/jobs/${jobId}`);
  revalidatePath(`/engineer/jobs/${jobId}`);
}

export async function deleteChecklistItem(formData: FormData) {
  const itemId = String(formData.get("item_id") ?? "");
  const jobId = String(formData.get("job_id") ?? "");
  if (!itemId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("job_checklist_items")
    .delete()
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  revalidatePath(`/office/jobs/${jobId}`);
  revalidatePath(`/engineer/jobs/${jobId}`);
}
