"use client";

import { useMemo, useState } from "react";
import { createJob } from "../actions";
import { JOB_PRIORITIES } from "@/lib/types";

type Customer = { id: string; name: string };
type Site = { id: string; customer_id: string; address: string };
type Engineer = { id: string; full_name: string };

export function NewJobForm({
  customers,
  sites,
  engineers,
  defaultCustomerId,
}: {
  customers: Customer[];
  sites: Site[];
  engineers: Engineer[];
  defaultCustomerId?: string;
}) {
  const [customerId, setCustomerId] = useState(defaultCustomerId ?? "");

  const filteredSites = useMemo(
    () => sites.filter((s) => s.customer_id === customerId),
    [sites, customerId]
  );

  return (
    <form
      action={createJob}
      className="flex max-w-lg flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
    >
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Title</label>
        <input
          name="title"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">
          Description
        </label>
        <textarea
          name="description"
          rows={3}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Customer</label>
        <select
          name="customer_id"
          required
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">Select a customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Site</label>
        <select
          name="site_id"
          required
          disabled={!customerId}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-100"
        >
          <option value="">
            {customerId ? "Select a site" : "Select a customer first"}
          </option>
          {filteredSites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.address}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            Priority
          </label>
          <select
            name="priority"
            defaultValue="medium"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            {JOB_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p[0].toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">
            Assign engineer
          </label>
          <select
            name="assigned_engineer_id"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Unassigned</option>
            {engineers.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Start</label>
          <input
            type="datetime-local"
            name="scheduled_start"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">End</label>
          <input
            type="datetime-local"
            name="scheduled_end"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Create job
      </button>
    </form>
  );
}
