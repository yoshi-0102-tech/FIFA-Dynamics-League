"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setLoading(false);
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "ログインに失敗しました");
      return;
    }

    const redirect = searchParams.get("redirect") ?? "/";
    router.replace(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="パスワード"
        autoFocus
        required
        className="w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-base outline-none focus:border-primary"
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-3 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-50"
      >
        {loading ? "確認中…" : "入る"}
      </button>
    </form>
  );
}
