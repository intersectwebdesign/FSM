import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { createSite, updateCustomer } from "../actions";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: customer }, { data: sites }, { data: jobs }] =
    await Promise.all([
      supabase.from("customers").select("*").eq("id", id).single(),
      supabase
        .from("sites")
        .select("id, address, city, postcode, access_notes")
        .eq("customer_id", id)
        .order("address"),
      supabase
        .from("jobs")
        .select("id, title, status, scheduled_start, sites(address)")
        .eq("customer_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (!customer) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/office/customers"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          &larr; Customers
        </Link>
        <form
          action={updateCustomer}
          className="mt-2 flex max-w-lg flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4"
        >
          <input type="hidden" name="id" value={customer.id} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Name</label>
            <input
              name="name"
              defaultValue={customer.name}
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Notes</label>
            <textarea
              name="notes"
              defaultValue={customer.notes ?? ""}
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h2 className="font-medium text-zinc-900">Sites</h2>
          <div className="flex flex-col gap-3">
            {sites && sites.length > 0 ? (
              sites.map((s) => (
                <Link
                  key={s.id}
                  href={`/office/sites/${s.id}`}
                  className="block rounded-lg border border-zinc-200 bg-white p-4 text-sm hover:border-zinc-300"
                >
                  <p className="font-medium text-zinc-900">{s.address}</p>
                  <p className="text-zinc-500">
                    {[s.city, s.postcode].filter(Boolean).join(", ")}
                  </p>
                  {s.access_notes && (
                    <p className="mt-1 text-zinc-500">
                      Access notes: {s.access_notes}
                    </p>
                  )}
                </Link>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500">
                No sites yet.
              </p>
            )}
          </div>

          <form
            action={createSite}
            className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4"
          >
            <input type="hidden" name="customer_id" value={id} />
            <h3 className="text-sm font-medium text-zinc-900">Add site</h3>
            <input
              name="address"
              placeholder="Address"
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <input
                name="city"
                placeholder="City"
                className="w-1/2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <input
                name="postcode"
                placeholder="Postcode"
                className="w-1/2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <textarea
              name="access_notes"
              placeholder="Access notes (gate code, parking, etc.)"
              rows={2}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Add site
            </button>
          </form>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-zinc-900">Job history</h2>
            <Link
              href={`/office/jobs/new?customer_id=${id}`}
              className="text-sm font-medium text-zinc-900 hover:underline"
            >
              + New job
            </Link>
          </div>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            {jobs && jobs.length > 0 ? (
              <table className="w-full text-left text-sm">
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-t border-zinc-100 first:border-t-0">
                      <td className="px-4 py-2">
                        <Link
                          href={`/office/jobs/${job.id}`}
                          className="font-medium text-zinc-900 hover:underline"
                        >
                          {job.title}
                        </Link>
                        <p className="text-xs text-zinc-500">
                          {job.sites?.address}
                        </p>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <StatusBadge status={job.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-6 text-center text-sm text-zinc-500">
                No jobs yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
