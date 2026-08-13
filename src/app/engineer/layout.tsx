import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";

export default async function EngineerLayout({
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
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <header className="print:hidden sticky top-0 z-10 border-b border-zinc-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/account" className="font-semibold text-zinc-900">
            {name}
          </Link>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 px-4 py-4">{children}</main>
    </div>
  );
}
