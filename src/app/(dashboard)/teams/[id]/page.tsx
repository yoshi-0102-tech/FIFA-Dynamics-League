import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import TeamForm from "../TeamForm";
import { updateTeam } from "../actions";
import DeleteTeamButton from "../DeleteTeamButton";
import { PageHeader, Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: team } = await supabase.from("teams").select("*").eq("id", id).single();

  if (!team) notFound();

  const updateTeamWithId = updateTeam.bind(null, id);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="チーム編集"
        actions={<DeleteTeamButton teamId={team.id} teamName={team.name} redirectTo="/teams" />}
      />
      <Card className="max-w-md p-5">
        <TeamForm team={team} action={updateTeamWithId} submitLabel="保存する" />
      </Card>
    </div>
  );
}
