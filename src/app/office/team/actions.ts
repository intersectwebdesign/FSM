"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateEngineer(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const rateRaw = String(formData.get("hourly_rate") ?? "").trim();
  const travelRateRaw = String(formData.get("travel_rate") ?? "").trim();
  const overtimeRateRaw = String(formData.get("overtime_rate") ?? "").trim();
  const calloutFeeRaw = String(formData.get("callout_fee") ?? "").trim();
  const mileageRateRaw = String(formData.get("mileage_rate") ?? "").trim();
  if (!id || !fullName) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phone || null,
      hourly_rate: rateRaw === "" ? null : Number(rateRaw),
      travel_rate: travelRateRaw === "" ? null : Number(travelRateRaw),
      overtime_rate: overtimeRateRaw === "" ? null : Number(overtimeRateRaw),
      callout_fee: calloutFeeRaw === "" ? null : Number(calloutFeeRaw),
      mileage_rate: mileageRateRaw === "" ? null : Number(mileageRateRaw),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/office/team");
}
