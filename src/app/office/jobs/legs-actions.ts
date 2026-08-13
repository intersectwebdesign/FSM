"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesUpdate } from "@/lib/database.types";
import { validScheduledEnd } from "@/lib/scheduleLayout";
import { localInputToUtcIso } from "@/lib/timezone";

const ACTIVE_LEG_STATUSES = ["travelling", "on_site"];

async function recomputeJobRollupStatus(
  supabase: SupabaseClient<Database>,
  jobId: string
) {
  const { data: legs } = await supabase
    .from("job_legs")
    .select("status, scheduled_start, completed_at")
    .eq("job_id", jobId);

  if (!legs || legs.length === 0) return;

  const { data: job } = await supabase
    .from("jobs")
    .select("status")
    .eq("id", jobId)
    .single();
  if (!job) return;

  let nextStatus: string;
  if (legs.every((l) => l.status === "cancelled")) {
    nextStatus = "cancelled";
  } else if (legs.every((l) => l.status === "completed" || l.status === "cancelled")) {
    nextStatus = "completed";
  } else if (
    legs.some((l) => ACTIVE_LEG_STATUSES.includes(l.status) || l.status === "completed")
  ) {
    nextStatus = "in_progress";
  } else if (legs.some((l) => l.scheduled_start)) {
    nextStatus = "scheduled";
  } else {
    nextStatus = "unscheduled";
  }

  if (nextStatus === job.status) return;

  const update: TablesUpdate<"jobs"> = { status: nextStatus };
  if (nextStatus === "completed") {
    const latestCompletion = legs
      .map((l) => l.completed_at)
      .filter((d): d is string => !!d)
      .sort()
      .at(-1);
    if (latestCompletion) update.completed_at = latestCompletion;
  }

  await supabase.from("jobs").update(update).eq("id", jobId);
  await supabase.from("job_status_history").insert({
    job_id: jobId,
    status: nextStatus,
    note: "Auto-updated from leg status",
  });
}

export async function addLeg(formData: FormData) {
  const jobId = String(formData.get("job_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const assignedEngineerId = String(formData.get("assigned_engineer_id") ?? "");
  const scheduledStartLocal = String(formData.get("scheduled_start") ?? "");
  const scheduledEndLocal = validScheduledEnd(
    scheduledStartLocal,
    String(formData.get("scheduled_end") ?? "")
  );
  const scheduledStart = localInputToUtcIso(scheduledStartLocal);
  const scheduledEnd = localInputToUtcIso(scheduledEndLocal);

  if (!jobId || !description) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count } = await supabase
    .from("job_legs")
    .select("id", { count: "exact", head: true })
    .eq("job_id", jobId);

  const status = scheduledStart
    ? assignedEngineerId
      ? "scheduled"
      : "unscheduled"
    : "unscheduled";

  const { data: leg, error } = await supabase
    .from("job_legs")
    .insert({
      job_id: jobId,
      sequence: (count ?? 0) + 1,
      description,
      status,
      assigned_engineer_id: assignedEngineerId || null,
      scheduled_start: scheduledStart || null,
      scheduled_end: scheduledEnd || null,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("job_leg_status_history").insert({
    leg_id: leg.id,
    status,
    changed_by: user?.id ?? null,
    note: "Leg created",
  });

  await recomputeJobRollupStatus(supabase, jobId);

  revalidatePath(`/office/jobs/${jobId}`);
  revalidatePath("/office/schedule");
  revalidatePath("/engineer");
}

async function applyLegSchedule(
  legId: string,
  assignedEngineerId: string,
  scheduledStartLocal: string,
  scheduledEndLocalInput: string
) {
  const scheduledEndLocal = validScheduledEnd(
    scheduledStartLocal,
    scheduledEndLocalInput
  );
  const scheduledStart = localInputToUtcIso(scheduledStartLocal);
  const scheduledEnd = localInputToUtcIso(scheduledEndLocal);
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("job_legs")
    .select("job_id, status")
    .eq("id", legId)
    .single();
  if (!current) return;

  let status = current.status;
  if (status === "unscheduled" && scheduledStart && assignedEngineerId) {
    status = "scheduled";
  }

  const { error } = await supabase
    .from("job_legs")
    .update({
      assigned_engineer_id: assignedEngineerId || null,
      scheduled_start: scheduledStart || null,
      scheduled_end: scheduledEnd || null,
      status,
    })
    .eq("id", legId);

  if (error) throw new Error(error.message);

  if (status !== current.status) {
    await supabase.from("job_leg_status_history").insert({
      leg_id: legId,
      status,
      note: "Rescheduled/assigned",
    });
  }

  await recomputeJobRollupStatus(supabase, current.job_id);

  revalidatePath(`/office/jobs/${current.job_id}`);
  revalidatePath("/office/schedule");
}

export async function updateLegSchedule(formData: FormData) {
  const legId = String(formData.get("leg_id") ?? "");
  const assignedEngineerId = String(formData.get("assigned_engineer_id") ?? "");
  const scheduledStart = String(formData.get("scheduled_start") ?? "");
  const scheduledEnd = String(formData.get("scheduled_end") ?? "");
  if (!legId) return;

  await applyLegSchedule(legId, assignedEngineerId, scheduledStart, scheduledEnd);
}

export async function rescheduleLegDrag(
  legId: string,
  assignedEngineerId: string,
  scheduledStart: string,
  scheduledEnd: string
) {
  if (!legId) return;
  await applyLegSchedule(legId, assignedEngineerId, scheduledStart, scheduledEnd);
}

export async function updateLegStatus(formData: FormData) {
  const legId = String(formData.get("leg_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!legId || !status) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: current } = await supabase
    .from("job_legs")
    .select("job_id")
    .eq("id", legId)
    .single();
  if (!current) return;

  const update: TablesUpdate<"job_legs"> = { status };
  if (status === "completed") update.completed_at = new Date().toISOString();

  const { error } = await supabase.from("job_legs").update(update).eq("id", legId);
  if (error) throw new Error(error.message);

  await supabase.from("job_leg_status_history").insert({
    leg_id: legId,
    status,
    changed_by: user?.id ?? null,
  });

  await recomputeJobRollupStatus(supabase, current.job_id);

  revalidatePath(`/engineer/legs/${legId}`);
  revalidatePath(`/office/jobs/${current.job_id}`);
  revalidatePath(`/engineer/jobs/${current.job_id}`);
  revalidatePath("/engineer");
  revalidatePath("/office/schedule");
}
