import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/types";
import { dateKeyInTimeZone, startOfDayUtc } from "@/lib/timezone";
import { addDays, dateKey, parseDateKey } from "@/lib/scheduleLayout";

export default async function OfficeDashboard() {
  const supabase = await createClient();

  const todayKey = dateKeyInTimeZone(new Date().toISOString());
  const startOfDayIso = startOfDayUtc(todayKey);
  const endOfDayIso = startOfDayUtc(dateKey(addDays(parseDateKey(todayKey), 1)));

  const [{ data: todaysJobs }, { count: unscheduledCount }, { data: inProgressJobs }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select(
          "id, title, status, scheduled_start, customers(name), sites(address), profiles!jobs_assigned_engineer_id_fkey(full_name)"
        )
        .gte("scheduled_start", startOfDayIso)
        .lt("scheduled_start", endOfDayIso)
        .order("scheduled_start", { ascending: true }),
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "unscheduled"),
      supabase
        .from("jobs")
        .select(
          "id, title, status, scheduled_start, customers(name), profiles!jobs_assigned_engineer_id_fkey(full_name)"
        )
        .eq("status", "in_progress")
        .order("scheduled_start", { ascending: true }),
    ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Today&apos;s jobs</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900">
            {todaysJobs?.length ?? 0}
          </p>
        </div>
        <Link
          href="/office/jobs?status=unscheduled"
          className="rounded-lg border border-zinc-200 bg-white p-5 hover:border-zinc-300"
        >
          <p className="text-sm text-zinc-500">Unscheduled jobs</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900">
            {unscheduledCount ?? 0}
          </p>
        </Link>
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Jobs in progress</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900">
            {inProgressJobs?.length ?? 0}
          </p>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">
            Today&apos;s schedule
          </h2>
          <Link
            href="/office/jobs/new"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            New job
          </Link>
        </div>
        <JobTable jobs={todaysJobs ?? []} showTime />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">
          In progress
        </h2>
        <JobTable jobs={inProgressJobs ?? []} />
      </section>
    </div>
  );
}

type Row = {
  id: string;
  title: string;
  status: string;
  scheduled_start: string | null;
  customers: { name: string } | null;
  sites?: { address: string } | null;
  profiles: { full_name: string } | null;
};

function JobTable({ jobs, showTime }: { jobs: Row[]; showTime?: boolean }) {
  if (jobs.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
        No jobs here right now.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-2">Job</th>
            <th className="px-4 py-2">Customer</th>
            <th className="px-4 py-2">Engineer</th>
            {showTime && <th className="px-4 py-2">Time</th>}
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
              {showTime && (
                <td className="px-4 py-2 text-zinc-600">
                  {formatDateTime(job.scheduled_start)}
                </td>
              )}
              <td className="px-4 py-2">
                <StatusBadge status={job.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
