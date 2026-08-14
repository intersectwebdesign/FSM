import { createClient } from "@/lib/supabase/server";
import { NewJobForm } from "./NewJobForm";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ customer_id?: string }>;
}) {
  const { customer_id } = await searchParams;
  const supabase = await createClient();

  const [{ data: customers }, { data: sites }, { data: engineers }, { data: jobTypes }] =
    await Promise.all([
      supabase.from("customers").select("id, name").order("name"),
      supabase.from("sites").select("id, customer_id, address").order("address"),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "engineer")
        .order("full_name"),
      supabase.from("job_types").select("id, name").order("name"),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">New job</h1>
        <p className="text-sm text-zinc-500">
          Create and optionally schedule a job.
        </p>
      </div>
      <NewJobForm
        customers={customers ?? []}
        sites={sites ?? []}
        engineers={engineers ?? []}
        jobTypes={jobTypes ?? []}
        defaultCustomerId={customer_id}
      />
    </div>
  );
}
