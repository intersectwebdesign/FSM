import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PatReportDocument } from "@/components/PatReportDocument";

export default async function EngineerPatReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: job }, { data: tests }] = await Promise.all([
    supabase
      .from("jobs")
      .select("title, customers(name), sites(address, city, postcode)")
      .eq("id", id)
      .single(),
    supabase
      .from("pat_tests")
      .select(
        "id, result, visual_pass, tested_at, next_due_date, notes, appliances(description, location, asset_number), profiles(full_name)"
      )
      .eq("job_id", id)
      .order("tested_at", { ascending: true }),
  ]);

  if (!job) notFound();

  const siteAddress = job.sites
    ? [job.sites.address, job.sites.city, job.sites.postcode]
        .filter(Boolean)
        .join(", ")
    : "-";

  return (
    <PatReportDocument
      jobTitle={job.title}
      customerName={job.customers?.name ?? "-"}
      siteAddress={siteAddress}
      tests={tests ?? []}
    />
  );
}
