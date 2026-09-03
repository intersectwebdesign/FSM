import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteJobButton } from "@/components/DeleteJobButton";
import { ChecklistItemRow } from "@/components/ChecklistItemRow";
import { addChecklistItem } from "../checklist-actions";
import { addJobNote } from "../notes-actions";
import { addTimeEntry, deleteTimeEntry } from "../time-actions";
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
  JOB_STATUSES,
  STATUS_LABELS,
} from "@/lib/types";
import { updateJobSchedule, updateJobStatus } from "../actions";
import { addLeg, deleteLeg, updateLegSchedule } from "../legs-actions";
import { EditJobForm } from "./EditJobForm";
import { isoToLocalInput } from "@/lib/timezone";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: job },
    { data: costs },
    { data: history },
    { data: materials },
    { data: expenses },
    { data: photos },
    { data: engineers },
    { data: notes },
    { data: timeEntries },
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        "*, customers(id, name), sites(id, address, city, postcode, access_notes), job_types(enables_pat_testing)"
      )
      .eq("id", id)
      .single(),
    supabase.from("job_costs_summary").select("*").eq("job_id", id).single(),
    supabase
      .from("job_status_history")
      .select("id, status, changed_at, note, profiles(full_name)")
      .eq("job_id", id)
      .order("changed_at", { ascending: false }),
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
      .select("id, storage_path, caption, uploaded_at")
      .eq("job_id", id)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "engineer")
      .order("full_name"),
    supabase
      .from("job_notes")
      .select("id, body, is_internal, created_at, profiles(full_name)")
      .eq("job_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("job_time_entries")
      .select("id, duration_minutes, note, started_at, profiles(full_name)")
      .eq("job_id", id)
      .order("started_at", { ascending: false }),
  ]);

  if (!job) notFound();

  const [{ data: customers }, { data: sites }, { data: jobTypes }, { data: jobCategories }] =
    await Promise.all([
      supabase.from("customers").select("id, name").order("name"),
      supabase.from("sites").select("id, customer_id, address").order("address"),
      supabase.from("job_types").select("id, name").order("name"),
      supabase.from("job_categories").select("id, name").order("name"),
    ]);

  const showPatSection = !job.job_type_id || job.job_types?.enables_pat_testing;

  const { data: legs } = await supabase
    .from("job_legs")
    .select(
      "id, sequence, description, status, assigned_engineer_id, scheduled_start, scheduled_end, profiles!job_legs_assigned_engineer_id_fkey(full_name)"
    )
    .eq("job_id", id)
    .order("sequence");

  const { data: checklistItems } = await supabase
    .from("job_checklist_items")
    .select("id, description, is_checked")
    .eq("job_id", id)
    .order("created_at");

  const { data: patTests } = await supabase
    .from("pat_tests")
    .select(
      "id, result, visual_pass, tested_at, notes, appliances(description), profiles(full_name)"
    )
    .eq("job_id", id)
    .order("tested_at", { ascending: false });

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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/office/jobs"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          &larr; Jobs
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-xl font-semibold text-zinc-900">{job.title}</h1>
          <StatusBadge status={job.status} />
        </div>
        <p className="text-sm text-zinc-500">
          <Link
            href={`/office/customers/${job.customers?.id}`}
            className="hover:underline"
          >
            {job.customers?.name}
          </Link>{" "}
          &middot; {job.sites?.address}
          {job.sites?.city ? `, ${job.sites.city}` : ""}
          {job.po_reference ? ` · PO: ${job.po_reference}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          {job.description && (
            <section>
              <h2 className="mb-2 font-medium text-zinc-900">Description</h2>
              <p className="text-sm text-zinc-600">{job.description}</p>
            </section>
          )}

          <section>
            <h2 className="mb-2 font-medium text-zinc-900">Checklist</h2>
            {checklistItems && checklistItems.length > 0 ? (
              <ul className="mb-3 flex flex-col gap-2">
                {checklistItems.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    jobId={job.id}
                    canDelete
                  />
                ))}
              </ul>
            ) : (
              <p className="mb-3 rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500">
                No checklist items yet.
              </p>
            )}
            <form action={addChecklistItem} className="flex gap-2">
              <input type="hidden" name="job_id" value={job.id} />
              <input
                name="description"
                placeholder="Add item (e.g. 24 x Bar Stools)"
                required
                className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Add
              </button>
            </form>
          </section>

          <section>
            <h2 className="mb-2 font-medium text-zinc-900">Cost summary</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <CostTile label="Labour" value={costs?.labour_cost} />
              <CostTile label="Travel" value={costs?.travel_cost} />
              <CostTile label="Mileage" value={costs?.mileage_cost} />
              <CostTile label="Call-out" value={costs?.callout_cost} />
              <CostTile label="Materials" value={costs?.materials_cost} />
              <CostTile label="Expenses" value={costs?.expenses_cost} />
              <CostTile label="Total" value={costs?.total_cost} bold />
            </div>
          </section>

          <section>
            <h2 className="mb-2 font-medium text-zinc-900">Timing</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <TimingTile label="Travel started" value={formatDateTime(costs?.travel_started_at)} />
              <TimingTile label="Arrived" value={formatDateTime(costs?.arrived_at)} />
              <TimingTile label="Completed" value={formatDateTime(job.completed_at)} />
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

          <section>
            <h2 className="mb-2 font-medium text-zinc-900">Time entries</h2>
            <p className="mb-2 text-xs text-zinc-500">
              On top of the automatic travel/on-site tracking above &mdash;
              for correcting a missed status change or logging time worked
              off-app.
            </p>
            <div className="mb-3 flex flex-col gap-2">
              {timeEntries && timeEntries.length > 0 ? (
                timeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {formatDuration(entry.duration_minutes)} &middot;{" "}
                        {entry.profiles?.full_name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatDateTime(entry.started_at)}
                        {entry.note ? ` · ${entry.note}` : ""}
                      </p>
                    </div>
                    <form action={deleteTimeEntry}>
                      <input type="hidden" name="entry_id" value={entry.id} />
                      <input type="hidden" name="job_id" value={job.id} />
                      <button
                        type="submit"
                        className="text-xs text-zinc-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500">
                  No manual time entries.
                </p>
              )}
            </div>
            <form
              action={addTimeEntry}
              className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-zinc-300 p-3"
            >
              <input type="hidden" name="job_id" value={job.id} />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">Engineer</label>
                <select
                  name="engineer_id"
                  defaultValue={job.assigned_engineer_id ?? ""}
                  className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                >
                  {engineers?.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">Hours</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  name="hours"
                  placeholder="1.5"
                  required
                  className="w-24 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-xs text-zinc-500">Note (optional)</label>
                <input
                  name="note"
                  placeholder="What was the time for?"
                  className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Add time
              </button>
            </form>
          </section>

          <section>
            <h2 className="mb-2 font-medium text-zinc-900">Legs</h2>
            <div className="flex flex-col gap-3">
              {legs && legs.length > 0 ? (
                legs.map((leg) => (
                  <form
                    key={leg.id}
                    action={updateLegSchedule}
                    className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3"
                  >
                    <input type="hidden" name="leg_id" value={leg.id} />
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-zinc-900">
                        {leg.sequence}. {leg.description}
                      </p>
                      <StatusBadge status={leg.status} />
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-500">Engineer</label>
                        <select
                          name="assigned_engineer_id"
                          defaultValue={leg.assigned_engineer_id ?? ""}
                          className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                        >
                          <option value="">Unassigned</option>
                          {engineers?.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.full_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-500">Start</label>
                        <input
                          type="datetime-local"
                          name="scheduled_start"
                          defaultValue={isoToLocalInput(leg.scheduled_start)}
                          className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-500">End</label>
                        <input
                          type="datetime-local"
                          name="scheduled_end"
                          defaultValue={isoToLocalInput(leg.scheduled_end)}
                          className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        Save
                      </button>
                      <button
                        type="submit"
                        formAction={deleteLeg}
                        className="ml-auto text-xs text-zinc-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </form>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500">
                  No legs yet &mdash; this job is a single visit.
                </p>
              )}

              <form
                action={addLeg}
                className="flex flex-col gap-2 rounded-lg border border-dashed border-zinc-300 p-3"
              >
                <input type="hidden" name="job_id" value={job.id} />
                <input
                  name="description"
                  placeholder="Leg description (e.g. Pickup & organise return)"
                  required
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-500">Engineer</label>
                    <select
                      name="assigned_engineer_id"
                      defaultValue=""
                      className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                    >
                      <option value="">Unassigned</option>
                      {engineers?.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-500">Start</label>
                    <input
                      type="datetime-local"
                      name="scheduled_start"
                      className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-500">End</label>
                    <input
                      type="datetime-local"
                      name="scheduled_end"
                      className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover"
                  >
                    Add leg
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section>
            <h2 className="mb-2 font-medium text-zinc-900">Materials</h2>
            <SimpleTable
              rows={materials ?? []}
              empty="No materials logged yet."
              columns={[
                { key: "description", render: (r) => r.description },
                { key: "qty", render: (r) => `x${r.quantity}` },
                { key: "cost", render: (r) => formatCurrency(r.total_cost) },
              ]}
            />
          </section>

          <section>
            <h2 className="mb-2 font-medium text-zinc-900">Expenses</h2>
            <SimpleTable
              rows={expenses ?? []}
              empty="No expenses logged yet."
              columns={[
                { key: "description", render: (r) => r.description },
                { key: "category", render: (r) => r.category ?? "-" },
                { key: "amount", render: (r) => formatCurrency(r.amount) },
              ]}
            />
          </section>

          <section>
            <h2 className="mb-2 font-medium text-zinc-900">Photos</h2>
            {photoUrls.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {photoUrls.map((p) =>
                  p.url ? (
                    <a
                      key={p.id}
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-md border border-zinc-200"
                    >
                      <Image
                        src={p.url}
                        alt={p.caption ?? "Job photo"}
                        width={200}
                        height={200}
                        className="h-24 w-full object-cover"
                        unoptimized
                      />
                    </a>
                  ) : null
                )}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500">
                No photos yet.
              </p>
            )}
          </section>

          {showPatSection && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-medium text-zinc-900">PAT testing</h2>
                {patTests && patTests.length > 0 && (
                  <Link
                    href={`/office/jobs/${job.id}/pat-report`}
                    className="text-sm font-medium text-zinc-900 hover:underline"
                  >
                    View report
                  </Link>
                )}
              </div>
              <SimpleTable
                rows={patTests ?? []}
                empty="No PAT tests logged for this job."
                columns={[
                  { key: "appliance", render: (r) => r.appliances?.description ?? "-" },
                  {
                    key: "result",
                    render: (r) => (r.result === "pass" ? "Pass" : "Fail"),
                  },
                  { key: "by", render: (r) => r.profiles?.full_name ?? "-" },
                  { key: "when", render: (r) => formatDateTime(r.tested_at) },
                ]}
              />
            </section>
          )}

          <section>
            <h2 className="mb-2 font-medium text-zinc-900">Notes</h2>
            <div className="mb-3 flex flex-col gap-2">
              {notes && notes.length > 0 ? (
                notes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-lg border border-zinc-200 bg-white p-3"
                  >
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span>{formatDateTime(n.created_at)}</span>
                      <span>&middot;</span>
                      <span>{n.profiles?.full_name ?? "Unknown"}</span>
                      {n.is_internal && (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600">
                          Internal
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-zinc-700">{n.body}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500">
                  No notes yet.
                </p>
              )}
            </div>
            <form action={addJobNote} className="flex flex-col gap-2">
              <input type="hidden" name="job_id" value={job.id} />
              <textarea
                name="body"
                rows={2}
                required
                placeholder="Add a note..."
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <div className="flex items-center justify-between">
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
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Add note
                </button>
              </div>
            </form>
          </section>

          <section>
            <h2 className="mb-2 font-medium text-zinc-900">Status history</h2>
            <SimpleTable
              rows={history ?? []}
              empty="No history yet."
              columns={[
                { key: "status", render: (r) => STATUS_LABELS[r.status as keyof typeof STATUS_LABELS] ?? r.status },
                { key: "by", render: (r) => r.profiles?.full_name ?? "-" },
                { key: "when", render: (r) => formatDateTime(r.changed_at) },
              ]}
            />
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <EditJobForm
            jobId={job.id}
            customers={customers ?? []}
            sites={sites ?? []}
            jobTypes={jobTypes ?? []}
            jobCategories={jobCategories ?? []}
            defaultCustomerId={job.customer_id}
            defaultSiteId={job.site_id}
            defaultTitle={job.title}
            defaultDescription={job.description ?? ""}
            defaultPriority={job.priority}
            defaultJobTypeId={job.job_type_id ?? ""}
            defaultCategoryId={job.category_id ?? ""}
            defaultPoReference={job.po_reference ?? ""}
            defaultIsOvertime={job.is_overtime}
            defaultChargeCallout={job.charge_callout}
            defaultMileageKm={job.mileage_km}
          />

          <form
            action={updateJobSchedule}
            className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4"
          >
            <input type="hidden" name="job_id" value={job.id} />
            <h3 className="text-sm font-medium text-zinc-900">
              Schedule & assignment
            </h3>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Engineer</label>
              <select
                name="assigned_engineer_id"
                defaultValue={job.assigned_engineer_id ?? ""}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {engineers?.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Start</label>
              <input
                type="datetime-local"
                name="scheduled_start"
                defaultValue={isoToLocalInput(job.scheduled_start)}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">End</label>
              <input
                type="datetime-local"
                name="scheduled_end"
                defaultValue={isoToLocalInput(job.scheduled_end)}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover"
            >
              Save
            </button>
          </form>

          <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
            <h3 className="text-sm font-medium text-zinc-900">
              Change status
            </h3>
            <div className="flex flex-wrap gap-2">
              {JOB_STATUSES.map((s) => (
                <form key={s} action={updateJobStatus}>
                  <input type="hidden" name="job_id" value={job.id} />
                  <input type="hidden" name="status" value={s} />
                  <button
                    type="submit"
                    disabled={job.status === s}
                    className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {STATUS_LABELS[s]}
                  </button>
                </form>
              ))}
            </div>
          </div>

          {job.sites?.access_notes && (
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <h3 className="mb-1 text-sm font-medium text-zinc-900">
                Site access notes
              </h3>
              <p className="text-sm text-zinc-600">{job.sites.access_notes}</p>
            </div>
          )}

          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <DeleteJobButton jobId={job.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CostTile({
  label,
  value,
  bold,
}: {
  label: string;
  value: number | null | undefined;
  bold?: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={`mt-1 text-lg ${bold ? "font-semibold" : "font-medium"} text-zinc-900`}
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function TimingTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-zinc-900">{value}</p>
    </div>
  );
}

type Column<T> = { key: string; render: (row: T) => React.ReactNode };

function SimpleTable<T extends { id: string }>({
  rows,
  columns,
  empty,
}: {
  rows: T[];
  columns: Column<T>[];
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500">
        {empty}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-zinc-100 first:border-t-0">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2 text-zinc-700">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
