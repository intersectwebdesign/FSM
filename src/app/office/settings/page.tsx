import { createClient } from "@/lib/supabase/server";
import { updateSettings } from "./actions";

function formatHour(h: number) {
  if (h === 0 || h === 24) return "12:00 AM";
  if (h === 12) return "12:00 PM";
  return h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("company_settings")
    .select("*")
    .eq("id", 1)
    .single();

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const endHours = Array.from({ length: 24 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500">
          Controls the visible hour range and drag-snap increment on the
          schedule calendar.
        </p>
      </div>

      <form
        action={updateSettings}
        className="flex max-w-md flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
      >
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            Day starts at
          </label>
          <select
            name="day_start_hour"
            defaultValue={settings?.day_start_hour ?? 7}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            {hours.map((h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            Day ends at
          </label>
          <select
            name="day_end_hour"
            defaultValue={settings?.day_end_hour ?? 19}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            {endHours.map((h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            Drag snap increment
          </label>
          <select
            name="slot_minutes"
            defaultValue={settings?.slot_minutes ?? 30}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            Default maps app
          </label>
          <p className="text-xs text-zinc-500">
            Used when tapping a job address or &quot;Start Travel&quot;.
          </p>
          <select
            name="maps_provider"
            defaultValue={settings?.maps_provider ?? "apple"}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="apple">Apple Maps</option>
            <option value="google">Google Maps</option>
          </select>
        </div>

        <button
          type="submit"
          className="mt-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Save
        </button>
      </form>
    </div>
  );
}
