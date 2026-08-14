import { createClient } from "@/lib/supabase/server";
import { updateEngineer } from "./actions";

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: engineers } = await supabase
    .from("profiles")
    .select("id, full_name, phone, hourly_rate, travel_rate")
    .eq("role", "engineer")
    .order("full_name");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Team</h1>
        <p className="text-sm text-zinc-500">
          Field engineers and their rates, used to calculate labour cost on
          jobs. Hourly rate applies to on-site time; travel rate (usually
          lower) applies to time spent travelling to a job. New engineers
          sign up with an account created outside this page (Supabase
          Auth); they appear here automatically once they have signed up.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {engineers && engineers.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            {engineers.map((e) => (
              <form
                key={e.id}
                action={updateEngineer}
                className="flex flex-wrap items-center gap-2 px-4 py-3"
              >
                <input type="hidden" name="id" value={e.id} />
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Name</label>
                  <input
                    type="text"
                    name="full_name"
                    defaultValue={e.full_name ?? ""}
                    required
                    placeholder="Name"
                    className="w-40 rounded-md border border-zinc-300 px-2 py-1 text-sm font-medium text-zinc-900"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={e.phone ?? ""}
                    placeholder="Phone"
                    className="w-36 rounded-md border border-zinc-300 px-2 py-1 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">
                    Hourly rate (AUD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="hourly_rate"
                    defaultValue={e.hourly_rate ?? ""}
                    placeholder="Hourly rate"
                    className="w-28 rounded-md border border-zinc-300 px-2 py-1 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-500">
                    Travel rate (AUD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="travel_rate"
                    defaultValue={e.travel_rate ?? ""}
                    placeholder="Travel rate"
                    className="w-28 rounded-md border border-zinc-300 px-2 py-1 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-4 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Save
                </button>
              </form>
            ))}
          </div>
        ) : (
          <p className="p-6 text-center text-sm text-zinc-500">
            No engineers yet.
          </p>
        )}
      </div>
    </div>
  );
}
