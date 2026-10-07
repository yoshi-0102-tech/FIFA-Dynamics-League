import { createSupabaseServerClient } from "@/lib/supabase/server";

// Cron must reach the database rather than a cached page or response.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers });
  }

  try {
    const client = createSupabaseServerClient();
    const signal = AbortSignal.timeout(5_000);
    const results = await Promise.all([
      client.from("app_settings").select("key").limit(1).abortSignal(signal),
      client.from("teams").select("id").limit(1).abortSignal(signal),
      client.from("matches").select("id").limit(1).abortSignal(signal),
    ]);
    if (results.some(({ error }) => error)) {
      return Response.json({ error: "database_unavailable" }, { status: 503, headers });
    }
    // Never return league records or credentials to the caller.
    return Response.json({ ok: true }, { headers });
  } catch {
    return Response.json({ error: "database_unavailable" }, { status: 503, headers });
  }
}
