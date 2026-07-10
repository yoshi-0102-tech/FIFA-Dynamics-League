import { createSupabaseServerClient } from "@/lib/supabase/server";
import MatchForm from "../MatchForm";
import { createMatch } from "../actions";
import { PageHeader, Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewMatchPage() {
  const supabase = createSupabaseServerClient();
  const { data: teams } = await supabase.from("teams").select("*").order("display_order", { ascending: true });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="試合追加" />
      <Card className="max-w-md p-5">
        <MatchForm teams={teams ?? []} action={createMatch} submitLabel="追加する" />
      </Card>
    </div>
  );
}
