import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import {
  updateSettings,
  updateBrandColor,
  uploadLogo,
  removeLogo,
  updateBusinessDetails,
} from "./actions";
import { addJobType, deleteJobType, updateJobType } from "./job-types-actions";
import {
  addJobCategory,
  deleteJobCategory,
  updateJobCategory,
} from "./job-categories-actions";

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

  const { data: jobTypes } = await supabase
    .from("job_types")
    .select("id, name, enables_pat_testing")
    .order("name");

  const { data: jobCategories } = await supabase
    .from("job_categories")
    .select("id, name")
    .order("name");

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

      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Branding</h2>
        <p className="text-sm text-zinc-500">
          Sets the accent color and logo used across the office and engineer
          apps, and on the login screen.
        </p>
      </div>

      <div className="flex max-w-md flex-col gap-6 rounded-lg border border-zinc-200 bg-white p-6">
        <form action={updateBrandColor} className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700">
            Accent color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="brand_color"
              defaultValue={settings?.brand_color ?? "#2563eb"}
              className="h-10 w-14 cursor-pointer rounded-md border border-zinc-300 bg-white p-1"
            />
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Save color
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-2 border-t border-zinc-100 pt-6">
          <label className="text-sm font-medium text-zinc-700">Logo</label>
          {settings?.logo_url && (
            <div className="flex items-center gap-3">
              <Image
                src={settings.logo_url}
                alt="Current logo"
                width={160}
                height={48}
                unoptimized
                className="h-10 w-auto rounded border border-zinc-200 bg-zinc-50 object-contain p-1"
              />
              <form action={removeLogo}>
                <button
                  type="submit"
                  className="text-xs text-zinc-400 hover:text-red-600"
                >
                  Remove logo
                </button>
              </form>
            </div>
          )}
          <form action={uploadLogo} className="flex items-center gap-3">
            <input
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              required
              className="flex-1 text-sm text-zinc-600 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-50"
            />
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Upload
            </button>
          </form>
          <p className="text-xs text-zinc-500">
            Falls back to &quot;Field Service&quot; text when no logo is set.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Business details
        </h2>
        <p className="text-sm text-zinc-500">
          Appears on invoices &mdash; your legal name, ABN, and how
          customers should pay you.
        </p>
      </div>

      <form
        action={updateBusinessDetails}
        className="flex max-w-md flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
      >
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            Business name
          </label>
          <input
            name="business_name"
            defaultValue={settings?.business_name ?? ""}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">ABN</label>
          <input
            name="abn"
            defaultValue={settings?.abn ?? ""}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            Business address
          </label>
          <textarea
            name="business_address"
            rows={2}
            defaultValue={settings?.business_address ?? ""}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Phone</label>
            <input
              name="business_phone"
              defaultValue={settings?.business_phone ?? ""}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Email</label>
            <input
              type="email"
              name="business_email"
              defaultValue={settings?.business_email ?? ""}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="gst_registered"
            defaultChecked={settings?.gst_registered ?? true}
            className="h-4 w-4 rounded border-zinc-300"
          />
          Registered for GST
        </label>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">
              GST rate
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              name="gst_rate"
              defaultValue={settings?.gst_rate ?? 0.1}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <p className="text-xs text-zinc-500">e.g. 0.10 for 10%</p>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">
              Payment terms
            </label>
            <input
              type="number"
              min="0"
              name="payment_terms_days"
              defaultValue={settings?.payment_terms_days ?? 14}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <p className="text-xs text-zinc-500">Days until due</p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            Payment instructions
          </label>
          <textarea
            name="payment_instructions"
            rows={2}
            placeholder="e.g. Bank transfer to BSB 000-000, Acc 00000000"
            defaultValue={settings?.payment_instructions ?? ""}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="mt-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
        >
          Save
        </button>
      </form>

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

        <div className="flex flex-col gap-1 border-t border-zinc-100 pt-4">
          <label className="text-sm font-medium text-zinc-700">
            Week starts on
          </label>
          <select
            name="week_starts_on"
            defaultValue={settings?.week_starts_on ?? 1}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value={1}>Monday</option>
            <option value={0}>Sunday</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="show_weekends"
            defaultChecked={settings?.show_weekends ?? true}
            className="h-4 w-4 rounded border-zinc-300"
          />
          Show Saturday &amp; Sunday on the schedule
        </label>
        <p className="-mt-2 text-xs text-zinc-500">
          Unchecking this hides weekend columns from Week view and skips
          weekends when stepping through Day view with Prev/Next. Existing
          weekend jobs are unaffected and still show on the jobs list and
          &quot;Today&quot;.
        </p>

        <button
          type="submit"
          className="mt-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
        >
          Save
        </button>
      </form>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Job types</h2>
        <p className="text-sm text-zinc-500">
          Used when creating a job. Only job types with &quot;Enables PAT
          testing&quot; checked will show the PAT testing section on that
          job.
        </p>
      </div>

      <div className="max-w-md overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {jobTypes && jobTypes.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            {jobTypes.map((jt) => (
              <form
                key={jt.id}
                action={updateJobType}
                className="flex flex-wrap items-center gap-2 px-4 py-3"
              >
                <input type="hidden" name="id" value={jt.id} />
                <input
                  type="text"
                  name="name"
                  defaultValue={jt.name}
                  required
                  className="w-40 rounded-md border border-zinc-300 px-2 py-1 text-sm font-medium text-zinc-900"
                />
                <label className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <input
                    type="checkbox"
                    name="enables_pat_testing"
                    defaultChecked={jt.enables_pat_testing}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  Enables PAT testing
                </label>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Save
                </button>
                <button
                  type="submit"
                  formAction={deleteJobType}
                  className="ml-auto text-xs text-zinc-400 hover:text-red-600"
                >
                  Delete
                </button>
              </form>
            ))}
          </div>
        ) : (
          <p className="p-6 text-center text-sm text-zinc-500">
            No job types yet.
          </p>
        )}
      </div>

      <form
        action={addJobType}
        className="flex max-w-md flex-wrap items-center gap-2 rounded-lg border border-dashed border-zinc-300 p-4"
      >
        <input
          type="text"
          name="name"
          placeholder="New job type (e.g. Delivery)"
          required
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-1.5 text-xs text-zinc-600">
          <input
            type="checkbox"
            name="enables_pat_testing"
            className="h-4 w-4 rounded border-zinc-300"
          />
          Enables PAT testing
        </label>
        <button
          type="submit"
          className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover"
        >
          Add job type
        </button>
      </form>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Job categories
        </h2>
        <p className="text-sm text-zinc-500">
          A separate tag from job type, for slicing reporting later without
          changing what type of work a job is.
        </p>
      </div>

      <div className="max-w-md overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {jobCategories && jobCategories.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            {jobCategories.map((jc) => (
              <form
                key={jc.id}
                action={updateJobCategory}
                className="flex flex-wrap items-center gap-2 px-4 py-3"
              >
                <input type="hidden" name="id" value={jc.id} />
                <input
                  type="text"
                  name="name"
                  defaultValue={jc.name}
                  required
                  className="w-40 flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm font-medium text-zinc-900"
                />
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Save
                </button>
                <button
                  type="submit"
                  formAction={deleteJobCategory}
                  className="text-xs text-zinc-400 hover:text-red-600"
                >
                  Delete
                </button>
              </form>
            ))}
          </div>
        ) : (
          <p className="p-6 text-center text-sm text-zinc-500">
            No job categories yet.
          </p>
        )}
      </div>

      <form
        action={addJobCategory}
        className="flex max-w-md flex-wrap items-center gap-2 rounded-lg border border-dashed border-zinc-300 p-4"
      >
        <input
          type="text"
          name="name"
          placeholder="New category (e.g. Reactive Maintenance)"
          required
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover"
        >
          Add category
        </button>
      </form>
    </div>
  );
}
