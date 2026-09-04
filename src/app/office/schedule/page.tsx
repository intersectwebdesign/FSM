import { createClient } from "@/lib/supabase/server";
import {
  addDays,
  dateKey,
  parseDateKey,
  startOfWeek,
  stepDay,
} from "@/lib/scheduleLayout";
import { dateKeyInTimeZone, startOfDayUtc } from "@/lib/timezone";
import { ScheduleControls } from "./ScheduleControls";
import { ScheduleGrid } from "./ScheduleGrid";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; engineer?: string }>;
}) {
  const { view, date, engineer } = await searchParams;
  const mode = view === "week" ? "week" : "day";

  const supabase = await createClient();

  const [{ data: engineers }, { data: settings }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "engineer")
      .order("full_name"),
    supabase.from("company_settings").select("*").eq("id", 1).single(),
  ]);

  const weekStartsOn = settings?.week_starts_on ?? 1;
  const showWeekends = settings?.show_weekends ?? true;

  const todayKey = dateKeyInTimeZone(new Date().toISOString());
  let anchorDate = parseDateKey(date || todayKey);
  anchorDate.setHours(0, 0, 0, 0);
  if (mode === "week") {
    anchorDate = startOfWeek(anchorDate, weekStartsOn);
  }

  const rangeStart = anchorDate;
  const rangeEnd = addDays(anchorDate, mode === "week" ? 7 : 1);
  const rangeStartUtc = startOfDayUtc(dateKey(rangeStart));
  const rangeEndUtc = startOfDayUtc(dateKey(rangeEnd));

  const selectedEngineerId =
    mode === "week" ? engineer || engineers?.[0]?.id || null : null;

  let jobsQuery = supabase
    .from("jobs")
    .select(
      "id, title, status, scheduled_start, scheduled_end, assigned_engineer_id, customers(name), sites(address, city)"
    )
    .not("scheduled_start", "is", null)
    .gte("scheduled_start", rangeStartUtc)
    .lt("scheduled_start", rangeEndUtc);

  if (mode === "week" && selectedEngineerId) {
    jobsQuery = jobsQuery.eq("assigned_engineer_id", selectedEngineerId);
  }

  let legsQuery = supabase
    .from("job_legs")
    .select(
      "id, description, status, scheduled_start, scheduled_end, assigned_engineer_id, job_id, jobs(id, title, customers(name), sites(address, city))"
    )
    .not("scheduled_start", "is", null)
    .gte("scheduled_start", rangeStartUtc)
    .lt("scheduled_start", rangeEndUtc);

  if (mode === "week" && selectedEngineerId) {
    legsQuery = legsQuery.eq("assigned_engineer_id", selectedEngineerId);
  }

  const [{ data: jobs }, { data: unscheduledJobs }, { data: legRows }, { data: leggedJobIds }] =
    await Promise.all([
      jobsQuery,
      supabase
        .from("jobs")
        .select(
          "id, title, status, scheduled_start, scheduled_end, assigned_engineer_id, customers(name), sites(address, city)"
        )
        .or("status.eq.unscheduled,scheduled_start.is.null")
        .order("created_at", { ascending: false }),
      legsQuery,
      supabase.from("job_legs").select("job_id"),
    ]);

  const jobIdsWithLegs = new Set((leggedJobIds ?? []).map((r) => r.job_id));
  const filteredJobs = (jobs ?? []).filter((j) => !jobIdsWithLegs.has(j.id));
  const filteredUnscheduledJobs = (unscheduledJobs ?? []).filter(
    (j) => !jobIdsWithLegs.has(j.id)
  );
  const legs = (legRows ?? [])
    .filter((l) => l.jobs)
    .map((l) => ({
      id: l.id,
      title: l.jobs!.title,
      status: l.status,
      scheduled_start: l.scheduled_start,
      scheduled_end: l.scheduled_end,
      assigned_engineer_id: l.assigned_engineer_id,
      customers: l.jobs!.customers,
      sites: l.jobs!.sites,
      kind: "leg" as const,
      legDescription: l.description,
      parentJobId: l.job_id,
    }));

  const prevDate =
    mode === "week"
      ? addDays(anchorDate, -7)
      : stepDay(anchorDate, -1, !showWeekends);
  const nextDate =
    mode === "week"
      ? addDays(anchorDate, 7)
      : stepDay(anchorDate, 1, !showWeekends);

  const rangeLabel =
    mode === "week"
      ? `${anchorDate.toLocaleDateString("en-AU", { day: "numeric", month: "short" })} – ${addDays(
          anchorDate,
          6
        ).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`
      : anchorDate.toLocaleDateString("en-AU", { dateStyle: "full" });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Schedule</h1>
        <p className="text-sm text-zinc-500">{rangeLabel}</p>
      </div>

      <ScheduleControls
        mode={mode}
        dateStr={dateKey(anchorDate)}
        todayStr={todayKey}
        prevStr={dateKey(prevDate)}
        nextStr={dateKey(nextDate)}
        engineers={engineers ?? []}
        selectedEngineerId={selectedEngineerId}
      />

      <ScheduleGrid
        key={`${mode}-${dateKey(anchorDate)}-${selectedEngineerId ?? ""}`}
        mode={mode}
        anchorDate={anchorDate}
        engineers={engineers ?? []}
        selectedEngineerId={selectedEngineerId}
        showWeekends={showWeekends}
        settings={
          settings ?? { day_start_hour: 7, day_end_hour: 19, slot_minutes: 30 }
        }
        jobs={filteredJobs}
        legs={legs}
        unscheduledJobs={filteredUnscheduledJobs}
      />
    </div>
  );
}
