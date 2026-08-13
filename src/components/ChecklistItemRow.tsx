"use client";

import {
  deleteChecklistItem,
  toggleChecklistItem,
} from "@/app/office/jobs/checklist-actions";

export function ChecklistItemRow({
  item,
  jobId,
  canDelete,
}: {
  item: { id: string; description: string; is_checked: boolean };
  jobId: string;
  canDelete: boolean;
}) {
  return (
    <li className="flex items-center gap-2 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2">
      <form action={toggleChecklistItem} className="flex flex-1 items-center gap-2">
        <input type="hidden" name="item_id" value={item.id} />
        <input type="hidden" name="job_id" value={jobId} />
        <input
          type="hidden"
          name="checked"
          value={item.is_checked ? "false" : "true"}
        />
        <input
          type="checkbox"
          defaultChecked={item.is_checked}
          onClick={(e) => e.currentTarget.form?.requestSubmit()}
          className="h-4 w-4 rounded border-zinc-300"
        />
        <span
          className={`text-sm ${
            item.is_checked ? "text-zinc-400 line-through" : "text-zinc-900"
          }`}
        >
          {item.description}
        </span>
      </form>
      {canDelete && (
        <form action={deleteChecklistItem}>
          <input type="hidden" name="item_id" value={item.id} />
          <input type="hidden" name="job_id" value={jobId} />
          <button
            type="submit"
            className="text-xs text-zinc-400 hover:text-red-600"
            aria-label="Delete item"
          >
            ✕
          </button>
        </form>
      )}
    </li>
  );
}
