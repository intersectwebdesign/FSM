import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/types";
import {
  addInvoiceLineItem,
  deleteInvoice,
  deleteInvoiceLineItem,
  updateInvoiceDetails,
  updateInvoiceLineItem,
  updateInvoiceStatus,
} from "../actions";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  cancelled: "Cancelled",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: invoice }, { data: lineItems }] = await Promise.all([
    supabase
      .from("invoices")
      .select(
        "*, jobs(id, title, customers(name), sites(address, city))"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("invoice_line_items")
      .select("*")
      .eq("invoice_id", id)
      .order("sort_order"),
  ]);

  if (!invoice) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/office/invoices"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          &larr; Invoices
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-xl font-semibold text-zinc-900">
            {invoice.invoice_number}
          </h1>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
            {STATUS_LABELS[invoice.status] ?? invoice.status}
          </span>
        </div>
        <p className="text-sm text-zinc-500">
          <Link
            href={`/office/jobs/${invoice.jobs?.id}`}
            className="hover:underline"
          >
            {invoice.jobs?.title}
          </Link>{" "}
          &middot; {invoice.jobs?.customers?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-2 font-medium text-zinc-900">Line items</h2>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">Unit price</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {(lineItems ?? []).map((item) => {
                    const editFormId = `edit-line-${item.id}`;
                    return (
                      <tr key={item.id} className="border-t border-zinc-100">
                        <td className="px-3 py-1.5">
                          <input
                            form={editFormId}
                            name="description"
                            defaultValue={item.description}
                            className="w-full rounded-md border border-transparent px-1 py-1 text-sm hover:border-zinc-300 focus:border-zinc-300 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            form={editFormId}
                            type="number"
                            step="0.01"
                            name="quantity"
                            defaultValue={item.quantity}
                            className="w-16 rounded-md border border-transparent px-1 py-1 text-sm hover:border-zinc-300 focus:border-zinc-300 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            form={editFormId}
                            type="number"
                            step="0.01"
                            name="unit_price"
                            defaultValue={item.unit_price}
                            className="w-24 rounded-md border border-transparent px-1 py-1 text-sm hover:border-zinc-300 focus:border-zinc-300 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-1.5 text-zinc-600">
                          {formatCurrency(item.quantity * item.unit_price)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-right">
                          <form
                            id={editFormId}
                            action={updateInvoiceLineItem}
                            className="inline"
                          >
                            <input type="hidden" name="item_id" value={item.id} />
                            <input type="hidden" name="invoice_id" value={invoice.id} />
                            <button
                              type="submit"
                              className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                            >
                              Save
                            </button>
                          </form>
                          <form action={deleteInvoiceLineItem} className="ml-1 inline">
                            <input type="hidden" name="item_id" value={item.id} />
                            <input type="hidden" name="invoice_id" value={invoice.id} />
                            <button
                              type="submit"
                              className="text-xs text-zinc-400 hover:text-red-600"
                            >
                              Delete
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <form
              action={addInvoiceLineItem}
              className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-zinc-300 p-3"
            >
              <input type="hidden" name="invoice_id" value={invoice.id} />
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-xs text-zinc-500">Description</label>
                <input
                  name="description"
                  required
                  className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">Qty</label>
                <input
                  type="number"
                  step="0.01"
                  name="quantity"
                  defaultValue={1}
                  className="w-16 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">Unit price</label>
                <input
                  type="number"
                  step="0.01"
                  name="unit_price"
                  className="w-24 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover"
              >
                Add line
              </button>
            </form>
          </section>

          <section>
            <h2 className="mb-2 font-medium text-zinc-900">Totals</h2>
            <div className="flex max-w-xs flex-col gap-1 rounded-lg border border-zinc-200 bg-white p-4 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>GST</span>
                <span>{formatCurrency(invoice.gst_amount)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-100 pt-1 font-semibold text-zinc-900">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
            <h3 className="text-sm font-medium text-zinc-900">Status</h3>
            <div className="flex flex-wrap gap-2">
              {["draft", "sent", "paid", "cancelled"].map((s) => (
                <form key={s} action={updateInvoiceStatus}>
                  <input type="hidden" name="invoice_id" value={invoice.id} />
                  <input type="hidden" name="status" value={s} />
                  <button
                    type="submit"
                    disabled={invoice.status === s}
                    className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {STATUS_LABELS[s]}
                  </button>
                </form>
              ))}
            </div>
            {invoice.issued_at && (
              <p className="text-xs text-zinc-500">
                Sent {formatDate(invoice.issued_at)}
              </p>
            )}
            {invoice.paid_at && (
              <p className="text-xs text-zinc-500">
                Paid {formatDate(invoice.paid_at)}
              </p>
            )}
          </div>

          <form
            action={updateInvoiceDetails}
            className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4"
          >
            <input type="hidden" name="invoice_id" value={invoice.id} />
            <h3 className="text-sm font-medium text-zinc-900">Details</h3>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Due date</label>
              <input
                type="date"
                name="due_date"
                defaultValue={invoice.due_date ?? ""}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Notes</label>
              <textarea
                name="notes"
                rows={3}
                defaultValue={invoice.notes ?? ""}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="self-start rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover"
            >
              Save
            </button>
          </form>

          <Link
            href={`/office/invoices/${invoice.id}/print`}
            className="rounded-lg border border-zinc-200 bg-white p-4 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            View / print invoice
          </Link>

          {invoice.status === "draft" && (
            <form
              action={deleteInvoice}
              className="rounded-lg border border-zinc-200 bg-white p-4"
            >
              <input type="hidden" name="invoice_id" value={invoice.id} />
              <button
                type="submit"
                className="text-sm text-red-600 hover:underline"
              >
                Delete draft invoice
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
