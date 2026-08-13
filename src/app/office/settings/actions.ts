"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateSettings(formData: FormData) {
  const dayStartHour = Number(formData.get("day_start_hour") ?? 7);
  const dayEndHour = Number(formData.get("day_end_hour") ?? 19);
  const slotMinutes = Number(formData.get("slot_minutes") ?? 30);
  const mapsProvider = String(formData.get("maps_provider") ?? "apple");

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_settings")
    .update({
      day_start_hour: dayStartHour,
      day_end_hour: dayEndHour,
      slot_minutes: slotMinutes,
      maps_provider: mapsProvider,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  revalidatePath("/office/settings");
  revalidatePath("/office/schedule");
  revalidatePath("/engineer");
}
