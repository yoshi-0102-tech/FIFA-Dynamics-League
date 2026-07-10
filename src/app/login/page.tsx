import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="w-full max-w-sm rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/20">
        <h1 className="mb-1 text-xl font-bold">FIFA Dynamics League</h1>
        <p className="mb-6 text-sm text-black/60 dark:text-white/60">
          参加者用パスワードを入力してください
        </p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
