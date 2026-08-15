"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addJobNote(formData: FormData) {
  const jobId = String(formData.get("job_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const isInternal = formData.get("is_internal") === "on";
  if (!jobId || !body) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("job_notes").insert({
    job_id: jobId,
    body,
    is_internal: isInternal,
    author_id: user?.id ?? null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/office/jobs/${jobId}`);
  revalidatePath(`/engineer/jobs/${jobId}`);
}
