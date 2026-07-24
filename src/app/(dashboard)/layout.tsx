import { getAppSettings } from "@/lib/data";
import Header from "./Header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const settings = await getAppSettings();
  const tournamentName = settings.find((setting) => setting.key === "tournament_name")?.value;

  return (
    <>
      <Header tournamentName={tournamentName ?? "FIFA Dynamics League"} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
