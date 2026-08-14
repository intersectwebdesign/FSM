"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { StatusBadge } from "@/components/StatusBadge";
import { addDays, dateKey, layoutOverlaps } from "@/lib/scheduleLayout";
import {
  dateKeyInTimeZone,
  localInputToUtcIso,
  minutesFromMidnightInTimeZone,
} from "@/lib/timezone";
import { rescheduleJobDrag } from "../jobs/actions";
import { rescheduleLegDrag } from "../jobs/legs-actions";

const HOUR_HEIGHT = 60;
const MIN_CARD_HEIGHT = 26;

type JobRow = {
  id: string;
  title: string;
  status: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  assigned_engineer_id: string | null;
  customers: { name: string } | null;
  sites: { address: string; city: string | null } | null;
  kind?: "job" | "leg";
  legDescription?: string;
  parentJobId?: string;
};

type Engineer = { id: string; full_name: string };
type Settings = { day_start_hour: number; day_end_hour: number; slot_minutes: number };

type Column = {
  key: string;
  label: string;
  sublabel?: string;
  date: Date;
  engineerId: string | null;
};

export function ScheduleGrid({
  mode,
  anchorDate,
  engineers,
  selectedEngineerId,
  settings,
  jobs,
  legs = [],
  unscheduledJobs,
}: {
  mode: "day" | "week";
  anchorDate: Date;
  engineers: Engineer[];
  selectedEngineerId: string | null;
  settings: Settings;
  jobs: JobRow[];
  legs?: JobRow[];
  unscheduledJobs: JobRow[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [localJobs, setLocalJobs] = useState(() => [
    ...jobs.map((j) => ({ ...j, kind: "job" as const })),
    ...legs,
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const columns: Column[] = useMemo(() => {
    if (mode === "day") {
      return engineers.map((e) => ({
        key: e.id,
        label: e.full_name,
        date: anchorDate,
        engineerId: e.id,
      }));
    }
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(anchorDate, i);
      return {
        key: dateKey(d),
        label: d.toLocaleDateString("en-AU", { weekday: "short" }),
        sublabel: d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
        date: d,
        engineerId: selectedEngineerId,
      };
    });
  }, [mode, anchorDate, engineers, selectedEngineerId]);

  const totalHours = settings.day_end_hour - settings.day_start_hour;
  const gridHeight = totalHours * HOUR_HEIGHT;
  const hourMarks = Array.from({ length: totalHours + 1 }, (_, i) => settings.day_start_hour + i);

  function jobsForColumn(col: Column) {
    const engineerId = mode === "day" ? col.engineerId : selectedEngineerId;
    return localJobs.filter((j) => {
      if (!j.scheduled_start) return false;
      if (j.assigned_engineer_id !== engineerId) return false;
      return dateKeyInTimeZone(j.scheduled_start) === dateKey(col.date);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over, delta } = event;
    if (!over) return;

    const rawId = String(active.id);
    const dragKind: "job" | "leg" = rawId.startsWith("leg:") ? "leg" : "job";
    const jobId = rawId.replace(/^(job|leg):/, "");
    const targetKey = String(over.id).replace(/^col:/, "");
    const targetColumn = columns.find((c) => c.key === targetKey);
    if (!targetColumn) return;

    const targetEngineerId =
      mode === "day" ? targetColumn.engineerId : selectedEngineerId;
    if (!targetEngineerId) return;

    const data = active.data.current as
      | { fromTray: true; durationMinutes: number }
      | { fromTray: false; originTopPx: number; durationMinutes: number };

    let newTopPx: number;
    if (data.fromTray) {
      // Approximate drop position from the dragged element's final rect
      // relative to the target column's rect.
      const activeRect = active.rect.current.translated;
      const overRect = over.rect;
      newTopPx = activeRect ? activeRect.top - overRect.top : 0;
    } else {
      newTopPx = data.originTopPx + delta.y;
    }

    newTopPx = Math.max(0, Math.min(newTopPx, gridHeight - MIN_CARD_HEIGHT));

    const slot = settings.slot_minutes;
    let startMinutesOfDay =
      settings.day_start_hour * 60 + (newTopPx / HOUR_HEIGHT) * 60;
    startMinutesOfDay = Math.round(startMinutesOfDay / slot) * slot;

    const newStart = new Date(targetColumn.date);
    newStart.setHours(0, startMinutesOfDay, 0, 0);
    const newEnd = new Date(newStart.getTime() + data.durationMinutes * 60000);

    const pad = (n: number) => String(n).padStart(2, "0");
    const toLocalInputString = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
        d.getHours()
      )}:${pad(d.getMinutes())}`;
    const newStartLocal = toLocalInputString(newStart);
    const newEndLocal = toLocalInputString(newEnd);
    const newStartUtc = localInputToUtcIso(newStartLocal);
    const newEndUtc = localInputToUtcIso(newEndLocal);

    setLocalJobs((prev) => {
      const withoutTray = prev.filter((j) => j.id !== jobId);
      const existing = prev.find((j) => j.id === jobId);
      const base: JobRow =
        existing ??
        unscheduledJobs.find((j) => j.id === jobId) ?? {
          id: jobId,
          title: "",
          status: "scheduled",
          scheduled_start: null,
          scheduled_end: null,
          assigned_engineer_id: null,
          customers: null,
          sites: null,
          kind: dragKind,
        };
      return [
        ...withoutTray,
        {
          ...base,
          scheduled_start: newStartUtc,
          scheduled_end: newEndUtc,
          assigned_engineer_id: targetEngineerId,
          status: base.status === "unscheduled" ? "scheduled" : base.status,
        },
      ];
    });

    startTransition(async () => {
      if (dragKind === "leg") {
        await rescheduleLegDrag(jobId, targetEngineerId, newStartLocal, newEndLocal);
      } else {
        await rescheduleJobDrag(jobId, targetEngineerId, newStartLocal, newEndLocal);
      }
      router.refresh();
    });
  }

  const tray = unscheduledJobs.filter(
    (u) => !localJobs.some((j) => j.id === u.id)
  );

  return (
    <DndContext id="schedule-grid" sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <div
            className="grid"
            style={{ gridTemplateColumns: `60px repeat(${columns.length}, minmax(160px, 1fr))` }}
          >
            <div className="border-b border-r border-zinc-100" />
            {columns.map((col) => (
              <div
                key={col.key}
                className="border-b border-r border-zinc-100 px-2 py-2 text-center last:border-r-0"
              >
                <p className="text-sm font-medium text-zinc-900">{col.label}</p>
                {col.sublabel && (
                  <p className="text-xs text-zinc-500">{col.sublabel}</p>
                )}
              </div>
            ))}

            <div style={{ height: gridHeight }} className="relative border-r border-zinc-100">
              {hourMarks.map((h, i) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-zinc-100 pr-1 text-right text-xs text-zinc-400"
                  style={{ top: i * HOUR_HEIGHT }}
                >
                  {h % 24}:00
                </div>
              ))}
            </div>

            {columns.map((col) => (
              <GridColumn
                key={col.key}
                col={col}
                gridHeight={gridHeight}
                hourMarks={hourMarks}
                dayStartHour={settings.day_start_hour}
                jobs={jobsForColumn(col)}
              />
            ))}
          </div>
        </div>

        <UnscheduledTray jobs={tray} />
      </div>
    </DndContext>
  );
}

function GridColumn({
  col,
  gridHeight,
  hourMarks,
  dayStartHour,
  jobs,
}: {
  col: Column;
  gridHeight: number;
  hourMarks: number[];
  dayStartHour: number;
  jobs: JobRow[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${col.key}` });

  const positioned = useMemo(() => {
    const items = jobs.map((j) => {
      const startMin = minutesFromMidnightInTimeZone(j.scheduled_start!);
      const endMin = j.scheduled_end
        ? Math.max(startMin + 15, minutesFromMidnightInTimeZone(j.scheduled_end))
        : startMin + 60;
      return { id: j.id, startMin, endMin, job: j };
    });
    const lanes = layoutOverlaps(items);
    return items.map((item) => {
      const lane = lanes.get(item.id) ?? { lane: 0, laneCount: 1 };
      const top = ((item.startMin - dayStartHour * 60) / 60) * HOUR_HEIGHT;
      const height = Math.max(
        MIN_CARD_HEIGHT,
        ((item.endMin - item.startMin) / 60) * HOUR_HEIGHT
      );
      return { ...item, top, height, ...lane };
    });
  }, [jobs, dayStartHour]);

  return (
    <div
      ref={setNodeRef}
      className={`relative border-r border-zinc-100 last:border-r-0 ${
        isOver ? "bg-blue-50" : ""
      }`}
      style={{ height: gridHeight }}
    >
      {hourMarks.slice(0, -1).map((h, i) => (
        <div
          key={h}
          className="absolute left-0 right-0 border-t border-zinc-100"
          style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
        />
      ))}
      {positioned.map((p) => (
        <JobCard
          key={p.id}
          job={p.job}
          top={p.top}
          height={p.height}
          lane={p.lane}
          laneCount={p.laneCount}
        />
      ))}
    </div>
  );
}

function JobCard({
  job,
  top,
  height,
  lane,
  laneCount,
}: {
  job: JobRow;
  top: number;
  height: number;
  lane: number;
  laneCount: number;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${job.kind ?? "job"}:${job.id}`,
    data: { fromTray: false, originTopPx: top, durationMinutes: (height / HOUR_HEIGHT) * 60 },
  });

  const widthPct = 100 / laneCount;
  const leftPct = lane * widthPct;

  const colorClass =
    {
      unscheduled: "bg-zinc-100 border-zinc-300",
      scheduled: "bg-blue-50 border-blue-300",
      in_progress: "bg-amber-50 border-amber-300",
      travelling: "bg-purple-50 border-purple-300",
      on_site: "bg-orange-50 border-orange-300",
      paused: "bg-slate-100 border-slate-300",
      completed: "bg-green-50 border-green-300",
      cancelled: "bg-red-50 border-red-300",
    }[job.status] ?? "bg-zinc-100 border-zinc-300";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        position: "absolute",
        top,
        height,
        left: `${leftPct}%`,
        width: `calc(${widthPct}% - 4px)`,
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        zIndex: isDragging ? 20 : 1,
      }}
      className={`overflow-hidden rounded-md border p-1 text-xs shadow-sm ${colorClass} ${
        isDragging ? "opacity-70" : ""
      } cursor-grab active:cursor-grabbing`}
    >
      <Link
        href={`/office/jobs/${job.kind === "leg" ? job.parentJobId : job.id}`}
        onClick={(e) => e.stopPropagation()}
        className="block h-full"
      >
        <p className="truncate font-medium text-zinc-900">
          {job.kind === "leg" ? `${job.customers?.name} — ${job.legDescription}` : job.title}
        </p>
        <p className="truncate text-zinc-500">
          {job.kind === "leg" ? job.title : job.customers?.name}
        </p>
        {job.sites && (
          <p className="truncate text-zinc-400">
            {job.sites.city || job.sites.address}
          </p>
        )}
      </Link>
    </div>
  );
}

function UnscheduledTray({ jobs }: { jobs: JobRow[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: "tray" });

  return (
    <div
      ref={setNodeRef}
      className={`flex h-fit flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 ${
        isOver ? "bg-amber-50" : ""
      }`}
    >
      <h2 className="text-sm font-medium text-zinc-900">
        Unscheduled ({jobs.length})
      </h2>
      <p className="text-xs text-zinc-500">
        Drag a job onto the grid to schedule it.
      </p>
      <div className="flex flex-col gap-2">
        {jobs.map((job) => (
          <TrayCard key={job.id} job={job} />
        ))}
        {jobs.length === 0 && (
          <p className="text-xs text-zinc-400">Nothing unscheduled.</p>
        )}
      </div>
    </div>
  );
}

function TrayCard({ job }: { job: JobRow }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `job:${job.id}`,
    data: { fromTray: true, durationMinutes: 60 },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        zIndex: isDragging ? 20 : undefined,
      }}
      className={`cursor-grab rounded-md border border-amber-200 bg-amber-50 p-2 text-xs active:cursor-grabbing ${
        isDragging ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-medium text-zinc-900">{job.title}</p>
        <StatusBadge status={job.status} />
      </div>
      <p className="truncate text-zinc-500">
        {job.customers?.name} &middot; {job.sites?.address}
      </p>
    </div>
  );
}
