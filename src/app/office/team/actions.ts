"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateEngineer(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const rateRaw = String(formData.get("hourly_rate") ?? "").trim();
  const travelRateRaw = String(formData.get("travel_rate") ?? "").trim();
  if (!id || !fullName) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phone || null,
      hourly_rate: rateRaw === "" ? null : Number(rateRaw),
      travel_rate: travelRateRaw === "" ? null : Number(travelRateRaw),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/office/team");
}
