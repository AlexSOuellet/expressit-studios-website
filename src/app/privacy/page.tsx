import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ExpressIt Studios handles your information.",
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 px-margin-mobile md:px-margin-desktop py-24">
      <article className="max-w-3xl mx-auto space-y-6 font-body text-body-md text-on-surface-variant">
        <header>
          <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-3">
            Legal
          </span>
          <h1 className="font-display text-headline-xl text-on-surface mb-2">
            Privacy Policy
          </h1>
          <p className="font-mono text-label-caps uppercase tracking-widest text-outline">
            Last updated: May 11, 2026
          </p>
        </header>

        <p>
          ExpressIt Studios (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
          &ldquo;our&rdquo;) is committed to protecting your privacy. This
          policy explains what we collect, how we use it, and the choices you
          have. By using expressitstudios.com (the &ldquo;Site&rdquo;) or
          purchasing our services, you agree to this policy.
        </p>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          What we collect
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-on-surface">Account &amp; order info</strong> — name, email,
            billing address, and order details you provide at checkout.
            Payment card data is collected and stored by Stripe, not by us.
          </li>
          <li>
            <strong className="text-on-surface">Photos &amp; assets</strong> — files you send us
            for video production. We use them solely to produce your order.
          </li>
          <li>
            <strong className="text-on-surface">Usage data</strong> — anonymized analytics about
            how visitors use the Site (pages viewed, device type). We do not
            use cookie-based tracking.
          </li>
          <li>
            <strong className="text-on-surface">Email correspondence</strong> — messages you send
            us, including any context you share about your order.
          </li>
        </ul>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          How we use it
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>To deliver the videos you ordered and provide customer support.</li>
          <li>To process payments and collect required sales tax via Stripe.</li>
          <li>To improve the Site and our service quality.</li>
          <li>To send transactional emails (receipts, delivery notices).</li>
          <li>
            We do <strong className="text-on-surface">not</strong> sell your
            personal information to third parties.
          </li>
        </ul>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          Third-party services
        </h2>
        <p>We use trusted providers to operate the Site:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-on-surface">Stripe</strong> for payment processing.
            See Stripe&rsquo;s privacy policy at stripe.com/privacy.
          </li>
          <li>
            <strong className="text-on-surface">Vercel</strong> for site hosting.
          </li>
          <li>
            <strong className="text-on-surface">Cloudflare</strong> for DNS and
            email routing.
          </li>
        </ul>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          Your photos
        </h2>
        <p>
          The photos you send us remain yours. We use them only to produce
          your order. We may keep a backup copy for up to 90 days in case you
          request a revision; after that they are deleted from our active
          storage. We never use your photos for marketing, training data, or
          any purpose other than your order without your written consent.
        </p>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          Your rights
        </h2>
        <p>
          You can request a copy of the personal data we hold about you, or
          ask us to delete it, by emailing{" "}
          <a
            href="mailto:AlexSOuellet@gmail.com"
            className="text-primary hover:underline"
          >
            AlexSOuellet@gmail.com
          </a>
          . We will respond within 30 days.
        </p>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          Children
        </h2>
        <p>
          The Site is not directed at children under 13 and we do not
          knowingly collect their personal information.
        </p>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          Changes to this policy
        </h2>
        <p>
          We may update this policy from time to time. Material changes will
          be announced on this page with a revised &ldquo;last updated&rdquo;
          date.
        </p>

        <h2 className="font-headline text-headline-sm text-on-surface mt-8 mb-2">
          Contact
        </h2>
        <p>
          Questions? Email{" "}
          <a
            href="mailto:AlexSOuellet@gmail.com"
            className="text-primary hover:underline"
          >
            AlexSOuellet@gmail.com
          </a>
          .
        </p>
      </article>
    </main>
  );
}
