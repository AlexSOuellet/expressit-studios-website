import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { getStripe, getSiteUrl } from "@/lib/stripe";
import { getProductBySlug } from "@/lib/products";

const requestSchema = z.object({
  slug: z.string().min(1),
  variantId: z.string().min(1),
  options: z.record(z.string(), z.string()).default({}),
});

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      {
        error:
          "Checkout is not configured. Set STRIPE_SECRET_KEY in .env.local.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request shape." },
      { status: 400 }
    );
  }
  const { slug, variantId, options } = parsed.data;

  const product = await getProductBySlug(slug);
  if (!product || !product.active) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const variant = product.variants.find(
    (v) => v.id === variantId && v.active !== false
  );
  if (!variant) {
    return NextResponse.json({ error: "Variant not found." }, { status: 404 });
  }

  for (const opt of product.options) {
    if (opt.required && !options[opt.key]) {
      return NextResponse.json(
        { error: `Missing required option: ${opt.label}` },
        { status: 400 }
      );
    }
    if (options[opt.key]) {
      const isValid = opt.options.some(
        (choice) => choice.value === options[opt.key]
      );
      if (!isValid) {
        return NextResponse.json(
          { error: `Invalid value for ${opt.label}` },
          { status: 400 }
        );
      }
    }
  }

  const siteUrl = getSiteUrl();
  const includeImages = siteUrl.startsWith("https://");
  const optionMetadata = Object.fromEntries(
    Object.entries(options).map(([k, v]) => [`option_${k}`, v])
  );

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${product.title} — ${variant.label}`,
              description: product.short_description,
              ...(includeImages && {
                images: product.images
                  .slice(0, 1)
                  .map((img) => `${siteUrl}${img.src}`),
              }),
              metadata: {
                product_slug: product.slug,
                variant_id: variant.id,
              },
            },
            unit_amount: variant.price_cents,
            tax_behavior: "exclusive",
          },
          quantity: 1,
        },
      ],
      automatic_tax: { enabled: true },
      customer_creation: "always",
      billing_address_collection: "required",
      payment_intent_data: {
        metadata: {
          product_slug: product.slug,
          variant_id: variant.id,
          ...optionMetadata,
        },
      },
      metadata: {
        product_slug: product.slug,
        variant_id: variant.id,
        ...optionMetadata,
      },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/products/${product.slug}`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Stripe.errors.StripeError
        ? err.message
        : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
