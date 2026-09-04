import Image from "next/image";
import { formatCurrency, formatDate } from "@/lib/types";
import { PrintButton } from "./PrintButton";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
};

export function InvoiceDocument({
  invoiceNumber,
  status,
  issuedAt,
  dueDate,
  jobTitle,
  customerName,
  siteAddress,
  lineItems,
  subtotal,
  gstAmount,
  total,
  gstRegistered,
  notes,
  business,
}: {
  invoiceNumber: string;
  status: string;
  issuedAt: string | null;
  dueDate: string | null;
  jobTitle: string;
  customerName: string;
  siteAddress: string;
  lineItems: LineItem[];
  subtotal: number;
  gstAmount: number;
  total: number;
  gstRegistered: boolean;
  notes: string | null;
  business: {
    business_name: string | null;
    abn: string | null;
    business_address: string | null;
    business_phone: string | null;
    business_email: string | null;
    payment_instructions: string | null;
    logo_url: string | null;
  };
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-10">
      <div className="print:hidden">
        <PrintButton />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-8 print:border-none print:p-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            {business.logo_url ? (
              <Image
                src={business.logo_url}
                alt="Business logo"
                width={160}
                height={48}
                unoptimized
                className="mb-2 h-10 w-auto object-contain"
              />
            ) : (
              <p className="mb-1 text-lg font-semibold text-zinc-900">
                {business.business_name ?? "Tax Invoice"}
              </p>
            )}
            {business.business_name && business.logo_url && (
              <p className="text-sm font-medium text-zinc-900">
                {business.business_name}
              </p>
            )}
            {business.abn && (
              <p className="text-xs text-zinc-500">ABN {business.abn}</p>
            )}
            {business.business_address && (
              <p className="text-xs text-zinc-500 whitespace-pre-line">
                {business.business_address}
              </p>
            )}
            <p className="text-xs text-zinc-500">
              {[business.business_phone, business.business_email]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-semibold text-zinc-900">
              {gstRegistered ? "Tax Invoice" : "Invoice"}
            </h1>
            <p className="text-sm text-zinc-500">{invoiceNumber}</p>
            <p className="mt-1 text-xs uppercase text-zinc-400">{status}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase text-zinc-500">Bill to</p>
            <p className="text-zinc-900">{customerName}</p>
            <p className="text-zinc-600">{siteAddress}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-zinc-500">Job</p>
            <p className="text-zinc-900">{jobTitle}</p>
            {issuedAt && (
              <p className="mt-2 text-xs text-zinc-500">
                Issued {formatDate(issuedAt)}
              </p>
            )}
            {dueDate && (
              <p className="text-xs text-zinc-500">
                Due {formatDate(dueDate)}
              </p>
            )}
          </div>
        </div>

        <table className="mt-6 w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
            <tr>
              <th className="py-2 pr-2">Description</th>
              <th className="py-2 pr-2 text-right">Qty</th>
              <th className="py-2 pr-2 text-right">Unit price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => (
              <tr key={item.id} className="border-b border-zinc-100">
                <td className="py-2 pr-2 text-zinc-900">{item.description}</td>
                <td className="py-2 pr-2 text-right text-zinc-600">
                  {item.quantity}
                </td>
                <td className="py-2 pr-2 text-right text-zinc-600">
                  {formatCurrency(item.unit_price)}
                </td>
                <td className="py-2 text-right text-zinc-900">
                  {formatCurrency(item.quantity * item.unit_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="flex w-56 flex-col gap-1 text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {gstRegistered && (
              <div className="flex justify-between text-zinc-600">
                <span>GST</span>
                <span>{formatCurrency(gstAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-zinc-200 pt-1 font-semibold text-zinc-900">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {business.payment_instructions && (
          <div className="mt-6 border-t border-zinc-100 pt-4 text-sm">
            <p className="text-xs uppercase text-zinc-500">Payment</p>
            <p className="whitespace-pre-line text-zinc-600">
              {business.payment_instructions}
            </p>
          </div>
        )}

        {notes && (
          <div className="mt-4 text-sm">
            <p className="text-xs uppercase text-zinc-500">Notes</p>
            <p className="whitespace-pre-line text-zinc-600">{notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
