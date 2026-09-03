import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/types";

export default async function MyJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: jobs }, { data: legRows }, { data: leggedJobIds }] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        "id, title, status, priority, scheduled_start, customers(name), sites(address, city)"
      )
      .eq("assigned_engineer_id", user?.id ?? "")
      .neq("status", "completed")
      .neq("status", "cancelled")
      .order("scheduled_start", { ascending: true, nullsFirst: false }),
    supabase
      .from("job_legs")
      .select(
        "id, description, status, scheduled_start, job_id, jobs(title, status, customers(name), sites(address, city))"
      )
      .eq("assigned_engineer_id", user?.id ?? "")
      .neq("status", "completed")
      .neq("status", "cancelled")
      .order("scheduled_start", { ascending: true, nullsFirst: false }),
    supabase.from("job_legs").select("job_id"),
  ]);

  const jobIdsWithLegs = new Set((leggedJobIds ?? []).map((r) => r.job_id));

  const items = [
    ...(jobs ?? [])
      .filter((j) => !jobIdsWithLegs.has(j.id))
      .map((j) => ({
        id: j.id,
        href: `/engineer/jobs/${j.id}`,
        title: j.title,
        status: j.status,
        jobStatus: null as string | null,
        scheduled_start: j.scheduled_start,
        customerName: j.customers?.name,
        siteAddress: j.sites?.address,
        siteCity: j.sites?.city,
      })),
    ...(legRows ?? [])
      .filter((l) => l.jobs)
      .map((l) => ({
        id: l.id,
        href: `/engineer/legs/${l.id}`,
        title: `${l.jobs!.title} — ${l.description}`,
        status: l.status,
        jobStatus: l.jobs!.status,
        scheduled_start: l.scheduled_start,
        customerName: l.jobs!.customers?.name,
        siteAddress: l.jobs!.sites?.address,
        siteCity: l.jobs!.sites?.city,
      })),
  ].sort((a, b) => {
    if (!a.scheduled_start) return 1;
    if (!b.scheduled_start) return -1;
    return a.scheduled_start.localeCompare(b.scheduled_start);
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-zinc-900">My jobs</h1>

      {items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm active:bg-zinc-50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-zinc-900">{item.title}</span>
                <div className="flex items-center gap-1.5">
                  {item.jobStatus && item.jobStatus !== item.status && (
                    <StatusBadge status={item.jobStatus} />
                  )}
                  <StatusBadge status={item.status} />
                </div>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {item.customerName}
              </p>
              <p className="text-sm text-zinc-500">
                {item.siteAddress}
                {item.siteCity ? `, ${item.siteCity}` : ""}
              </p>
              {item.scheduled_start && (
                <p className="mt-1 text-xs font-medium text-zinc-600">
                  {formatDateTime(item.scheduled_start)}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          No jobs assigned right now.
        </p>
      )}
    </div>
  );
}
