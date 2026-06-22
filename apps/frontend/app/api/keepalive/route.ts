import { NextResponse } from 'next/server';

/**
 * Keep-alive ping for the Render backend.
 * Called by Vercel Cron every 5 minutes so the free-tier service
 * never goes to sleep.
 */
export const runtime = 'edge';

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://fabric-flow.onrender.com';

  try {
    const start = Date.now();
    const res = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      // Edge runtime: no keepalive needed, just a lightweight HEAD-equivalent
      headers: { 'User-Agent': 'FabricFlow-KeepAlive/1.0' },
      // 30s max — if backend is genuinely down don't hang
      signal: AbortSignal.timeout(30_000),
    });

    const latencyMs = Date.now() - start;
    const body = await res.json().catch(() => ({}));

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      latencyMs,
      backend: body,
      pingedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err), pingedAt: new Date().toISOString() },
      { status: 503 }
    );
  }
}
