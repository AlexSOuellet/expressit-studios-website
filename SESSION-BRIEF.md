# ExpressIt Studios Website — Session Brief

> Read this at the start of every session. Updated 2026-05-13 (post-audit + key rotation).

## Start-of-session checklist for the assistant

1. We work in `C:\Projects\ExpressIt Studios\Website` directly on `main`. **No git worktrees** — they previously stranded commits on side branches that never merged back.
2. Make sure the dev server is running on port 3000 (`npm run dev` in background). The CLIs `stripe`, `supabase`, `vercel`, `gh` are all wired up and authenticated for this project.
3. Take action with available tools instead of walking Alex through dashboards. If a tool is missing, install it. The only steps Alex must do himself are browser-OAuth logins he hasn't done before.
4. Keep responses terse.
5. **Never ask Alex to paste a secret into chat.** Conversations live both on his disk and on Anthropic's servers — pasted keys are effectively leaked. If you need a key, have him set it himself (Vercel UI, edit `.env.local`, etc.) and verify by side-effect (e.g. POST to an endpoint that uses it) — not by reading it back. This rule was learned the hard way; see `project-docs/SECURITY-AUDIT-2026-05-12.md` C1.

## What this is

`expressitstudios.com` — ecommerce storefront replacing Etsy. Alex sells custom photo-to-video edits: business product ads ($35–$200) and personal memory videos ($24.99).

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** (strict)
- **Tailwind v4** — design tokens in `src/app/globals.css` under `@theme`
- **Zod** for product schema validation; **gray-matter** + **react-markdown** for MDX content
- **Stripe Checkout** (inline pricing, no Stripe-side products)
- **Supabase** (Postgres + Storage + Auth) — Phase 2 order system
- **Resend** — transactional emails (wired for `/api/contact`, ready for Phase 2 step 6)
- **Vercel** hosting; **Cloudflare** for DNS + email routing (live); **GoDaddy** still registers the domain
- **lucide-react** icons, **next/font** (Bebas Neue / Geist / JetBrains Mono)

## Production URLs + project refs

| Thing | Value |
|---|---|
| GitHub repo (public) | https://github.com/AlexSOuellet/expressit-studios-website |
| Vercel project | alex-ouellet-s-projects/expressit-studios-website |
| Vercel preview URL | https://expressit-studios-website.vercel.app |
| Custom domain (live) | https://expressitstudios.com |
| Supabase project ref | `apxvlpdnfxqkcoyroaer` |
| Supabase URL | https://apxvlpdnfxqkcoyroaer.supabase.co |
| Stripe webhook (test mode) | "Vercel preview" — fires on `checkout.session.completed` → `/api/stripe/webhook` |
| Cloudflare account | alex's Gmail (created 2026-05-12, free plan) |
| Cloudflare nameservers | `amanda.ns.cloudflare.com`, `ricardo.ns.cloudflare.com` (active since 2026-05-12) |
| Resend account | Personal (alexsouellet@gmail.com login); domain `expressitstudios.com` verified |

## What's done

### Phase 1 — storefront
- Project scaffolded, design tokens, fonts, product catalog (2 products in MDX), Zod schema, all storefront pages, Stripe Checkout, SEO (sitemap/robots/JSON-LD), product validation in `prebuild` hook.
- Visual decisions all locked in (hero, tracks, business/personal pages, product gallery). See git log for specifics.

### Phase 2 — order system (steps 1–2 done)
| Step | Status |
|---|---|
| 1. Supabase project + schema (`orders`, `uploads`, `order_status` enum, RLS on, `order-uploads` private bucket) | ✅ |
| 2. Stripe webhook `/api/stripe/webhook` → upserts orders row on `checkout.session.completed` | ✅ verified end-to-end locally and now in prod |
| 3. Magic-link auth + `/order/[id]` customer page | ⏳ |
| 4. Photo upload form (direct-to-Supabase signed URLs) | ⏳ |
| 5. `/admin` dashboard (email-allowlist gated) | ⏳ |
| 6. Resend emails on status transitions | ⏳ |
| 7. Vercel Analytics enable | ⏳ |

### Deploy
- ✅ Vercel project linked, env vars set for Production + Preview (Stripe test keys, Supabase, Resend placeholder, `ADMIN_EMAILS`)
- ✅ Repo flipped to **public** (Vercel Hobby plan blocks deploys from non-team git authors on private repos — the cleanest fix; nothing secret in the codebase)
- ✅ Production deployment live at https://expressitstudios.com (custom domain + www, HTTPS)
- ✅ Stripe test webhook configured for the Vercel URL
- ✅ Cloudflare DNS: root + www A records → `76.76.21.21` (DNS-only); Vercel SSL provisioned
- ✅ Cloudflare Email Routing enabled — MX/SPF/DKIM records added by Cloudflare
  - Rule: `alex@expressitstudios.com → AlexSOuellet@gmail.com`
  - Catchall: `*@expressitstudios.com → AlexSOuellet@gmail.com`
- ✅ `NEXT_PUBLIC_SITE_URL` updated to `https://expressitstudios.com` and prod redeployed
- ✅ Resend domain `expressitstudios.com` verified (auto-configured via Cloudflare OAuth). Sends via `send.expressitstudios.com` subdomain. DKIM = `resend._domainkey`.
- ✅ Gmail "Send mail as" `alex@expressitstudios.com` via Resend SMTP (`smtp.resend.com:587`, user `resend`, password = Resend API key `gmail-smtp` scoped to expressitstudios.com). Gmail set to auto-reply from same address.
- ✅ `/contact` page live with form (`src/components/site/contact-form.tsx` → `POST /api/contact` → `Resend` SDK → `alex@expressitstudios.com`). Honeypot + Zod validation. From `noreply@expressitstudios.com`, reply-to is the submitter. Linked in header nav, footer, sitemap.
- ✅ `RESEND_API_KEY` set in Vercel **Production** (and rotated on 2026-05-13 — see audit doc). Preview env: needs the same key set via dashboard if/when preview deploys exercise the contact form (Vercel CLI has a non-interactive bug for the "all preview branches" path).
- ✅ **Key rotation 2026-05-13**: `RESEND_API_KEY` rotated after the original key was pasted into a chat transcript; `SUPABASE_SECRET_KEY` rotated per audit recommendation. Both verified working locally and in production.
- ✅ Email replaced site-wide: `AlexSOuellet@gmail.com` → `alex@expressitstudios.com` on `/privacy`, `/terms`, `/refund`, `/checkout/success`, `/process`, and both product MDX files.
- ⏳ Stripe LIVE mode (waits on Alex enabling tax + final QA on prod)

## Open items — priority order for next session

Full security audit lives at `project-docs/SECURITY-AUDIT-2026-05-12.md`. The most valuable items below are summarized in the assistant's recommended ship order:

1. **End-to-end prod purchase test**: buy something on https://expressitstudios.com with test card `4242 4242 4242 4242`. Confirm a row lands in Supabase `orders` table. Also doubles as the production smoke test for the rotated `SUPABASE_SECRET_KEY` (webhook → `supabaseAdmin().from('orders').upsert`).
2. **Audit PR 1 — quick wins** (~1 hour, no decisions required):
   - **H1** Add security headers in `next.config.ts` (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). For CSP, JSON-LD via `dangerouslySetInnerHTML` may need `'strict-dynamic'` or a nonce.
   - **M3** Escape `</script>` in JSON-LD output at `src/app/products/[slug]/page.tsx:84`.
   - **M7** Add `next lint` to `prebuild` so unused imports fail CI.
   - **M6** Drop the unused `formatPrice` import at `src/app/products/[slug]/page.tsx:4` (will be caught by M7).
3. **Audit PR 2 — rate limit + origin check** (H2 + H3). Decision needed: Upstash Redis vs Vercel KV vs simple in-memory per-instance limiter. The assistant's recommendation is the in-memory limiter for v1 — single-tenant shop with single-digit daily orders doesn't justify a Redis dependency yet. Worst case is Resend free tier (3k/mo) burns out, which is recoverable.
4. **Audit PR 3 — hardening cleanup**:
   - **M1** Tighten `subject`/`name` Zod schema in `/api/contact` to reject `\r\n`.
   - **M2** Extend `safe()` in `/api/contact/route.ts` to cover `"` and `'`.
   - **M5** Add a `// SECURITY:` comment in `src/lib/supabase/server.ts` warning future devs not to introduce a browser Supabase client. **Also**: add RLS policies on the `order-uploads` storage bucket before wiring Phase 2 step 4 (photo upload).
   - **L2** Stop returning raw Stripe `err.message` from `/api/checkout` — log it, return generic.
5. **Resume Phase 2 steps 3–7** in order:
   - Step 3 — Magic-link auth + `/order/[id]` customer page
   - Step 4 — Photo upload form (direct-to-Supabase signed URLs) — **prerequisite**: storage bucket RLS policies (from PR 3 / M5)
   - Step 5 — `/admin` dashboard (email-allowlist gated, `ADMIN_EMAILS` env)
   - Step 6 — Resend transactional emails on status transitions (`getResend()` already wired in `src/lib/resend.ts`)
   - Step 7 — Vercel Analytics enable
6. **Stripe LIVE mode** when ready: enable tax in Stripe → swap test keys for live keys in Vercel → final QA.
7. **Housekeeping**: verify `lucide-react` is on the real package and not a stale fork (`npm ls lucide-react` — modern lucide is on the `0.5xx` line; the repo currently pins `^1.14.0`).

## Important conventions

- **Server-side singletons.** `getStripe()` (`src/lib/stripe.ts`), `supabaseAdmin()` (`src/lib/supabase/server.ts`), and `getResend()` (`src/lib/resend.ts`) are all lazy-initialized. Do **not** instantiate these clients at module load — Next.js 16 collects page data in worker processes that don't reliably inherit env vars and the build fails. This is why early Vercel builds failed.
- **Products live in MDX** at `src/content/products/*.md`. Schema enforced via Zod (`src/lib/products/schema.ts`). Validated at build time by `scripts/validate-products.mjs` (runs as `prebuild`).
- **Prices in cents** (Stripe convention). `formatPrice(cents)` helper in schema.
- **Variants** = priced SKUs (matrix). **Options** = non-pricing customer selections (e.g. occasion). Both go into Stripe metadata for fulfillment.
- **No newsletter form** — hidden in Phase 1.
- **All routes** documented in `src/app/sitemap.ts`.
- **Supabase migrations** live in `supabase/migrations/`. Apply with `npx supabase db push --include-all`. CLI is logged in and the project is linked (`.vercel/` and `supabase/.temp/` git-ignored).
- **Repo is public.** Don't commit secrets. `.env*` (except `.env.example`) is gitignored.

## Env vars (canonical list, see `.env.example`)

- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
- `RESEND_API_KEY` — used by `/api/contact` and (future) order status emails. Domain `expressitstudios.com` is verified in Resend. From address = `noreply@expressitstudios.com`. To rotate, generate a new key with Sending access scoped to the domain.
- `ADMIN_EMAILS` (comma-separated, gates future `/admin`)

## CLIs available (all authenticated)

- `gh` — GitHub CLI
- `stripe` — Stripe CLI (locally paired with ExpressIt Stripe account; Rhody Strong will need re-pairing when Alex switches back to that project)
- `npx supabase` — linked to project `apxvlpdnfxqkcoyroaer`
- `npx vercel` — linked to `alex-ouellet-s-projects/expressit-studios-website`

## Pricing matrix (locked)

**Custom Product Video Ad** (business — duration × quantity):

| | Starter (15s) | Pro (30s) | Premium (60s) |
|---|---|---|---|
| 1 video | $35 | $50 | $70 |
| 3-video bundle | $75 | $125 | $200 |

**Custom Memory Video** (personal) — flat **$24.99**, customer picks occasion (Pet / Birthday / Gender Reveal / Anniversary / Wedding / Memorial / Other).

## Memory rules (carry-forward)

Saved at `~/.claude/projects/C--Projects-ExpressIt-Studios-Website/memory/`:

- Only browse `ExpressIt Studios` and `Etsy Listings` folders.
- Use Next.js + Vercel (not Astro/Cloudflare for hosting; Cloudflare is DNS/email only).
- Build autonomously through agreed scope; check in at visible checkpoints.
- Keep responses terse.
- **No worktrees** — commit directly on `main` in `C:\Projects\ExpressIt Studios\Website`.
- **No shortcuts** — automate via CLI/API; don't walk Alex through dashboard UIs when a command works.
- **Never solicit secrets in chat** (see checklist item 5 above; audit C1 explains why).

## How to run locally

```
cd "C:\Projects\ExpressIt Studios\Website"
npm install
npm run dev
```

`.env.local` already has dev values. Visit http://localhost:3000.

## Where the assets came from

- Hero image: AI-generated via Higgsfield Nano Banana Pro (cinematic studio scene)
- Track card images: AI-generated via Higgsfield Nano Banana Pro
- Etsy reference assets at `C:\Projects\Etsy Listings\` (banners, listing photos, instruction PDFs)
- Stitch mockup: `_reference/DESIGN.md` + `_reference/code.html` + `_reference/screen.png`
