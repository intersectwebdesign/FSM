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

export async function updateBrandColor(formData: FormData) {
  const brandColor = String(formData.get("brand_color") ?? "").trim();
  if (!brandColor) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_settings")
    .update({ brand_color: brandColor, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}

export async function uploadLogo(formData: FormData) {
  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) return;

  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "png";
  const path = `logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("company-logo")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from("company-logo").getPublicUrl(path);
  const logoUrl = `${data.publicUrl}?v=${Date.now()}`;

  const { error } = await supabase
    .from("company_settings")
    .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}

export async function removeLogo() {
  const supabase = await createClient();
  const { error } = await supabase
    .from("company_settings")
    .update({ logo_url: null, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}
