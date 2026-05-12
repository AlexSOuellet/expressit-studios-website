import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refunds, revisions, and order cancellations at ExpressIt Studios.",
};

export default function RefundPage() {
  return (
    <main className="flex-1 px-margin-mobile md:px-margin-desktop py-24">
      <article className="max-w-3xl mx-auto space-y-6 font-body text-body-md text-on-surface-variant">
        <header>
          <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-3">
            Legal
          </span>
          <h1 className="font-display text-headline-xl text-on-surface mb-2">
            Refund Policy
          </h1>
          <p className="font-mono text-label-caps uppercase tracking-widest text-outline">
            Last updated: May 11, 2026
          </p>
        </header>

        <p>
          ExpressIt Studios delivers custom, made-to-order digital video.
          Because every order is uniquely produced, our refund policy is
          structured to protect both you and us. The summary:{" "}
          <strong className="text-on-surface">
            no refunds on delivered digital products. Two revisions are
            included with every order.
          </strong>
        </p>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          Before production begins
        </h2>
        <p>
          If you change your mind before we&rsquo;ve started production on
          your video, email us at{" "}
          <a
            href="mailto:alex@expressitstudios.com"
            className="text-primary hover:underline"
          >
            alex@expressitstudios.com
          </a>{" "}
          and we&rsquo;ll issue a full refund. Production typically begins
          within a few hours of receiving your photos and order details, so
          contact us quickly.
        </p>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          After production begins
        </h2>
        <p>
          Once production has started, the order is non-refundable. You can
          still adjust the result through your included revisions.
        </p>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          Revisions
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Every order includes <strong className="text-on-surface">two (2) revisions</strong> at no
            extra cost.
          </li>
          <li>
            Revisions cover color, music, pacing, text/captions, and minor
            edits.
          </li>
          <li>
            Major scope changes (different photos, different occasion type)
            count as a new order, not a revision.
          </li>
          <li>
            Revision requests must be sent within 14 days of delivery.
          </li>
        </ul>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          After delivery
        </h2>
        <p>
          Once your finished video has been delivered, the order is
          considered complete and is non-refundable. Use your included
          revisions to fine-tune anything you&rsquo;d like adjusted.
        </p>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          If something goes wrong
        </h2>
        <p>
          If your delivered video is materially different from what was
          ordered (wrong duration, wrong photos used, technical defects), we
          will fix it at no charge. Email us within 7 days of delivery and
          we&rsquo;ll make it right.
        </p>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          Cancellations &amp; chargebacks
        </h2>
        <p>
          If a refund is approved, it will be issued via Stripe to the
          original payment method within 5–10 business days. Initiating a
          chargeback without first contacting us is not necessary —
          we&rsquo;re happy to resolve any issue quickly. Email{" "}
          <a
            href="mailto:alex@expressitstudios.com"
            className="text-primary hover:underline"
          >
            alex@expressitstudios.com
          </a>
          .
        </p>
      </article>
    </main>
  );
}
