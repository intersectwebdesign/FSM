import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, phone")
    .eq("id", user.id)
    .single();

  const homeHref = profile?.role === "office" ? "/office" : "/engineer";

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-8">
      <div>
        <Link href={homeHref} className="text-sm text-zinc-500 hover:text-zinc-900">
          &larr; Back
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900">My account</h1>
        <p className="text-sm text-zinc-500">
          {profile?.full_name || user.email}
          {profile?.full_name ? ` · ${user.email}` : ""}
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-900">
          Change password
        </h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
