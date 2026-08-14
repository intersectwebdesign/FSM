import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { StartTravelButton } from "@/components/StartTravelButton";
import { MapsLink } from "@/components/MapsLink";
import { formatDateTime, formatDuration } from "@/lib/types";
import { updateLegStatus } from "@/app/office/jobs/legs-actions";

export default async function EngineerLegDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: leg }, { data: costs }, { data: settings }] = await Promise.all([
    supabase
      .from("job_legs")
      .select(
        "*, jobs(id, title, description, customers(name), sites(address, city, postcode, access_notes))"
      )
      .eq("id", id)
      .single(),
    supabase.from("job_leg_costs_summary").select("*").eq("leg_id", id).single(),
    supabase.from("company_settings").select("maps_provider").eq("id", 1).single(),
  ]);

  if (!leg || !leg.jobs) notFound();

  const mapsProvider = settings?.maps_provider === "google" ? "google" : "apple";
  const job = leg.jobs;

  const mapsQuery = encodeURIComponent(
    [job.sites?.address, job.sites?.city, job.sites?.postcode]
      .filter(Boolean)
      .join(", ")
  );

  const canStartTravel = !["travelling", "on_site", "paused", "completed", "cancelled"].includes(
    leg.status
  );
  const canArrive = leg.status === "travelling";
  const canPause = leg.status === "on_site";
  const canResume = leg.status === "paused";
  const canComplete = leg.status === "on_site" || leg.status === "paused";

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <Link href="/engineer" className="text-sm text-zinc-500">
          &larr; My jobs
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-lg font-semibold text-zinc-900">{job.title}</h1>
          <StatusBadge status={leg.status} />
        </div>
        <p className="text-sm font-medium text-zinc-700">{leg.description}</p>
        <p className="text-sm text-zinc-600">{job.customers?.name}</p>
        <MapsLink
          query={mapsQuery}
          provider={mapsProvider}
          className="text-sm text-blue-600 underline"
        >
          {job.sites?.address}
          {job.sites?.city ? `, ${job.sites.city}` : ""}
        </MapsLink>
        {job.sites?.access_notes && (
          <p className="mt-1 text-sm text-zinc-500">
            Access notes: {job.sites.access_notes}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {canStartTravel && (
          <StartTravelButton
            id={leg.id}
            kind="leg"
            mapsQuery={mapsQuery}
            provider={mapsProvider}
          />
        )}

        {canArrive && (
          <form action={updateLegStatus}>
            <input type="hidden" name="leg_id" value={leg.id} />
            <input type="hidden" name="status" value="on_site" />
            <button
              type="submit"
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white"
            >
              Arrived
            </button>
          </form>
        )}

        {canPause && (
          <form action={updateLegStatus}>
            <input type="hidden" name="leg_id" value={leg.id} />
            <input type="hidden" name="status" value="paused" />
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700"
            >
              Pause
            </button>
          </form>
        )}

        {canResume && (
          <form action={updateLegStatus}>
            <input type="hidden" name="leg_id" value={leg.id} />
            <input type="hidden" name="status" value="on_site" />
            <button
              type="submit"
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white"
            >
              Resume
            </button>
          </form>
        )}

        {canComplete && (
          <form action={updateLegStatus}>
            <input type="hidden" name="leg_id" value={leg.id} />
            <input type="hidden" name="status" value="completed" />
            <button
              type="submit"
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white"
            >
              Complete
            </button>
          </form>
        )}

        {(leg.status === "completed" || leg.status === "cancelled") && (
          <p className="rounded-md bg-zinc-100 px-4 py-2 text-sm text-zinc-600">
            {leg.status === "completed" ? "Leg completed" : "Leg cancelled"}
          </p>
        )}
      </div>

      {(costs?.travel_started_at || costs?.arrived_at || leg.completed_at) && (
        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">Timing</h2>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-zinc-500">Travel started</p>
              <p className="text-zinc-900">
                {formatDateTime(costs?.travel_started_at)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Arrived</p>
              <p className="text-zinc-900">{formatDateTime(costs?.arrived_at)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Completed</p>
              <p className="text-zinc-900">{formatDateTime(leg.completed_at)}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-6 text-sm">
            <p className="text-zinc-600">
              Travel time:{" "}
              <span className="font-medium text-zinc-900">
                {formatDuration(costs?.travel_minutes)}
              </span>
            </p>
            <p className="text-zinc-600">
              On-site time:{" "}
              <span className="font-medium text-zinc-900">
                {formatDuration(costs?.labour_minutes)}
              </span>
            </p>
          </div>
        </section>
      )}

      <Link
        href={`/engineer/jobs/${job.id}`}
        className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm font-medium text-blue-600 underline"
      >
        View full job (materials, expenses, photos, PAT tests, notes)
      </Link>
    </div>
  );
}
