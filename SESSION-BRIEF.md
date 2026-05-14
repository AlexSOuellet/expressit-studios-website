# ExpressIt Studios Website — Session Brief

> Read this at the start of every session. Updated 2026-05-14 (Phase 2 step 5 + finished-video delivery/approval flow done; next up = step 6 transactional emails).

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
| 3. Signed-link customer order page (`/order/[id]?t=...`) | ✅ |
| 4. Photo upload form (direct-to-Supabase signed URLs) + per-video vibe picker | ✅ |
| 5. `/admin` dashboard (HTTP Basic Auth gated) | ✅ |
| 5b. Finished-video delivery + customer approval flow (admin uploads video → customer approves or requests revisions; revisions capped at 2) | ✅ |
| 6. Resend emails on status transitions (incl. order link in confirmation) | ⏳ |
| 7. Vercel Analytics enable | ⏳ |

**Auth model decision (2026-05-13):** No customer accounts, no magic-link
auth. Each order gets a 256-bit random `access_token` stored in the
`orders` row and embedded in the URL we hand the customer
(`/order/<id>?t=<token>`). This is the *only* gate on order viewing and
photo uploads — every API and page route does a constant-time token
compare and returns 404 on mismatch. Reasons we picked this over magic
links: this is guest-checkout commerce with no repeat-relationship use
case yet, accounts add friction at the highest-stakes moment (right
after payment), and Stripe already collects the email for marketing
purposes — the access mechanism and the marketing list are independent.

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

## Security audit — closed

Full audit at `project-docs/SECURITY-AUDIT-2026-05-12.md`. Status as of 2026-05-13:

- ✅ **C1** keys rotated (`RESEND_API_KEY`, `SUPABASE_SECRET_KEY`)
- ✅ **Prod purchase test** — `cs_test_a1MGfM…` ($35 starter) wrote `orders` row `27a0603d…`; confirms rotated `SUPABASE_SECRET_KEY` works in prod webhook
- ✅ **PR 1** (`314bfdd`) — H1 security headers in `next.config.ts`, M3 JSON-LD escape, M6 unused import, M7 eslint in `prebuild`
- ✅ **PR 2** (`7f0330d`) — H2 in-memory rate limit + H3 Origin check in `src/lib/api/guards.ts`, wired into `/api/contact` (5/10min) and `/api/checkout` (20/10min). Closes M4 by extension. In-memory is per-instance; revisit when traffic warrants Upstash/KV.
- ✅ **PR 3** (`dfcea34`) — M1 CR/LF rejection on contact name/subject, M2 `safe()` covers `"`/`'`, M5 `// SECURITY:` comment + `server-only` import in `src/lib/supabase/server.ts`, L2 generic checkout error (log full server-side)
- ⏳ **M5b** storage bucket RLS policies on `order-uploads` — deferred to **step 4 design** (depends on step 3 auth model). Current state (RLS on, zero policies) blocks all anon/auth; service-role server bypasses.
- ⏳ **L1** route `console.error` through Sentry/structured logger — optional, bigger lift
- ⏳ **L6** mobile `<details>` menu doesn't close on link tap — minor UX, not security

## Open items — priority order for next session

1. **Set `ADMIN_USER` / `ADMIN_PASSWORD` in Vercel** (Production + Preview) — `/admin`
   is gated by HTTP Basic Auth (`src/proxy.ts`). It fails closed: until these are
   set in Vercel, `/admin` returns 401 in prod. `ADMIN_EMAILS` is now unused —
   remove it from Vercel when convenient.
   - Migration `0004_deliverables.sql` is **already applied to prod Supabase**.
     The matching code is pushed to `main`; Vercel auto-deploys on push, so prod
     picks it up without manual steps — just the env vars above are still needed.
2. **Phase 2 step 6** — Resend transactional emails on status transitions (`getResend()` already wired in `src/lib/resend.ts`). The order-confirmation email must include the bookmark link `/order/<id>?t=<token>` — that's the customer's only way back to their order if they close the success page without saving the URL.
3. **Phase 2 step 7** — Vercel Analytics enable
4. **Stripe LIVE mode** when ready: enable tax in Stripe → swap test keys for live keys in Vercel → final QA.
5. **Housekeeping**: verify `lucide-react` is on the real package and not a stale fork (`npm ls lucide-react` — modern lucide is on the `0.5xx` line; the repo currently pins `^1.14.0`).

## Important conventions

- **Server-side singletons.** `getStripe()` (`src/lib/stripe.ts`), `supabaseAdmin()` (`src/lib/supabase/server.ts`), and `getResend()` (`src/lib/resend.ts`) are all lazy-initialized. Do **not** instantiate these clients at module load — Next.js 16 collects page data in worker processes that don't reliably inherit env vars and the build fails. This is why early Vercel builds failed.
- **Products live in MDX** at `src/content/products/*.md`. Schema enforced via Zod (`src/lib/products/schema.ts`). Validated at build time by `scripts/validate-products.mjs` (runs as `prebuild`).
- **Prices in cents** (Stripe convention). `formatPrice(cents)` helper in schema.
- **Variants** = priced SKUs (matrix). **Options** = non-pricing customer selections (e.g. occasion). Both go into Stripe metadata for fulfillment.
- **No newsletter form** — hidden in Phase 1.
- **All routes** documented in `src/app/sitemap.ts`.
- **Supabase migrations** live in `supabase/migrations/`. Apply with `npx supabase db push --include-all`. CLI is logged in and the project is linked (`.vercel/` and `supabase/.temp/` git-ignored).
- **Repo is public.** Don't commit secrets. `.env*` (except `.env.example`) is gitignored.
- **CSP allows the Supabase project URL** in `connect-src` (see `next.config.ts`). Direct browser → Supabase Storage uploads need this. The project ref is pinned (not a wildcard) — if the Supabase project ever changes, update the CSP too.
- **Order access model:** `orders.access_token` is the *only* gate. Server routes (`/api/orders/[id]/*` and `/order/[id]`) load the order via `getOrderForToken(id, token)` in `src/lib/orders.ts` which does a constant-time compare and returns null on mismatch (callers 404 to avoid leaking existence). Never expose the token in logs, error messages, or analytics events.
- **Per-video data model.** Each order has 1 or 3 `order_videos` rows (single vs bundle). Each row has its own `status`, `brief`, `vibe`, uploads, `deliverable_path`, `revision_count`, `revision_note`. The webhook creates the right number of rows based on whether the `variant_id` contains `bundle3`.
- **Video lifecycle.** `awaiting_photos` → (customer submits) `photos_received` → (admin) `in_editing` → (admin uploads finished video) `awaiting_approval` → customer either approves (`delivered`) or requests changes (`revisions_requested` → back to `in_editing`). Revisions capped at `MAX_REVISIONS` (2) in `src/lib/orders.ts`. Order status is derived from its least-advanced video via `deriveOrderStatus` in `src/lib/admin.ts`.
- **Two private storage buckets.** `order-uploads` = customer source photos; `order-deliverables` = admin's finished videos. Both private, RLS-free, accessed only via the service-role server client + short-lived signed URLs. CSP `media-src` allows the Supabase URL so the customer page can stream the video.
- **Vibe picker is business-only.** `src/lib/vibes.ts::vibesForProduct(slug)` returns the menu (currently just `custom-product-video-ad`). Personal memory videos rely on the occasion option picked at checkout.

## Env vars (canonical list, see `.env.example`)

- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
- `RESEND_API_KEY` — used by `/api/contact` and (future) order status emails. Domain `expressitstudios.com` is verified in Resend. From address = `noreply@expressitstudios.com`. To rotate, generate a new key with Sending access scoped to the domain.
- `ADMIN_USER`, `ADMIN_PASSWORD` — HTTP Basic Auth creds for `/admin` + `/api/admin/*` (gated by `src/proxy.ts`)
- `ADMIN_EMAILS` — **unused** (legacy; `/admin` auth moved to Basic Auth). Safe to delete from Vercel.

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
