"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesUpdate } from "@/lib/database.types";

async function recalculateInvoiceTotals(
  supabase: SupabaseClient<Database>,
  invoiceId: string
) {
  const [{ data: items }, { data: settings }] = await Promise.all([
    supabase
      .from("invoice_line_items")
      .select("quantity, unit_price")
      .eq("invoice_id", invoiceId),
    supabase
      .from("company_settings")
      .select("gst_registered, gst_rate")
      .eq("id", 1)
      .single(),
  ]);

  const subtotal = (items ?? []).reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  const gstAmount = settings?.gst_registered
    ? subtotal * (settings.gst_rate ?? 0)
    : 0;

  await supabase
    .from("invoices")
    .update({
      subtotal,
      gst_amount: gstAmount,
      total: subtotal + gstAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);
}

export async function createInvoiceFromJob(formData: FormData) {
  const jobId = String(formData.get("job_id") ?? "");
  if (!jobId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: costs }, { data: materials }, { data: expenses }, { data: settings }] =
    await Promise.all([
      supabase.from("job_costs_summary").select("*").eq("job_id", jobId).single(),
      supabase
        .from("job_materials")
        .select("description, quantity, unit_cost")
        .eq("job_id", jobId),
      supabase
        .from("job_expenses")
        .select("description, amount")
        .eq("job_id", jobId),
      supabase
        .from("company_settings")
        .select("payment_terms_days")
        .eq("id", 1)
        .single(),
    ]);

  const { data: numberResult } = await supabase.rpc("next_invoice_number");
  const invoiceNumber = numberResult ?? `INV-${Date.now()}`;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (settings?.payment_terms_days ?? 14));

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      job_id: jobId,
      invoice_number: invoiceNumber,
      due_date: dueDate.toISOString().slice(0, 10),
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  type LineItem = { description: string; quantity: number; unit_price: number; sort_order: number };
  const lineItems: LineItem[] = [];
  let sortOrder = 0;

  const costLabels: { key: keyof NonNullable<typeof costs>; label: string }[] = [
    { key: "labour_cost", label: "Labour" },
    { key: "travel_cost", label: "Travel" },
    { key: "mileage_cost", label: "Mileage" },
    { key: "callout_cost", label: "Call-out fee" },
  ];
  for (const { key, label } of costLabels) {
    const value = costs?.[key];
    if (typeof value === "number" && value > 0) {
      lineItems.push({ description: label, quantity: 1, unit_price: value, sort_order: sortOrder++ });
    }
  }

  for (const m of materials ?? []) {
    lineItems.push({
      description: m.description,
      quantity: m.quantity,
      unit_price: m.unit_cost,
      sort_order: sortOrder++,
    });
  }

  for (const e of expenses ?? []) {
    lineItems.push({
      description: e.description,
      quantity: 1,
      unit_price: e.amount,
      sort_order: sortOrder++,
    });
  }

  if (lineItems.length > 0) {
    const { error: itemsError } = await supabase
      .from("invoice_line_items")
      .insert(lineItems.map((item) => ({ ...item, invoice_id: invoice.id })));
    if (itemsError) throw new Error(itemsError.message);
  }

  await recalculateInvoiceTotals(supabase, invoice.id);

  revalidatePath(`/office/jobs/${jobId}`);
  revalidatePath("/office/invoices");
  redirect(`/office/invoices/${invoice.id}`);
}

export async function addInvoiceLineItem(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  const unitPrice = Number(formData.get("unit_price") ?? 0);
  if (!invoiceId || !description) return;

  const supabase = await createClient();

  const { count } = await supabase
    .from("invoice_line_items")
    .select("id", { count: "exact", head: true })
    .eq("invoice_id", invoiceId);

  const { error } = await supabase.from("invoice_line_items").insert({
    invoice_id: invoiceId,
    description,
    quantity,
    unit_price: unitPrice,
    sort_order: count ?? 0,
  });

  if (error) throw new Error(error.message);

  await recalculateInvoiceTotals(supabase, invoiceId);
  revalidatePath(`/office/invoices/${invoiceId}`);
}

export async function updateInvoiceLineItem(formData: FormData) {
  const itemId = String(formData.get("item_id") ?? "");
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  const unitPrice = Number(formData.get("unit_price") ?? 0);
  if (!itemId || !invoiceId || !description) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("invoice_line_items")
    .update({ description, quantity, unit_price: unitPrice })
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  await recalculateInvoiceTotals(supabase, invoiceId);
  revalidatePath(`/office/invoices/${invoiceId}`);
}

export async function deleteInvoiceLineItem(formData: FormData) {
  const itemId = String(formData.get("item_id") ?? "");
  const invoiceId = String(formData.get("invoice_id") ?? "");
  if (!itemId || !invoiceId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("invoice_line_items")
    .delete()
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  await recalculateInvoiceTotals(supabase, invoiceId);
  revalidatePath(`/office/invoices/${invoiceId}`);
}

export async function updateInvoiceStatus(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!invoiceId || !status) return;

  const supabase = await createClient();

  const update: TablesUpdate<"invoices"> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "sent") update.issued_at = new Date().toISOString();
  if (status === "paid") update.paid_at = new Date().toISOString();

  const { data: current } = await supabase
    .from("invoices")
    .select("job_id")
    .eq("id", invoiceId)
    .single();

  const { error } = await supabase.from("invoices").update(update).eq("id", invoiceId);
  if (error) throw new Error(error.message);

  revalidatePath(`/office/invoices/${invoiceId}`);
  revalidatePath("/office/invoices");
  if (current?.job_id) revalidatePath(`/office/jobs/${current.job_id}`);
}

export async function updateInvoiceDetails(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const dueDate = String(formData.get("due_date") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!invoiceId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .update({
      due_date: dueDate || null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  if (error) throw new Error(error.message);

  revalidatePath(`/office/invoices/${invoiceId}`);
}

export async function deleteInvoice(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "");
  if (!invoiceId) return;

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("invoices")
    .select("job_id, status")
    .eq("id", invoiceId)
    .single();
  if (!current || current.status !== "draft") return;

  const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
  if (error) throw new Error(error.message);

  revalidatePath("/office/invoices");
  if (current.job_id) revalidatePath(`/office/jobs/${current.job_id}`);
  redirect(`/office/jobs/${current.job_id}`);
}
