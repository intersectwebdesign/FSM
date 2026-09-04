import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InvoiceDocument } from "@/components/InvoiceDocument";

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: invoice }, { data: lineItems }, { data: settings }] =
    await Promise.all([
      supabase
        .from("invoices")
        .select(
          "*, jobs(title, customers(name), sites(address, city, postcode))"
        )
        .eq("id", id)
        .single(),
      supabase
        .from("invoice_line_items")
        .select("id, description, quantity, unit_price")
        .eq("invoice_id", id)
        .order("sort_order"),
      supabase
        .from("company_settings")
        .select(
          "business_name, abn, business_address, business_phone, business_email, payment_instructions, logo_url, gst_registered"
        )
        .eq("id", 1)
        .single(),
    ]);

  if (!invoice) notFound();

  const siteAddress = invoice.jobs?.sites
    ? [
        invoice.jobs.sites.address,
        invoice.jobs.sites.city,
        invoice.jobs.sites.postcode,
      ]
        .filter(Boolean)
        .join(", ")
    : "-";

  return (
    <InvoiceDocument
      invoiceNumber={invoice.invoice_number}
      status={invoice.status}
      issuedAt={invoice.issued_at}
      dueDate={invoice.due_date}
      jobTitle={invoice.jobs?.title ?? "-"}
      customerName={invoice.jobs?.customers?.name ?? "-"}
      siteAddress={siteAddress}
      lineItems={lineItems ?? []}
      subtotal={invoice.subtotal}
      gstAmount={invoice.gst_amount}
      total={invoice.total}
      gstRegistered={settings?.gst_registered ?? true}
      notes={invoice.notes}
      business={{
        business_name: settings?.business_name ?? null,
        abn: settings?.abn ?? null,
        business_address: settings?.business_address ?? null,
        business_phone: settings?.business_phone ?? null,
        business_email: settings?.business_email ?? null,
        payment_instructions: settings?.payment_instructions ?? null,
        logo_url: settings?.logo_url ?? null,
      }}
    />
  );
}
