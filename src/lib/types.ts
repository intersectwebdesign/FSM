import { BUSINESS_TIMEZONE } from "./timezone";

export type UserRole = "office" | "engineer";
export type JobStatus =
  | "unscheduled"
  | "scheduled"
  | "in_progress"
  | "travelling"
  | "on_site"
  | "paused"
  | "completed"
  | "cancelled";
export type JobPriority = "low" | "medium" | "high";

export const JOB_STATUSES: JobStatus[] = [
  "unscheduled",
  "scheduled",
  "travelling",
  "on_site",
  "paused",
  "completed",
  "cancelled",
];

export const JOB_PRIORITIES: JobPriority[] = ["low", "medium", "high"];

export const STATUS_LABELS: Record<JobStatus, string> = {
  unscheduled: "Unscheduled",
  scheduled: "Scheduled",
  in_progress: "In progress",
  travelling: "Travelling",
  on_site: "On site",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Simplified to three status colors: green = done, blue = scheduled and
// waiting, yellow = pending/needs attention (everything still in flux).
// Cancelled stays its own color since "won't happen" isn't "not done yet".
export const STATUS_COLORS: Record<JobStatus, string> = {
  unscheduled: "bg-yellow-100 text-yellow-800",
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  travelling: "bg-yellow-100 text-yellow-800",
  on_site: "bg-yellow-100 text-yellow-800",
  paused: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export function formatCurrency(amount: number | null | undefined): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount ?? 0);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: BUSINESS_TIMEZONE,
  });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-AU", {
    dateStyle: "medium",
    timeZone: BUSINESS_TIMEZONE,
  });
}

export type PatResult = "pass" | "fail";

export const DEFAULT_RETEST_MONTHS = 12;

export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "-";
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
