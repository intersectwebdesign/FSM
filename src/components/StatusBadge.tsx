import { STATUS_COLORS, STATUS_LABELS, type JobStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: string }) {
  const s = status as JobStatus;
  const color = STATUS_COLORS[s] ?? "bg-zinc-200 text-zinc-800";
  const label = STATUS_LABELS[s] ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {label}
    </span>
  );
}
