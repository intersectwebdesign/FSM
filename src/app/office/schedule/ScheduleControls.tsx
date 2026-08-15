"use client";

import { useRouter } from "next/navigation";

type Engineer = { id: string; full_name: string };

export function ScheduleControls({
  mode,
  dateStr,
  todayStr,
  prevStr,
  nextStr,
  engineers,
  selectedEngineerId,
}: {
  mode: "day" | "week";
  dateStr: string;
  todayStr: string;
  prevStr: string;
  nextStr: string;
  engineers: Engineer[];
  selectedEngineerId: string | null;
}) {
  const router = useRouter();

  function navigate(params: Record<string, string>) {
    const search = new URLSearchParams({
      view: mode,
      date: dateStr,
      ...(selectedEngineerId ? { engineer: selectedEngineerId } : {}),
      ...params,
    });
    router.push(`/office/schedule?${search.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate({ view: "day" })}
          className={`rounded-md border px-3 py-1.5 ${
            mode === "day"
              ? "border-brand bg-brand text-white"
              : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          Day
        </button>
        <button
          onClick={() => navigate({ view: "week" })}
          className={`rounded-md border px-3 py-1.5 ${
            mode === "week"
              ? "border-brand bg-brand text-white"
              : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          Week
        </button>

        {mode === "week" && (
          <select
            value={selectedEngineerId ?? ""}
            onChange={(e) => navigate({ engineer: e.target.value })}
            className="rounded-md border border-zinc-300 px-3 py-1.5"
          >
            {engineers.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate({ date: prevStr })}
          className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50"
        >
          &larr; Prev
        </button>
        <button
          onClick={() => navigate({ date: todayStr })}
          className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50"
        >
          Today
        </button>
        <button
          onClick={() => navigate({ date: nextStr })}
          className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
