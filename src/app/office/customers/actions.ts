"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createCustomer(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({ name, notes: notes || null })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/office/customers");
  redirect(`/office/customers/${data.id}`);
}

export async function updateCustomer(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!id || !name) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ name, notes: notes || null })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/office/customers/${id}`);
  revalidatePath("/office/customers");
}

export async function createSite(formData: FormData) {
  const customerId = String(formData.get("customer_id") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const postcode = String(formData.get("postcode") ?? "").trim();
  const accessNotes = String(formData.get("access_notes") ?? "").trim();
  if (!customerId || !address) return;

  const supabase = await createClient();
  const { error } = await supabase.from("sites").insert({
    customer_id: customerId,
    address,
    city: city || null,
    postcode: postcode || null,
    access_notes: accessNotes || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/office/customers/${customerId}`);
}
