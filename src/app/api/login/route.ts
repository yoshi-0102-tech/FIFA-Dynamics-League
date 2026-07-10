import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, createSessionToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const appPassword = process.env.APP_PASSWORD;
  const secret = process.env.AUTH_COOKIE_SECRET;
  if (!appPassword || !secret) {
    return NextResponse.json({ error: "サーバー設定エラー" }, { status: 500 });
  }

  const { password } = await request.json().catch(() => ({ password: "" }));

  if (typeof password !== "string" || password !== appPassword) {
    return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
  }

  const token = await createSessionToken(secret);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
