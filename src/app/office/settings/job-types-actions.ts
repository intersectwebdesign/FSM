"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addJobType(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const enablesPatTesting = formData.get("enables_pat_testing") === "on";
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase.from("job_types").insert({
    name,
    enables_pat_testing: enablesPatTesting,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/office/settings");
  revalidatePath("/office/jobs/new");
}

export async function updateJobType(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const enablesPatTesting = formData.get("enables_pat_testing") === "on";
  if (!id || !name) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("job_types")
    .update({ name, enables_pat_testing: enablesPatTesting })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/office/settings");
}

export async function deleteJobType(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("job_types").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/office/settings");
}
