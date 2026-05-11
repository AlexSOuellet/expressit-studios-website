import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your order is in. Next: send us your photos.",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

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

        <div className="bg-surface-container-low rounded-lg p-6 mb-8 text-left">
          <div className="flex items-start gap-4">
            <Mail className="h-5 w-5 text-primary mt-1 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-mono text-label-caps text-primary uppercase tracking-widest mb-2">
                How to send your photos
              </p>
              <p className="font-body text-body-md text-on-surface-variant">
                Reply to your Stripe receipt with your photos attached (or a
                Dropbox / Google Drive link). Include a note on the vibe,
                music, or any style you&rsquo;re after.
              </p>
              <p className="font-body text-body-md text-on-surface-variant mt-3">
                Or email{" "}
                <a
                  href="mailto:AlexSOuellet@gmail.com"
                  className="text-primary hover:underline"
                >
                  AlexSOuellet@gmail.com
                </a>{" "}
                directly. We&rsquo;ll have your finished video back in 24–48
                hours.
              </p>
            </div>
          </div>
        </div>

        {session_id && (
          <p className="font-mono text-label-caps text-outline uppercase tracking-widest mb-6">
            Reference: {session_id.slice(0, 16)}…
          </p>
        )}

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
