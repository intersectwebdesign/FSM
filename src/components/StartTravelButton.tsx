"use client";

import { updateJobStatus } from "@/app/office/jobs/actions";
import { updateLegStatus } from "@/app/office/jobs/legs-actions";
import { openMaps, type MapsProvider } from "@/lib/maps";

export function StartTravelButton({
  id,
  kind = "job",
  mapsQuery,
  provider,
}: {
  id: string;
  kind?: "job" | "leg";
  mapsQuery: string;
  provider: MapsProvider;
}) {
  const action = kind === "job" ? updateJobStatus : updateLegStatus;
  const idField = kind === "job" ? "job_id" : "leg_id";

  return (
    <form action={action}>
      <input type="hidden" name={idField} value={id} />
      <input type="hidden" name="status" value="travelling" />
      <button
        type="submit"
        onClick={() => openMaps(mapsQuery, provider)}
        className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white"
      >
        Start Travel
      </button>
    </form>
  );
}
