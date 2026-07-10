import { createSupabaseServerClient } from "@/lib/supabase/server";
import MatchForm from "../MatchForm";
import { createMatch } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewMatchPage() {
  const supabase = createSupabaseServerClient();
  const { data: teams } = await supabase.from("teams").select("*").order("display_order", { ascending: true });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">試合追加</h1>
      <MatchForm teams={teams ?? []} action={createMatch} submitLabel="追加する" />
    </div>
  );
}
