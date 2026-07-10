"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-md border border-white/25 px-3 py-1.5 text-sm text-white/90 transition-colors hover:bg-white/10"
    >
      ログアウト
    </button>
  );
}
