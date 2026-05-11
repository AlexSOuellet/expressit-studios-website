# ExpressIt Studios Website — Session Brief

> Read this at the start of every session. Updated 2026-05-11 (post-polish).

## What this is

`expressitstudios.com` — the new ecommerce storefront replacing Etsy for ExpressIt Studios. Alex sells custom photo-to-video edits: business product ads and personal memory videos.

Forked nothing — built from scratch this session.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** (strict)
- **Tailwind v4** — design tokens in `src/app/globals.css` under `@theme`
- **Zod** for product schema validation
- **gray-matter** + **react-markdown** for MDX-style content collections
- **Stripe Checkout** (inline pricing, no Stripe-side products)
- **lucide-react** icons, **next/font** for Bebas Neue / Geist / JetBrains Mono
- Deployment target: **Vercel** + GoDaddy DNS → `expressitstudios.com`

## What's done (Phase 1 foundation)

| Area | Status |
|---|---|
| Project scaffolded, GitHub repo live | ✅ https://github.com/AlexSOuellet/expressit-studios-website |
| Design system tokens from `_reference/DESIGN.md` | ✅ ported to Tailwind v4 `@theme` |
| Fonts | ✅ Bebas Neue, Geist, JetBrains Mono via next/font |
| Product catalog | ✅ 2 products (`business-product-video-ad.md`, `personal-memory-video.md`) in `src/content/products/` |
| Product schema | ✅ `src/lib/products/schema.ts` (Zod) with variants + options + axes |
| Pages | ✅ `/`, `/business`, `/personal`, `/products/[slug]`, `/process`, `/blog`, `/blog/[slug]`, `/privacy`, `/terms`, `/refund`, `/checkout/success` |
| Stripe checkout API | ✅ `/api/checkout/route.ts` — sends to Stripe Checkout with metadata + Stripe Tax |
| SEO | ✅ sitemap.ts, robots.ts, JSON-LD product structured data, OG metadata per page |
| Validation | ✅ `npm run check:products` + `prebuild` hook |
| Production build | ✅ passes clean, 18 routes |

## Pricing matrix (locked)

**Custom Product Video Ad** (business — duration × quantity):

| | Starter (15s) | Pro (30s) | Premium (60s) |
|---|---|---|---|
| 1 video | $35 | $50 | $70 |
| 3-video bundle | $75 | $125 | $200 |

**Custom Memory Video** (personal) — flat **$24.99**, customer picks occasion (Pet / Birthday / Gender Reveal / Anniversary / Wedding / Memorial / Other).

## Visual decisions made

**Home**
- Hero: AI-generated cinematic studio image at `public/hero/studio.png`, `min-h-screen`, opacity-40, image bleeds 140vh down into Tracks for a continuous cinematic feel.
- Headline: "Still Photos *Cinematic* Stories" — no punctuation, "Cinematic" italic primary cyan
- Tracks: two cards, `h-[400px]`, `TRACK 01 / TRACK 02` eyebrow labels, no section header (cards directly under hero)
- Process: eyebrow "The Cinematic Workflow" + headline "Seamless Creation"; steps Upload / AI Enhancement / Delivery; "high resolution within 48 hours"
- Header: solid bg, white wordmark, centered nav with active-page underline, "Start Project" CTA right

**Business + Personal listing pages**
- Hero with banner bg + bleed gradient (60vh)
- Sample reels: 3 looping silent videos in a `9/16` grid from `public/samples/{business,personal}/`
- Stills / Occasions grid: 6 frames each from `public/examples/{business,personal}/`
- Before & after: 2 (business) / 4 (personal) wide images
- Single product as a horizontal feature card (image left, content right) via `<ProductCard layout="horizontal" />`

**Product detail (`/products/[slug]`)**
- Manual slideshow: 4:3 aspect, prev/next chevrons (visible on hover), dot indicators, click-to-jump thumbnail strip
- Supports `.mp4`/`.webm`/`.mov` in the `images:` field — autoplay+loop+muted when active. Currently each product leads with a sample reel.
- Sticky on `lg` viewports so the gallery stays visible while reading the right column.

## Real media (from Etsy assets)

Copied a curated set under `public/` from `C:\Projects\Etsy Listings\`:

- `public/hero/business.png` + `public/hero/personal.png` — carousel banners (⚠ have promotional text overlay — see open items)
- `public/samples/business/` — `hyper-motion.mp4`, `tv-spot-1.mp4`, `tv-spot-2.mp4`
- `public/samples/personal/` — `scrappydoo.mp4`, `pet.mp4` (slowlucy), `gender-reveal.mp4`
- `public/examples/business/` — 6 stills + 2 before/afters
- `public/examples/personal/` — 6 stills + 4 before/afters

**Do not use Magnetic Smiles files** — that's a real customer; reserved for a future gallery feature.

## Open items / next steps

| Task | Owner | Notes |
|---|---|---|
| Replace hero bg for Business + Personal pages | Both | `public/hero/business.png` and `public/hero/personal.png` are Etsy carousel banners with promo text ("Celebrate Big Moments", "SHOP CELEBRATIONS") baked in. Either swap for clean atmospheric stills or drop the bg image and revert to gradient-only hero. |
| Set Stripe test keys in `.env.local` | Alex | `STRIPE_SECRET_KEY=sk_test_...` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...` |
| Test checkout end-to-end in test mode | Both | Card `4242 4242 4242 4242` |
| Review product Markdown copy in `src/content/products/` | Alex | Voice + accuracy |
| Review legal pages (`/privacy`, `/terms`, `/refund`) | Alex | Lawyer review eventually; uses Gmail temporarily |
| Set up Cloudflare Email Routing for `@expressitstudios.com` | Alex | Move DNS GoDaddy → Cloudflare, route to Gmail, set up Gmail "Send As" |
| Real ExpressIt logo (currently wordmark) | Alex | Optional |
| Deploy to Vercel | Both | Connect GitHub repo, env vars, point DNS |
| Switch Stripe to live mode | Alex | Live API keys in Vercel, enable Stripe Tax |
| Phase 2 (deferred) | Both | Order tracking, photo uploads, transactional emails, admin |

## Important conventions

- **Products live in MDX** at `src/content/products/*.md`. Schema enforced via Zod (`src/lib/products/schema.ts`). Validated at build time by `scripts/validate-products.mjs` (runs as `prebuild`).
- **Prices in cents** (Stripe convention). `formatPrice(cents)` helper in schema.
- **Variants** = priced SKUs (matrix). **Options** = non-pricing customer selections (e.g. occasion). Both go into Stripe metadata for fulfillment.
- **Contact email**: temporarily `AlexSOuellet@gmail.com` in legal pages and success page. Will switch to `@expressitstudios.com` later. One find-and-replace.
- **No newsletter form** — hidden in Phase 1.
- **All routes** documented in `src/app/sitemap.ts`.

## How to run

```
cd "C:\Projects\ExpressIt Studios\Website"
npm install
cp .env.example .env.local   # then fill in Stripe keys
npm run dev
```

Visit http://localhost:3000.

## Scripts

- `npm run dev` — Turbopack dev server
- `npm run build` — production build (runs `check:products` first)
- `npm run check:products` — validate product MDX frontmatter
- `npm run lint`

## Memory rules (carry-forward)

Saved at `~/.claude/projects/C--Projects-ExpressIt-Studios-Website/memory/`:

- Only browse `ExpressIt Studios` and `Etsy Listings` folders — never RhodyStrong/BohdiCraft/etc.
- Use Next.js + Vercel (not Astro/Cloudflare).
- Build through agreed scope autonomously; check in at visible checkpoints.
- Keep responses terse.

## Where the assets came from

- Hero image: AI-generated via Higgsfield Nano Banana Pro (cinematic studio scene)
- Track card images: AI-generated via Higgsfield Nano Banana Pro
- Etsy reference assets at `C:\Projects\Etsy Listings\` (banners, listing photos, instruction PDFs)
- Stitch mockup: `_reference/DESIGN.md` + `_reference/code.html` + `_reference/screen.png`
