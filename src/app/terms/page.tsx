import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of ExpressIt Studios.",
};

export default function TermsPage() {
  return (
    <main className="flex-1 px-margin-mobile md:px-margin-desktop py-24">
      <article className="max-w-3xl mx-auto space-y-6 font-body text-body-md text-on-surface-variant">
        <header>
          <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-3">
            Legal
          </span>
          <h1 className="font-display text-headline-xl text-on-surface mb-2">
            Terms of Service
          </h1>
          <p className="font-mono text-label-caps uppercase tracking-widest text-outline">
            Last updated: May 11, 2026
          </p>
        </header>

        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your use of
          expressitstudios.com (the &ldquo;Site&rdquo;) and any services
          provided by ExpressIt Studios (&ldquo;we,&rdquo; &ldquo;us&rdquo;).
          By using the Site or placing an order, you agree to these Terms.
        </p>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          The service
        </h2>
        <p>
          ExpressIt Studios produces custom cinematic videos from photos you
          provide. Specific deliverables, duration, and turnaround are
          described on each product page.
        </p>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          Your photos &amp; rights
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            You confirm you own or have the right to use any photo you send us.
          </li>
          <li>
            You grant us a limited license to use your photos solely to
            produce your order.
          </li>
          <li>
            You keep ownership of the finished video. We may use anonymized
            stills as portfolio samples only with your written consent.
          </li>
          <li>
            We will not use your photos for AI training, marketing, or any
            other purpose without your written consent.
          </li>
        </ul>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          Turnaround &amp; revisions
        </h2>
        <p>
          Standard turnaround is 24–48 hours from the time we receive your
          photos and order details. Two (2) revisions are included with every
          order. Substantial scope changes (different occasion, different
          photos, etc.) may be billed as a new order.
        </p>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          Payment, taxes &amp; refunds
        </h2>
        <p>
          All prices are in U.S. dollars. Sales tax is added at checkout
          where required. Payment is processed by Stripe; we never see your
          card details. Refund eligibility is described in our{" "}
          <a href="/refund" className="text-primary hover:underline">
            Refund Policy
          </a>
          .
        </p>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          Acceptable use
        </h2>
        <p>You agree not to use the Site or service to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Send us content that infringes on third-party rights.</li>
          <li>
            Send us illegal, harmful, defamatory, or sexually explicit material
            (especially involving minors — strictly prohibited).
          </li>
          <li>Attempt to disrupt, hack, or reverse-engineer the Site.</li>
        </ul>
        <p>
          We reserve the right to refuse or cancel any order that violates
          these terms, with a full refund of any unproduced work.
        </p>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          Limitation of liability
        </h2>
        <p>
          The Site and service are provided &ldquo;as is.&rdquo; To the
          maximum extent permitted by law, our total liability for any claim
          arising from your use of the Site or service is limited to the
          amount you paid us for the order in question.
        </p>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          Governing law
        </h2>
        <p>
          These Terms are governed by the laws of the State of Rhode Island,
          United States, without regard to its conflict-of-laws principles.
        </p>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          Changes
        </h2>
        <p>
          We may revise these Terms occasionally. Continued use of the Site
          after a change means you accept the updated Terms.
        </p>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          Contact
        </h2>
        <p>
          Email{" "}
          <a
            href="mailto:alex@expressitstudios.com"
            className="text-primary hover:underline"
          >
            alex@expressitstudios.com
          </a>{" "}
          with any questions.
        </p>
      </article>
    </main>
  );
}
