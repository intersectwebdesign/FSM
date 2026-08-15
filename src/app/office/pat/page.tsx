import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/types";
import { ApplianceStatusBadge } from "@/components/ApplianceStatusBadge";

export default async function PatOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const supabase = await createClient();

  const { data: sites } = await supabase
    .from("sites")
    .select("id, address, customer_id, customers(name)");

  const siteMap = new Map((sites ?? []).map((s) => [s.id, s]));

  let query = supabase
    .from("appliance_status")
    .select("*")
    .eq("active", true)
    .order("next_due_date", { ascending: true, nullsFirst: false });

  if (filter === "overdue") query = query.eq("overdue", true);
  if (filter === "untested") query = query.is("last_test_id", null);

  const { data: appliances } = await query;

  const overdueCount = appliances?.filter((a) => a.overdue).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">PAT testing</h1>
        <p className="text-sm text-zinc-500">
          Appliance register across all sites, with retest due dates.
        </p>
      </div>

      <div className="flex gap-3 text-sm">
        <Link
          href="/office/pat"
          className={`rounded-md border px-3 py-1.5 ${
            !filter
              ? "border-brand bg-brand text-white"
              : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          All
        </Link>
        <Link
          href="/office/pat?filter=overdue"
          className={`rounded-md border px-3 py-1.5 ${
            filter === "overdue"
              ? "border-amber-600 bg-amber-600 text-white"
              : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          Overdue
        </Link>
        <Link
          href="/office/pat?filter=untested"
          className={`rounded-md border px-3 py-1.5 ${
            filter === "untested"
              ? "border-brand bg-brand text-white"
              : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          Never tested
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {appliances && appliances.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2">Appliance</th>
                <th className="px-4 py-2">Site</th>
                <th className="px-4 py-2">Last tested</th>
                <th className="px-4 py-2">Next due</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {appliances.map((a) => {
                const site = a.site_id ? siteMap.get(a.site_id) : null;
                return (
                  <tr key={a.appliance_id} className="border-t border-zinc-100">
                    <td className="px-4 py-2 font-medium text-zinc-900">
                      {a.description}
                    </td>
                    <td className="px-4 py-2 text-zinc-600">
                      {site ? (
                        <Link
                          href={`/office/sites/${site.id}`}
                          className="hover:underline"
                        >
                          {site.customers?.name} &middot; {site.address}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-2 text-zinc-600">
                      {formatDate(a.last_tested_at)}
                    </td>
                    <td className="px-4 py-2 text-zinc-600">
                      {formatDate(a.next_due_date)}
                    </td>
                    <td className="px-4 py-2">
                      <ApplianceStatusBadge
                        overdue={a.overdue}
                        result={a.last_result}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="p-6 text-center text-sm text-zinc-500">
            No appliances match.
          </p>
        )}
      </div>
      {overdueCount > 0 && filter !== "overdue" && (
        <p className="text-sm text-amber-700">
          {overdueCount} appliance{overdueCount === 1 ? "" : "s"} overdue for
          retest.
        </p>
      )}
    </div>
  );
}
