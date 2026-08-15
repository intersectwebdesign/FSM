"use client";

import { useMemo, useState } from "react";
import { updateJobDetails } from "../actions";
import { JOB_PRIORITIES } from "@/lib/types";

type Customer = { id: string; name: string };
type Site = { id: string; customer_id: string; address: string };
type JobType = { id: string; name: string };
type JobCategory = { id: string; name: string };

export function EditJobForm({
  jobId,
  customers,
  sites,
  jobTypes,
  jobCategories,
  defaultCustomerId,
  defaultSiteId,
  defaultTitle,
  defaultDescription,
  defaultPriority,
  defaultJobTypeId,
  defaultCategoryId,
  defaultPoReference,
  defaultIsOvertime,
  defaultChargeCallout,
  defaultMileageKm,
}: {
  jobId: string;
  customers: Customer[];
  sites: Site[];
  jobTypes: JobType[];
  jobCategories: JobCategory[];
  defaultCustomerId: string;
  defaultSiteId: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultPriority: string;
  defaultJobTypeId: string;
  defaultCategoryId: string;
  defaultPoReference: string;
  defaultIsOvertime: boolean;
  defaultChargeCallout: boolean;
  defaultMileageKm: number | null;
}) {
  const [customerId, setCustomerId] = useState(defaultCustomerId);

  const filteredSites = useMemo(
    () => sites.filter((s) => s.customer_id === customerId),
    [sites, customerId]
  );

  return (
    <form
      action={updateJobDetails}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4"
    >
      <input type="hidden" name="job_id" value={jobId} />
      <h3 className="text-sm font-medium text-zinc-900">Edit job</h3>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500">Title</label>
        <input
          name="title"
          defaultValue={defaultTitle}
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500">Description</label>
        <textarea
          name="description"
          defaultValue={defaultDescription}
          rows={3}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      {jobTypes.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Job type</label>
          <select
            name="job_type_id"
            defaultValue={defaultJobTypeId}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">No type set</option>
            {jobTypes.map((jt) => (
              <option key={jt.id} value={jt.id}>
                {jt.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500">Customer</label>
        <select
          name="customer_id"
          required
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500">Site</label>
        <select
          name="site_id"
          required
          defaultValue={defaultSiteId}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          {filteredSites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.address}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500">Priority</label>
        <select
          name="priority"
          defaultValue={defaultPriority}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          {JOB_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p[0].toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {jobCategories.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Category</label>
          <select
            name="category_id"
            defaultValue={defaultCategoryId}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">No category</option>
            {jobCategories.map((jc) => (
              <option key={jc.id} value={jc.id}>
                {jc.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500">
          Customer PO / reference number
        </label>
        <input
          name="po_reference"
          defaultValue={defaultPoReference}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1 border-t border-zinc-100 pt-3">
        <label className="text-xs text-zinc-500">Mileage (km)</label>
        <input
          type="number"
          step="0.1"
          name="mileage_km"
          defaultValue={defaultMileageKm ?? ""}
          placeholder="0"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-zinc-700">
        <input
          type="checkbox"
          name="is_overtime"
          defaultChecked={defaultIsOvertime}
          className="h-4 w-4 rounded border-zinc-300"
        />
        Bill this job at the overtime rate
      </label>

      <label className="flex items-center gap-2 text-xs text-zinc-700">
        <input
          type="checkbox"
          name="charge_callout"
          defaultChecked={defaultChargeCallout}
          className="h-4 w-4 rounded border-zinc-300"
        />
        Charge a call-out fee
      </label>

      <button
        type="submit"
        className="self-start rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover"
      >
        Save
      </button>
    </form>
  );
}
