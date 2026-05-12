# ExpressIt Studios Website — Session Brief

> Read this at the start of every session. Updated 2026-05-12 (post-deploy).

## Start-of-session checklist for the assistant

1. We work in `C:\Projects\ExpressIt Studios\Website` directly on `main`. **No git worktrees** — they previously stranded commits on side branches that never merged back.
2. Make sure the dev server is running on port 3000 (`npm run dev` in background). The CLIs `stripe`, `supabase`, `vercel`, `gh` are all wired up and authenticated for this project.
3. Take action with available tools instead of walking Alex through dashboards. If a tool is missing, install it. The only steps Alex must do himself are browser-OAuth logins he hasn't done before.
4. Keep responses terse.

## What this is

`expressitstudios.com` — ecommerce storefront replacing Etsy. Alex sells custom photo-to-video edits: business product ads ($35–$200) and personal memory videos ($24.99).

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** (strict)
- **Tailwind v4** — design tokens in `src/app/globals.css` under `@theme`
- **Zod** for product schema validation; **gray-matter** + **react-markdown** for MDX content
- **Stripe Checkout** (inline pricing, no Stripe-side products)
- **Supabase** (Postgres + Storage + Auth) — Phase 2 order system
- **Resend** — transactional emails (not yet wired)
- **Vercel** hosting; **Cloudflare** for DNS + email routing (in-flight); **GoDaddy** still registers the domain
- **lucide-react** icons, **next/font** (Bebas Neue / Geist / JetBrains Mono)

## Production URLs + project refs

| Thing | Value |
|---|---|
| GitHub repo (public) | https://github.com/AlexSOuellet/expressit-studios-website |
| Vercel project | alex-ouellet-s-projects/expressit-studios-website |
| Vercel preview URL | https://expressit-studios-website.vercel.app |
| Custom domain (pending DNS) | https://expressitstudios.com |
| Supabase project ref | `apxvlpdnfxqkcoyroaer` |
| Supabase URL | https://apxvlpdnfxqkcoyroaer.supabase.co |
| Stripe webhook (test mode) | "Vercel preview" — fires on `checkout.session.completed` → `/api/stripe/webhook` |
| Cloudflare account | alex's Gmail (created 2026-05-12, free plan) |
| Cloudflare nameservers | `amanda.ns.cloudflare.com`, `ricardo.ns.cloudflare.com` (set at GoDaddy 2026-05-12 ~1:00 PM ET, propagating) |

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
- ✅ Production deployment live at https://expressit-studios-website.vercel.app
- ✅ Stripe test webhook configured for the Vercel URL
- ⏳ Custom domain `expressitstudios.com` not yet pointed (Cloudflare DNS still propagating)
- ⏳ Cloudflare Email Routing not yet configured (same)
- ⏳ Stripe LIVE mode (waits on Alex enabling tax + final QA on prod)

## Open items — priority order for next session

1. **Confirm Cloudflare DNS propagation**: `nslookup expressitstudios.com` should return Cloudflare-controlled IPs. If active, the Cloudflare dashboard for the domain shows "Active" instead of "Pending Nameserver Update". (Could already be done by the time the next session starts.)
2. **Set up Cloudflare Email Routing** so `alex@expressitstudios.com` forwards to `AlexSOuellet@gmail.com`. Add destination + routing rule. Then Gmail → Settings → Accounts → "Send mail as" → verify.
3. **Point `expressitstudios.com` and `www.expressitstudios.com` at Vercel.** Two clean paths:
   - Easiest: add the domain to the Vercel project (`vercel domains add expressitstudios.com`), Vercel tells us the CNAME/A records, add those in Cloudflare DNS (set proxy status to **DNS only / gray cloud** so Vercel can verify), wait a minute, SSL provisions automatically.
   - Once verified, update `NEXT_PUBLIC_SITE_URL` in Vercel to `https://expressitstudios.com` and redeploy.
4. **Add a `/contact` page** Alex asked for. Should match the rest of the site (hero band + content). Needs:
   - Email link to `alex@expressitstudios.com` (or fall back to Gmail until email routing is verified)
   - Optional simple form (POST → Resend transactional email to Alex). Skip the form if it'd slow this down; mailto link is enough for v1.
   - Add to header nav + footer + sitemap.
5. **Replace `AlexSOuellet@gmail.com` references** with `alex@expressitstudios.com` across `/privacy`, `/terms`, `/refund`, `/checkout/success` once email routing is verified. One find-and-replace.
6. **End-to-end prod test**: buy something on the deployed URL with `4242 4242 4242 4242`, confirm a row lands in Supabase. Already verified the same flow against `localhost`, but doing it against prod catches any URL/env-var misconfig.
7. **Resume Phase 2 steps 3–7** in order.

## Important conventions

- **Server-side singletons.** Both `getStripe()` (`src/lib/stripe.ts`) and `supabaseAdmin()` (`src/lib/supabase/server.ts`) are lazy-initialized. Do **not** instantiate Stripe or Supabase at module load — Next.js 16 collects page data in worker processes that don't reliably inherit env vars and the build fails. This is why early Vercel builds failed.
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
- `RESEND_API_KEY` (not yet used)
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
