import { createSupabaseServerClient } from "@/lib/supabase/server";
import Header from "./Header";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "tournament_name")
    .maybeSingle();

  return (
    <>
      <Header tournamentName={data?.value ?? "FIFA Dynamics League"} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
