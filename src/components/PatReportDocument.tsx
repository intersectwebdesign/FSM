import { formatDate, formatDateTime } from "@/lib/types";
import { PrintButton } from "./PrintButton";

type PatTestRow = {
  id: string;
  result: string;
  visual_pass: boolean;
  tested_at: string;
  next_due_date: string;
  notes: string | null;
  appliances: { description: string; location: string | null; asset_number: string | null } | null;
  profiles: { full_name: string } | null;
};

export function PatReportDocument({
  jobTitle,
  customerName,
  siteAddress,
  tests,
}: {
  jobTitle: string;
  customerName: string;
  siteAddress: string;
  tests: PatTestRow[];
}) {
  const failCount = tests.filter((t) => t.result === "fail").length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-10">
      <div className="print:hidden">
        <PrintButton />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-8 print:border-none print:p-0">
        <h1 className="text-xl font-semibold text-zinc-900">
          PAT Test Certificate
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{jobTitle}</p>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase text-zinc-500">Customer</p>
            <p className="text-zinc-900">{customerName}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">Site</p>
            <p className="text-zinc-900">{siteAddress}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">Date</p>
            <p className="text-zinc-900">
              {formatDate(new Date().toISOString())}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">Result summary</p>
            <p className={failCount > 0 ? "text-red-700" : "text-green-700"}>
              {tests.length} tested, {failCount} failed
            </p>
          </div>
        </div>

        <table className="mt-6 w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
            <tr>
              <th className="py-2 pr-2">Appliance</th>
              <th className="py-2 pr-2">Location</th>
              <th className="py-2 pr-2">Visual</th>
              <th className="py-2 pr-2">Result</th>
              <th className="py-2 pr-2">Tested</th>
              <th className="py-2 pr-2">Next due</th>
              <th className="py-2">Tested by</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((t) => (
              <tr key={t.id} className="border-b border-zinc-100">
                <td className="py-2 pr-2 text-zinc-900">
                  {t.appliances?.description ?? "-"}
                  {t.appliances?.asset_number && (
                    <span className="text-zinc-400">
                      {" "}
                      (#{t.appliances.asset_number})
                    </span>
                  )}
                </td>
                <td className="py-2 pr-2 text-zinc-600">
                  {t.appliances?.location ?? "-"}
                </td>
                <td className="py-2 pr-2 text-zinc-600">
                  {t.visual_pass ? "Pass" : "Fail"}
                </td>
                <td
                  className={`py-2 pr-2 font-medium ${
                    t.result === "fail" ? "text-red-700" : "text-green-700"
                  }`}
                >
                  {t.result === "fail" ? "Fail" : "Pass"}
                </td>
                <td className="py-2 pr-2 text-zinc-600">
                  {formatDateTime(t.tested_at)}
                </td>
                <td className="py-2 pr-2 text-zinc-600">
                  {formatDate(t.next_due_date)}
                </td>
                <td className="py-2 text-zinc-600">
                  {t.profiles?.full_name ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {tests.some((t) => t.notes) && (
          <div className="mt-4 flex flex-col gap-1 text-sm">
            <p className="text-xs uppercase text-zinc-500">Notes</p>
            {tests
              .filter((t) => t.notes)
              .map((t) => (
                <p key={t.id} className="text-zinc-600">
                  {t.appliances?.description}: {t.notes}
                </p>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
