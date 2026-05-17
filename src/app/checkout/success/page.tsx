import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Mail, ArrowRight } from "lucide-react";
import { getOrderBySessionId, orderUrl } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your order is in. Next: send us your photos.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  // The Stripe webhook is what creates the order row, and Stripe's redirect
  // can race ahead of it. If the row isn't here yet, fall back to a generic
  // "check your email" message — the confirmation email will carry the link.
  const order = session_id ? await getOrderBySessionId(session_id) : null;
  const link = order ? orderUrl(order.id, order.access_token) : null;

  return (
    <main className="flex-1 flex items-center justify-center px-margin-mobile md:px-margin-desktop py-24">
      <div className="max-w-2xl glass-card rounded-xl p-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary/10 mb-6">
          <CheckCircle2 className="h-10 w-10 text-secondary" aria-hidden="true" />
        </div>

        <span className="font-mono text-label-caps text-secondary tracking-widest uppercase block mb-3">
          Order Confirmed
        </span>
        <h1 className="font-display text-headline-xl text-on-surface mb-4">
          Thank you for your order.
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant mb-8">
          You&rsquo;ll receive a Stripe receipt by email shortly. Next step:
          send us the photos you want turned into video.
        </p>

        {link ? (
          <Link
            href={link}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-on-primary px-8 py-4 font-mono text-ui-mono uppercase tracking-widest hover:opacity-90 transition mb-6"
          >
            Upload your photos
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <div className="bg-surface-container-low rounded-lg p-6 mb-8 text-left">
            <div className="flex items-start gap-4">
              <Mail className="h-5 w-5 text-primary mt-1 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-mono text-label-caps text-primary uppercase tracking-widest mb-2">
                  Your upload link is on its way
                </p>
                <p className="font-body text-body-md text-on-surface-variant">
                  We&rsquo;re still finalizing your order. Refresh in a few
                  seconds, or check your email — we&rsquo;ll send you a private
                  link to upload your photos.
                </p>
                <p className="font-body text-body-md text-on-surface-variant mt-3">
                  Questions? Email{" "}
                  <a
                    href="mailto:alex@expressitstudios.com"
                    className="text-primary hover:underline"
                  >
                    alex@expressitstudios.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="font-body text-body-sm text-on-surface-variant mb-3">
          Bookmark this link — it&rsquo;s your private page for this order.
          We&rsquo;ll also email it to you.
        </p>
        <p className="font-body text-body-sm text-outline mb-6">
          📬 Don&rsquo;t see our email in a few minutes?{" "}
          <strong>Check your spam folder</strong> — we&rsquo;re a new sender
          so messages occasionally land there. Marking it &ldquo;Not
          spam&rdquo; helps future emails land in your inbox.
        </p>

        <Link
          href="/"
          className="font-mono text-ui-mono uppercase tracking-widest text-primary hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
