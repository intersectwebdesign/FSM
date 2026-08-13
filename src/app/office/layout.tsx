import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";
import { OfficeNav } from "@/components/OfficeNav";

const NAV = [
  { href: "/office", label: "Dashboard" },
  { href: "/office/schedule", label: "Schedule" },
  { href: "/office/jobs", label: "Jobs" },
  { href: "/office/customers", label: "Customers" },
  { href: "/office/pat", label: "PAT Testing" },
  { href: "/office/team", label: "Team" },
  { href: "/office/settings", label: "Settings" },
];

export default async function OfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name = user?.email ?? "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    if (profile?.full_name) name = profile.full_name;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="print:hidden relative border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4 lg:gap-6">
            <span className="whitespace-nowrap font-semibold text-zinc-900">
              Field Service
            </span>
            <OfficeNav items={NAV} />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/account"
              className="hidden truncate text-sm text-zinc-500 hover:text-zinc-900 sm:block"
            >
              {name}
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
