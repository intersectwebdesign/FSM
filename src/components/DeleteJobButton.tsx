"use client";

import { deleteJob } from "@/app/office/jobs/actions";

export function DeleteJobButton({ jobId }: { jobId: string }) {
  return (
    <form
      action={deleteJob}
      onSubmit={(e) => {
        if (
          !confirm(
            "Delete this job? This permanently removes its materials, expenses, photos, PAT tests, legs, and history. This cannot be undone."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="job_id" value={jobId} />
      <button
        type="submit"
        className="w-full rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Delete job
      </button>
    </form>
  );
}
