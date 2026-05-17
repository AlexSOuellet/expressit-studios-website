import { NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { supabaseAdmin } from "@/lib/supabase/server";

// One-click unsubscribe endpoint. Both GET (link click from email) and POST
// (RFC 8058 one-click from Gmail / Yahoo / Apple Mail with the
// `List-Unsubscribe-Post: List-Unsubscribe=One-Click` header set) flip
// `orders.unsubscribed_at`. GET then redirects to a friendly confirmation
// page; POST returns 204 because mailbox providers don't render the body.

async function unsubscribe(orderId: string, token: string): Promise<boolean> {
  if (!verifyUnsubscribeToken(orderId, token)) return false;
  const { error } = await supabaseAdmin()
    .from("orders")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) {
    console.error("[unsubscribe] update failed", { orderId, error });
    return false;
  }
  return true;
}

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://expressitstudios.com";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ok = await unsubscribe(url.searchParams.get("o") ?? "", url.searchParams.get("t") ?? "");
  const target = ok ? "/email/unsubscribed" : "/email/unsubscribed?error=1";
  return NextResponse.redirect(new URL(target, siteOrigin()), { status: 303 });
}

export async function POST(req: Request) {
  // Gmail/Yahoo one-click sends a form-encoded body of `List-Unsubscribe=One-Click`,
  // but the token/order id come from the URL we put in the header.
  const url = new URL(req.url);
  const ok = await unsubscribe(url.searchParams.get("o") ?? "", url.searchParams.get("t") ?? "");
  return new NextResponse(null, { status: ok ? 204 : 400 });
}
