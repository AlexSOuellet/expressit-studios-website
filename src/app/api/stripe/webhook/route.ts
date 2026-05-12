import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

// Stripe needs the raw request body to verify the signature.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set." },
      { status: 503 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object);
    }
  } catch (err) {
    console.error("[stripe webhook] handler failed", err);
    // Return 500 so Stripe retries.
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};
  const productSlug = metadata.product_slug;
  const variantId = metadata.variant_id;

  if (!productSlug || !variantId) {
    throw new Error(
      `checkout.session.completed missing product_slug/variant_id (session=${session.id})`
    );
  }

  const options: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (key.startsWith("option_") && typeof value === "string") {
      options[key.replace(/^option_/, "")] = value;
    }
  }

  const customerEmail =
    session.customer_details?.email ?? session.customer_email ?? null;

  if (!customerEmail) {
    throw new Error(
      `checkout.session.completed missing customer email (session=${session.id})`
    );
  }

  const priceCents = session.amount_total ?? 0;

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("orders").upsert(
    {
      stripe_session_id: session.id,
      customer_email: customerEmail,
      product_slug: productSlug,
      variant_id: variantId,
      options,
      price_cents: priceCents,
      status: "awaiting_photos",
    },
    { onConflict: "stripe_session_id" }
  );

  if (error) {
    throw new Error(`Supabase insert failed: ${error.message}`);
  }
}
