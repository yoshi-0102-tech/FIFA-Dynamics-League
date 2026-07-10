import TeamForm from "../TeamForm";
import { createTeam } from "../actions";
import { PageHeader, Card } from "@/components/ui";

export default function NewTeamPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="チーム追加" />
      <Card className="max-w-md p-5">
        <TeamForm action={createTeam} submitLabel="追加する" />
      </Card>
    </div>
  );
}
