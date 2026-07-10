"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

const NAV_ITEMS = [
  { href: "/", label: "日程・結果" },
  { href: "/standings", label: "順位表" },
  { href: "/players", label: "個人成績" },
  { href: "/cards", label: "カード・出場停止" },
  { href: "/teams", label: "チーム管理" },
  { href: "/matches", label: "試合入力" },
  { href: "/guide", label: "使い方ガイド" },
  { href: "/settings", label: "設定" },
];

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={
        isActive
          ? "whitespace-nowrap font-semibold text-white"
          : "whitespace-nowrap text-white/75 transition-colors hover:text-white"
      }
    >
      {label}
    </Link>
  );
}

export default function Header({ tournamentName }: { tournamentName: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-primary text-white shadow-md">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:max-w-[16rem] md:flex-none">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="メニューを開く"
            aria-expanded={menuOpen}
            className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white hover:bg-white/10 md:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-lg leading-none">⚽</span>
            <span className="truncate text-lg font-bold tracking-tight">{tournamentName}</span>
          </Link>
        </div>

        <nav className="hidden min-w-0 flex-1 justify-end md:flex">
          <ul className="flex gap-5 overflow-x-auto text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href} className="shrink-0">
                <NavLink href={item.href} label={item.label} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden shrink-0 md:block">
          <LogoutButton />
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-white/15 bg-primary-dark md:hidden">
          <ul className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-3 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href} className="py-1.5">
                <NavLink href={item.href} label={item.label} onClick={() => setMenuOpen(false)} />
              </li>
            ))}
            <li className="pt-2">
              <LogoutButton />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
