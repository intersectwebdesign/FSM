"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addJobCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase.from("job_categories").insert({ name });

  if (error) throw new Error(error.message);

  revalidatePath("/office/settings");
  revalidatePath("/office/jobs/new");
}

export async function updateJobCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("job_categories")
    .update({ name })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/office/settings");
}

export async function deleteJobCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("job_categories").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/office/settings");
}
