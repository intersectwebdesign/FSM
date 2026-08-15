import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("company_settings")
    .select("logo_url")
    .eq("id", 1)
    .single();

  return <LoginForm logoUrl={settings?.logo_url ?? null} />;
}
