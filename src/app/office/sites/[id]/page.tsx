import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_RETEST_MONTHS, formatDate } from "@/lib/types";
import { ApplianceStatusBadge } from "@/components/ApplianceStatusBadge";
import { addAppliance, recordPatTest, updateSite } from "../actions";

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: site }, { data: appliances }] = await Promise.all([
    supabase
      .from("sites")
      .select("*, customers(id, name)")
      .eq("id", id)
      .single(),
    supabase
      .from("appliance_status")
      .select("*")
      .eq("site_id", id)
      .eq("active", true)
      .order("description"),
  ]);

  if (!site) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href={`/office/customers/${site.customers?.id}`}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          &larr; {site.customers?.name}
        </Link>
        <form
          action={updateSite}
          className="mt-2 flex max-w-lg flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4"
        >
          <input type="hidden" name="id" value={site.id} />
          <input type="hidden" name="customer_id" value={site.customer_id} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Address</label>
            <input
              name="address"
              defaultValue={site.address}
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs text-zinc-500">City</label>
              <input
                name="city"
                defaultValue={site.city ?? ""}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs text-zinc-500">Postcode</label>
              <input
                name="postcode"
                defaultValue={site.postcode ?? ""}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Access notes</label>
            <textarea
              name="access_notes"
              defaultValue={site.access_notes ?? ""}
              rows={2}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="self-start rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Save
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <section className="flex flex-col gap-4">
          <h2 className="font-medium text-zinc-900">
            PAT testing &mdash; appliance register
          </h2>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            {appliances && appliances.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-2">Appliance</th>
                    <th className="px-4 py-2">Location</th>
                    <th className="px-4 py-2">Last tested</th>
                    <th className="px-4 py-2">Next due</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appliances.map((a) => (
                    <tr key={a.appliance_id} className="border-t border-zinc-100">
                      <td className="px-4 py-2">
                        <p className="font-medium text-zinc-900">
                          {a.description}
                        </p>
                        {a.asset_number && (
                          <p className="text-xs text-zinc-500">
                            Asset #{a.asset_number}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2 text-zinc-600">
                        {a.location ?? "-"}
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
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-6 text-center text-sm text-zinc-500">
                No appliances registered yet.
              </p>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <form
            action={addAppliance}
            className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4"
          >
            <input type="hidden" name="site_id" value={id} />
            <h3 className="text-sm font-medium text-zinc-900">
              Add appliance
            </h3>
            <input
              name="description"
              placeholder="Description (e.g. Kettle)"
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              name="location"
              placeholder="Location (e.g. Kitchen)"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              name="asset_number"
              placeholder="Asset # (optional)"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <input
                name="make"
                placeholder="Make"
                className="w-1/2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <input
                name="model"
                placeholder="Model"
                className="w-1/2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <input
              name="serial_number"
              placeholder="Serial number"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover"
            >
              Add appliance
            </button>
          </form>

          {appliances && appliances.length > 0 && (
            <form
              action={recordPatTest}
              className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4"
            >
              <input type="hidden" name="site_id" value={id} />
              <h3 className="text-sm font-medium text-zinc-900">
                Record a test
              </h3>
              <select
                name="appliance_id"
                required
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              >
                {appliances.map((a) => (
                  <option key={a.appliance_id} value={a.appliance_id ?? ""}>
                    {a.description}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input type="checkbox" name="visual_pass" defaultChecked />
                Visual inspection passed
              </label>
              <select
                name="result"
                defaultValue="pass"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="pass">Overall: Pass</option>
                <option value="fail">Overall: Fail</option>
              </select>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">
                  Retest interval (months)
                </label>
                <input
                  type="number"
                  name="retest_months"
                  defaultValue={DEFAULT_RETEST_MONTHS}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <textarea
                name="notes"
                placeholder="Notes"
                rows={2}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Record test
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
