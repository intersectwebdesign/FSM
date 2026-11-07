import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { ApplianceStatusBadge } from "@/components/ApplianceStatusBadge";
import { StartTravelButton } from "@/components/StartTravelButton";
import { MapsLink } from "@/components/MapsLink";
import { SiteMap } from "@/components/SiteMap";
import { ChecklistItemRow } from "@/components/ChecklistItemRow";
import { addChecklistItem } from "@/app/office/jobs/checklist-actions";
import { addJobNote } from "@/app/office/jobs/notes-actions";
import { addTimeEntry } from "@/app/office/jobs/time-actions";
import {
  DEFAULT_RETEST_MONTHS,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
} from "@/lib/types";
import { updateJobStatus } from "@/app/office/jobs/actions";
import { addLeg } from "@/app/office/jobs/legs-actions";
import {
  addAppliance,
  addExpense,
  addMaterial,
  addPhoto,
  recordPatTest,
} from "../../actions";

export default async function EngineerJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: job },
    { data: costs },
    { data: materials },
    { data: expenses },
    { data: photos },
    { data: notes },
    { data: settings },
    { data: timeEntries },
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        "*, customers(name), sites(address, city, postcode, access_notes, latitude, longitude), job_types(enables_pat_testing)"
      )
      .eq("id", id)
      .single(),
    supabase.from("job_costs_summary").select("*").eq("job_id", id).single(),
    supabase
      .from("job_materials")
      .select("id, description, quantity, unit_cost, total_cost")
      .eq("job_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("job_expenses")
      .select("id, description, amount, category")
      .eq("job_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("job_photos")
      .select("id, storage_path, caption")
      .eq("job_id", id)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("job_notes")
      .select("id, body, is_internal, created_at, profiles(full_name)")
      .eq("job_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("company_settings").select("maps_provider").eq("id", 1).single(),
    supabase
      .from("job_time_entries")
      .select("id, duration_minutes, note, started_at")
      .eq("job_id", id)
      .order("started_at", { ascending: false }),
  ]);

  const mapsProvider = settings?.maps_provider === "google" ? "google" : "apple";

  if (!job) notFound();

  const showPatSection = !job.job_type_id || job.job_types?.enables_pat_testing;

  const [{ data: appliances }, { data: patTestsThisJob }, { data: legs }, { data: checklistItems }] =
    await Promise.all([
      supabase
        .from("appliance_status")
        .select("*")
        .eq("site_id", job.site_id)
        .eq("active", true)
        .order("description"),
      supabase.from("pat_tests").select("id").eq("job_id", id),
      supabase
        .from("job_legs")
        .select(
          "id, sequence, description, status, scheduled_start, profiles!job_legs_assigned_engineer_id_fkey(full_name)"
        )
        .eq("job_id", id)
        .order("sequence"),
      supabase
        .from("job_checklist_items")
        .select("id, description, is_checked")
        .eq("job_id", id)
        .order("created_at"),
    ]);

  const hasLegs = (legs?.length ?? 0) > 0;

  const photoUrls = photos
    ? await Promise.all(
        photos.map(async (p) => {
          const { data } = await supabase.storage
            .from("job-photos")
            .createSignedUrl(p.storage_path, 3600);
          return { ...p, url: data?.signedUrl };
        })
      )
    : [];

  const mapsQuery = encodeURIComponent(
    [job.sites?.address, job.sites?.city, job.sites?.postcode]
      .filter(Boolean)
      .join(", ")
  );

  const canStartTravel = !["travelling", "on_site", "paused", "completed", "cancelled"].includes(
    job.status
  );
  const canArrive = job.status === "travelling";
  const canPause = job.status === "on_site";
  const canResume = job.status === "paused";
  const canComplete = job.status === "on_site" || job.status === "paused";

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <Link href="/engineer" className="text-sm text-zinc-500">
          &larr; My jobs
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-lg font-semibold text-zinc-900">{job.title}</h1>
          <StatusBadge status={job.status} />
        </div>
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
        {job.sites?.latitude && job.sites?.longitude && (
          <div className="mt-3">
            <SiteMap
              latitude={job.sites.latitude}
              longitude={job.sites.longitude}
              label={job.sites.address}
            />
          </div>
        )}
        {job.description && (
          <p className="mt-2 text-sm text-zinc-600">{job.description}</p>
        )}
      </div>

      {!hasLegs && (
        <div className="flex gap-2">
          {canStartTravel && (
            <StartTravelButton
              id={job.id}
              kind="job"
              mapsQuery={mapsQuery}
              provider={mapsProvider}
            />
          )}

          {canArrive && (
            <form action={updateJobStatus}>
              <input type="hidden" name="job_id" value={job.id} />
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
            <form action={updateJobStatus}>
              <input type="hidden" name="job_id" value={job.id} />
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
            <form action={updateJobStatus}>
              <input type="hidden" name="job_id" value={job.id} />
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
            <form action={updateJobStatus}>
              <input type="hidden" name="job_id" value={job.id} />
              <input type="hidden" name="status" value="completed" />
              <button
                type="submit"
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white"
              >
                Complete
              </button>
            </form>
          )}

          {(job.status === "completed" || job.status === "cancelled") && (
            <p className="rounded-md bg-zinc-100 px-4 py-2 text-sm text-zinc-600">
              {job.status === "completed" ? "Job completed" : "Job cancelled"}
            </p>
          )}
        </div>
      )}

      {!hasLegs && (costs?.travel_started_at || costs?.arrived_at || job.completed_at) && (
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
              <p className="text-zinc-900">{formatDateTime(job.completed_at)}</p>
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

      {hasLegs && (
        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">Legs</h2>
          <ul className="flex flex-col gap-2">
            {legs!.map((leg) => (
              <li key={leg.id}>
                <Link
                  href={`/engineer/legs/${leg.id}`}
                  className="block rounded-md border border-zinc-100 bg-zinc-50 p-3 active:bg-zinc-100"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-900">
                      {leg.sequence}. {leg.description}
                    </p>
                    <StatusBadge status={leg.status} />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {leg.scheduled_start
                      ? formatDateTime(leg.scheduled_start)
                      : "Not scheduled"}
                    {leg.profiles?.full_name ? ` · ${leg.profiles.full_name}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          Time entries
        </h2>
        <p className="mb-3 text-xs text-zinc-500">
          Log time manually if a status change was missed or you did work
          off-app.
        </p>
        <ul className="mb-3 flex flex-col gap-2 text-sm text-zinc-600">
          {timeEntries?.map((entry) => (
            <li key={entry.id}>
              <span className="font-medium text-zinc-900">
                {formatDuration(entry.duration_minutes)}
              </span>{" "}
              &mdash; {formatDateTime(entry.started_at)}
              {entry.note ? ` · ${entry.note}` : ""}
            </li>
          ))}
        </ul>
        <form action={addTimeEntry} className="flex flex-col gap-2">
          <input type="hidden" name="job_id" value={job.id} />
          <div className="flex gap-2">
            <input
              type="number"
              step="0.25"
              min="0"
              name="hours"
              placeholder="Hours (e.g. 1.5)"
              required
              className="w-1/2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              name="note"
              placeholder="Note (optional)"
              className="w-1/2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700"
          >
            Add time
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          Need to come back?
        </h2>
        <p className="mb-3 text-xs text-zinc-500">
          Add a return visit if you need to revisit this site — it&apos;ll
          show up on the schedule for office to slot in a time, or set one
          yourself below.
        </p>
        <form action={addLeg} className="flex flex-col gap-2">
          <input type="hidden" name="job_id" value={job.id} />
          <input type="hidden" name="assigned_engineer_id" value={user?.id ?? ""} />
          <input
            name="description"
            placeholder="What's the return visit for? (e.g. Collect item)"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <input
              type="datetime-local"
              name="scheduled_start"
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              type="datetime-local"
              name="scheduled_end"
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700"
          >
            Add return visit
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Checklist</h2>
        {checklistItems && checklistItems.length > 0 ? (
          <ul className="mb-3 flex flex-col gap-2">
            {checklistItems.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                jobId={job.id}
                canDelete={false}
              />
            ))}
          </ul>
        ) : (
          <p className="mb-3 rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500">
            No checklist items yet.
          </p>
        )}
        <form action={addChecklistItem} className="flex flex-col gap-2">
          <input type="hidden" name="job_id" value={job.id} />
          <input
            name="description"
            placeholder="Add item (e.g. 24 x Bar Stools)"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700"
          >
            Add item
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Materials</h2>
        <ul className="mb-3 flex flex-col gap-1 text-sm text-zinc-600">
          {materials?.map((m) => (
            <li key={m.id}>
              {m.description} x{m.quantity} &mdash; {formatCurrency(m.total_cost)}
            </li>
          ))}
        </ul>
        <form action={addMaterial} className="flex flex-col gap-2">
          <input type="hidden" name="job_id" value={job.id} />
          <input
            name="description"
            placeholder="Description"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              name="quantity"
              placeholder="Qty"
              defaultValue={1}
              className="w-1/2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              step="0.01"
              name="unit_cost"
              placeholder="Unit cost"
              className="w-1/2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700"
          >
            Add material
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Expenses</h2>
        <ul className="mb-3 flex flex-col gap-1 text-sm text-zinc-600">
          {expenses?.map((e) => (
            <li key={e.id}>
              {e.description} &mdash; {formatCurrency(e.amount)}
            </li>
          ))}
        </ul>
        <form action={addExpense} className="flex flex-col gap-2">
          <input type="hidden" name="job_id" value={job.id} />
          <input
            name="description"
            placeholder="Description"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <input
              name="category"
              placeholder="Category"
              className="w-1/2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              step="0.01"
              name="amount"
              placeholder="Amount"
              className="w-1/2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700"
          >
            Add expense
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Photos</h2>
        {photoUrls.length > 0 && (
          <div className="mb-3 grid grid-cols-3 gap-2">
            {photoUrls.map((p) =>
              p.url ? (
                <a key={p.id} href={p.url} target="_blank" rel="noreferrer">
                  <Image
                    src={p.url}
                    alt={p.caption ?? "Job photo"}
                    width={150}
                    height={150}
                    unoptimized
                    className="h-24 w-full rounded-md object-cover"
                  />
                </a>
              ) : null
            )}
          </div>
        )}
        <form action={addPhoto} className="flex flex-col gap-2">
          <input type="hidden" name="job_id" value={job.id} />
          <input
            type="file"
            name="file"
            accept="image/*"
            capture="environment"
            required
            className="text-sm"
          />
          <input
            name="caption"
            placeholder="Caption (optional)"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700"
          >
            Upload photo
          </button>
        </form>
      </section>

      {showPatSection && (
      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">PAT testing</h2>
          {patTestsThisJob && patTestsThisJob.length > 0 && (
            <Link
              href={`/engineer/jobs/${job.id}/pat-report`}
              className="text-sm font-medium text-blue-600 underline"
            >
              View report ({patTestsThisJob.length})
            </Link>
          )}
        </div>

        {appliances && appliances.length > 0 ? (
          <ul className="mb-3 flex flex-col gap-2">
            {appliances.map((a) => (
              <li
                key={a.appliance_id}
                className="rounded-md border border-zinc-100 bg-zinc-50 p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {a.description}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {a.location} &middot; last tested{" "}
                      {formatDate(a.last_tested_at)}
                    </p>
                  </div>
                  <ApplianceStatusBadge
                    overdue={a.overdue}
                    result={a.last_result}
                  />
                </div>
                <form
                  action={recordPatTest}
                  className="mt-2 flex flex-col gap-2"
                >
                  <input type="hidden" name="job_id" value={job.id} />
                  <input
                    type="hidden"
                    name="appliance_id"
                    value={a.appliance_id ?? ""}
                  />
                  <label className="flex items-center gap-2 text-xs text-zinc-700">
                    <input type="checkbox" name="visual_pass" defaultChecked />
                    Visual inspection passed
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="result"
                      defaultValue="pass"
                      className="flex-1 rounded-md border border-zinc-300 px-2 py-1.5 text-xs"
                    >
                      <option value="pass">Overall: Pass</option>
                      <option value="fail">Overall: Fail</option>
                    </select>
                    <input
                      type="number"
                      name="retest_months"
                      defaultValue={DEFAULT_RETEST_MONTHS}
                      title="Retest interval (months)"
                      className="w-20 rounded-md border border-zinc-300 px-2 py-1.5 text-xs"
                    />
                  </div>
                  <input
                    name="notes"
                    placeholder="Notes (optional)"
                    className="rounded-md border border-zinc-300 px-2 py-1.5 text-xs"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white"
                  >
                    Record test
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-3 rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500">
            No appliances registered at this site yet.
          </p>
        )}

        <form action={addAppliance} className="flex flex-col gap-2">
          <input type="hidden" name="job_id" value={job.id} />
          <input type="hidden" name="site_id" value={job.site_id} />
          <input
            name="description"
            placeholder="New appliance (e.g. Kettle)"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <input
              name="location"
              placeholder="Location"
              className="w-1/2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              name="asset_number"
              placeholder="Asset # (optional)"
              className="w-1/2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700"
          >
            Add appliance to register
          </button>
        </form>
      </section>
      )}

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Notes</h2>
        <ul className="mb-3 flex flex-col gap-2">
          {notes?.map((n) => (
            <li
              key={n.id}
              className="rounded-md border border-zinc-100 bg-zinc-50 p-3"
            >
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>{formatDateTime(n.created_at)}</span>
                <span>&middot;</span>
                <span>{n.profiles?.full_name ?? "Unknown"}</span>
                {n.is_internal && (
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 font-medium text-zinc-600">
                    Internal
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-700">{n.body}</p>
            </li>
          ))}
        </ul>
        <form action={addJobNote} className="flex flex-col gap-2">
          <input type="hidden" name="job_id" value={job.id} />
          <textarea
            name="body"
            rows={3}
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-xs text-zinc-600">
            <input
              type="checkbox"
              name="is_internal"
              defaultChecked
              className="h-4 w-4 rounded border-zinc-300"
            />
            Internal only (not customer-facing)
          </label>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700"
          >
            Add note
          </button>
        </form>
      </section>
    </div>
  );
}
