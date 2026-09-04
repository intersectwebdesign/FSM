import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/types";

const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  cancelled: "Cancelled",
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-700",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, status, due_date, total, jobs(title, customers(name))"
    )
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Invoices</h1>
        <p className="text-sm text-zinc-500">
          Generated from job cost summaries. Draft invoices can still be
          edited before sending.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {invoices && invoices.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2">Invoice</th>
                <th className="px-4 py-2">Job</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Due</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const overdue =
                  inv.status === "sent" &&
                  inv.due_date !== null &&
                  inv.due_date < today;
                return (
                  <tr key={inv.id} className="border-t border-zinc-100">
                    <td className="px-4 py-2">
                      <Link
                        href={`/office/invoices/${inv.id}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-zinc-600">
                      {inv.jobs?.title ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-zinc-600">
                      {inv.jobs?.customers?.name ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-zinc-600">
                      {inv.due_date ? formatDate(inv.due_date) : "-"}
                    </td>
                    <td className="px-4 py-2 text-zinc-900">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          overdue
                            ? "bg-amber-100 text-amber-800"
                            : INVOICE_STATUS_COLORS[inv.status] ??
                              "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {overdue
                          ? "Overdue"
                          : INVOICE_STATUS_LABELS[inv.status] ?? inv.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="p-6 text-center text-sm text-zinc-500">
            No invoices yet &mdash; generate one from a job&apos;s page.
          </p>
        )}
      </div>
    </div>
  );
}
