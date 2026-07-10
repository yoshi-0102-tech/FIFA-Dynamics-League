import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-primary px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl leading-none">⚽</span>
          <h1 className="text-xl font-bold">FIFA Dynamics League</h1>
          <p className="text-sm text-foreground/60">
            参加者用パスワードを入力してください
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
