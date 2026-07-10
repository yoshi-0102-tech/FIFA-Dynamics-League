import TeamForm from "../TeamForm";
import { createTeam } from "../actions";

export default function NewTeamPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">チーム追加</h1>
      <TeamForm action={createTeam} submitLabel="追加する" />
    </div>
  );
}
