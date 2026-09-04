"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateSettings(formData: FormData) {
  const dayStartHour = Number(formData.get("day_start_hour") ?? 7);
  const dayEndHour = Number(formData.get("day_end_hour") ?? 19);
  const slotMinutes = Number(formData.get("slot_minutes") ?? 30);
  const mapsProvider = String(formData.get("maps_provider") ?? "apple");
  const weekStartsOn = Number(formData.get("week_starts_on") ?? 1);
  const showWeekends = formData.get("show_weekends") === "on";

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_settings")
    .update({
      day_start_hour: dayStartHour,
      day_end_hour: dayEndHour,
      slot_minutes: slotMinutes,
      maps_provider: mapsProvider,
      week_starts_on: weekStartsOn,
      show_weekends: showWeekends,
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

export async function updateBusinessDetails(formData: FormData) {
  const businessName = String(formData.get("business_name") ?? "").trim();
  const abn = String(formData.get("abn") ?? "").trim();
  const businessAddress = String(formData.get("business_address") ?? "").trim();
  const businessPhone = String(formData.get("business_phone") ?? "").trim();
  const businessEmail = String(formData.get("business_email") ?? "").trim();
  const gstRegistered = formData.get("gst_registered") === "on";
  const gstRateRaw = String(formData.get("gst_rate") ?? "").trim();
  const paymentTermsDaysRaw = String(formData.get("payment_terms_days") ?? "").trim();
  const paymentInstructions = String(formData.get("payment_instructions") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_settings")
    .update({
      business_name: businessName || null,
      abn: abn || null,
      business_address: businessAddress || null,
      business_phone: businessPhone || null,
      business_email: businessEmail || null,
      gst_registered: gstRegistered,
      gst_rate: gstRateRaw === "" ? 0.1 : Number(gstRateRaw),
      payment_terms_days: paymentTermsDaysRaw === "" ? 14 : Number(paymentTermsDaysRaw),
      payment_instructions: paymentInstructions || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  revalidatePath("/office/settings");
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
