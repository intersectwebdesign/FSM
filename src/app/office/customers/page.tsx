import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createCustomer } from "./actions";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, notes, created_at, sites(count)")
    .order("name");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Customers</h1>
        <p className="text-sm text-zinc-500">
          Manage customers and their sites.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {customers && customers.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Sites</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-t border-zinc-100">
                    <td className="px-4 py-2">
                      <Link
                        href={`/office/customers/${c.id}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-zinc-600">
                      {c.sites?.[0]?.count ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-6 text-center text-sm text-zinc-500">
              No customers yet.
            </p>
          )}
        </div>

        <form
          action={createCustomer}
          className="flex h-fit flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5"
        >
          <h2 className="font-medium text-zinc-900">Add customer</h2>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-600">Name</label>
            <input
              name="name"
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-600">Notes</label>
            <textarea
              name="notes"
              rows={3}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover"
          >
            Add customer
          </button>
        </form>
      </div>
    </div>
  );
}
