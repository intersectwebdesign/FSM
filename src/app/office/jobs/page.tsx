import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUS_LABELS, formatDateTime, type JobStatus } from "@/lib/types";

// JOB_STATUSES (the manually-settable set) deliberately excludes
// "in_progress" -- it's a computed rollup for multi-leg jobs, not something
// office sets by hand. The filter still needs to offer it, or any filtered
// view would silently hide every in-progress job.
const FILTERABLE_STATUSES: JobStatus[] = [
  "unscheduled",
  "scheduled",
  "in_progress",
  "travelling",
  "on_site",
  "paused",
  "completed",
  "cancelled",
];

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[]; engineer?: string }>;
}) {
  const { status, engineer } = await searchParams;
  const selectedStatuses = status
    ? Array.isArray(status)
      ? status
      : [status]
    : [];

  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select(
      "id, title, status, priority, scheduled_start, customers(name), sites(address), profiles!jobs_assigned_engineer_id_fkey(id, full_name)"
    )
    .order("created_at", { ascending: false });

  if (selectedStatuses.length > 0) query = query.in("status", selectedStatuses);
  if (engineer) query = query.eq("assigned_engineer_id", engineer);

  const [{ data: jobs }, { data: engineers }] = await Promise.all([
    query,
    supabase.from("profiles").select("id, full_name").eq("role", "engineer"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Jobs</h1>
          <p className="text-sm text-zinc-500">
            All jobs across customers and engineers.
          </p>
        </div>
        <Link
          href="/office/jobs/new"
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          New job
        </Link>
      </div>

      <form className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm">
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-zinc-500">
            Statuses (uncheck any to exclude them, e.g. hide Completed)
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {FILTERABLE_STATUSES.map((s) => (
              <label key={s} className="flex items-center gap-1.5 text-zinc-700">
                <input
                  type="checkbox"
                  name="status"
                  value={s}
                  defaultChecked={
                    selectedStatuses.length === 0 || selectedStatuses.includes(s)
                  }
                  className="h-4 w-4 rounded border-zinc-300"
                />
                {STATUS_LABELS[s]}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-3">
          <select
            name="engineer"
            defaultValue={engineer ?? ""}
            className="rounded-md border border-zinc-300 px-3 py-1.5"
          >
            <option value="">All engineers</option>
            {engineers?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-hover"
          >
            Filter
          </button>
          <Link
            href="/office/jobs"
            className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline"
          >
            Reset
          </Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {jobs && jobs.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2">Job</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Engineer</th>
                <th className="px-4 py-2">Scheduled</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t border-zinc-100">
                  <td className="px-4 py-2">
                    <Link
                      href={`/office/jobs/${job.id}`}
                      className="font-medium text-zinc-900 hover:underline"
                    >
                      {job.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-600">
                    {job.customers?.name ?? "-"}
                  </td>
                  <td className="px-4 py-2 text-zinc-600">
                    {job.profiles?.full_name ?? "Unassigned"}
                  </td>
                  <td className="px-4 py-2 text-zinc-600">
                    {formatDateTime(job.scheduled_start)}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={job.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-6 text-center text-sm text-zinc-500">
            No jobs match.
          </p>
        )}
      </div>
    </div>
  );
}
