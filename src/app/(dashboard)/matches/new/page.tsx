import { getTeams } from "@/lib/data";
import MatchForm from "../MatchForm";
import { createMatch } from "../actions";
import { PageHeader, Card } from "@/components/ui";

export default async function NewMatchPage() {
  const teams = await getTeams();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="試合追加" />
      <Card className="max-w-md p-5">
        <MatchForm teams={teams} action={createMatch} submitLabel="追加する" />
      </Card>
    </div>
  );
}
