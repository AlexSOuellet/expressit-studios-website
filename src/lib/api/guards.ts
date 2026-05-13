import "server-only";
import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/stripe";

// SECURITY: in-memory store. Each serverless instance has its own bucket, so
// the effective limit is N × concurrent_instances. Acceptable for a low-volume
// single-tenant shop; swap to Upstash/Vercel KV when traffic justifies it.
const buckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimit(
  req: Request,
  opts: { key: string; limit: number; windowMs: number }
): Response | null {
  const id = `${opts.key}:${clientIp(req)}`;
  const now = Date.now();
  const bucket = buckets.get(id);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(id, { count: 1, resetAt: now + opts.windowMs });
    return null;
  }

  if (bucket.count >= opts.limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  bucket.count += 1;
  return null;
}

export function checkOrigin(req: Request): Response | null {
  const origin = req.headers.get("origin");
  if (!origin) {
    // Same-origin browser POSTs always send Origin; missing it usually means
    // a non-browser client. Block to keep the attack surface tight.
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const site = new URL(getSiteUrl());
  const allowed = new Set<string>([site.origin]);
  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3000");
  }

  if (!allowed.has(origin)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return null;
}
