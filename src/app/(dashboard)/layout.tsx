import Link from "next/link";
import LogoutButton from "./LogoutButton";

const NAV_ITEMS = [
  { href: "/", label: "日程・結果" },
  { href: "/standings", label: "順位表" },
  { href: "/players", label: "個人成績" },
  { href: "/cards", label: "カード・出場停止" },
  { href: "/teams", label: "チーム管理" },
  { href: "/matches", label: "試合入力" },
  { href: "/settings", label: "設定" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-black/10 bg-white dark:border-white/10 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <span className="text-lg font-bold">FIFA Dynamics League</span>
          <LogoutButton />
        </div>
        <nav className="mx-auto max-w-5xl overflow-x-auto px-4 pb-2">
          <ul className="flex gap-4 whitespace-nowrap text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
