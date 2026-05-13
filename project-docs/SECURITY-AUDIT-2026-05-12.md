# Security & Code-Quality Audit — ExpressIt Studios Website

**Date:** 2026-05-12
**Scope:** Full repo at `C:\Projects\ExpressIt Studios\Website` (Next.js 16.2.6, React 19.2, Supabase, Stripe, Resend)
**Auditor:** Claude Opus 4.7

---

## CRITICAL

### C1. Live-format secrets sitting in `.env.local`
- **File:** `.env.local` (not git-tracked, confirmed never committed via `git log --all --full-history`)
- Stripe key is `sk_test_…` (test mode) so low blast radius.
- `RESEND_API_KEY` (`re_…`) and `SUPABASE_SECRET_KEY` are production-shaped — Resend can send mail from your verified domain (phishing potential); Supabase secret key bypasses RLS.
- They were surfaced in the audit conversation transcript — treat as compromised.
- **Fix:** Rotate `RESEND_API_KEY` and `SUPABASE_SECRET_KEY` now. Keep prod secrets only in Vercel's env UI; use scoped/throwaway keys locally.

---

## HIGH

### H1. No security headers configured
- **File:** `next.config.ts` (currently empty config)
- Missing: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **Why it matters:** clickjacking, MIME sniffing, no HSTS preload, no XSS defense-in-depth. Vercel doesn't add CSP/HSTS/Permissions-Policy by default.
- **Fix:** add an async `headers()` export in `next.config.ts`. CSP for JSON-LD `dangerouslySetInnerHTML` may need a nonce or `'strict-dynamic'`.

### H2. No rate limiting on `/api/contact` or `/api/checkout`
- **Files:** `src/app/api/contact/route.ts`, `src/app/api/checkout/route.ts`
- Contact handler accepts any IP, any frequency, up to 5000-char messages → trivial to exhaust Resend quota / spam inbox.
- Honeypot field (`website`) exists but is bypassed by anyone reading the source.
- **Fix:** Upstash Redis or Vercel KV token bucket keyed on `x-forwarded-for`. Add minimum dwell time (signed timestamp in hidden field) to reject headless bots.

### H3. No Origin/Referer check on JSON API routes
- **Files:** `src/app/api/contact/route.ts`, `src/app/api/checkout/route.ts`
- Cross-origin POSTs are accepted. Combined with H2, enables drive-by spam from third-party sites.
- Stripe webhook is fine (signature-verified).
- **Fix:** validate `req.headers.get("origin")` against `getSiteUrl()`.

---

## MEDIUM

### M1. Email header injection surface in contact form
- **File:** `src/app/api/contact/route.ts:51`
- `subject` is passed to Resend after only length/trim validation. Zod `.email()` on `email` rejects newlines (good), but `subject`/`name` do not.
- **Fix:** add `.regex(/^[^\r\n]+$/)` to `subject` and `name` in the Zod schema.

### M2. Incomplete HTML escaper in email template
- **File:** `src/app/api/contact/route.ts:41`
- `safe()` escapes `<`, `>`, `&` but not `"` or `'`. Currently safe because no interpolation sits inside an HTML attribute — but fragile invariant.
- **Fix:** also escape `"` → `&quot;` and `'` → `&#39;`.

### M3. JSON-LD `</script>` not escaped inside `dangerouslySetInnerHTML`
- **File:** `src/app/products/[slug]/page.tsx:84`
- `JSON.stringify(jsonLd)` does not escape `</script>`. Today input is fully trusted (your own product JSON), but a future product field containing `</script>` would break out of the tag.
- **Fix:** `JSON.stringify(jsonLd).replace(/</g, "\\u003c")`.

### M4. No CSRF token on `/api/contact`
- Same-origin fetch + JSON `Content-Type` makes classic CSRF hard, but combined with H3 (missing Origin check) it widens. Fixing H3 closes this.

### M5. RLS enabled with no policies (intentional, but fragile)
- **File:** `supabase/migrations/0001_init.sql:75`
- Correct design — server-only writes via secret key, anon key blocked. Only valid as long as no browser code ever uses Supabase. Today only `src/lib/supabase/server.ts` constructs a client. Verified safe.
- Storage bucket `order-uploads` is `public: false` but has no storage RLS policies. Add them before wiring signed-URL uploads.
- **Fix:** add a code comment warning future devs not to introduce a browser Supabase client.

### M6. Unused import — sign that lint is not enforced
- **File:** `src/app/products/[slug]/page.tsx:4` — `formatPrice` imported, never used.

### M7. `next lint` is not part of build/CI
- **File:** `package.json` — `prebuild` runs `validate-products.mjs` but not `next lint`.
- **Fix:** add `next lint` to `prebuild` or a CI check.

---

## LOW

- **L1.** `console.error` in `src/app/api/stripe/webhook/route.ts:39` — acceptable, but route through structured logger / Sentry to actually see it.
- **L2.** `src/app/api/checkout/route.ts:131` returns raw `err.message` from Stripe to the browser. Log server-side, return generic message.
- **L3.** Module-cached Supabase client in `src/lib/supabase/server.ts:3` survives HMR with stale env vars in dev. Informational.
- **L4.** Stripe `apiVersion: "2026-04-22.dahlia"` pinning is correct.
- **L6.** Mobile menu uses native `<details>`/`<summary>` (`src/components/site/site-header.tsx:68`) — doesn't close on link tap. Minor UX.
- **L7.** `react-markdown` is used without `rehype-raw` — raw HTML in markdown is escaped. Keep that constraint if blog ever becomes user-generated.

---

## INFO

- **I1.** `npm audit --omit=dev`: **0 critical, 0 high, 2 moderate** (`postcss` transitive via Next). Fix-available is a Next major downgrade — wait for upstream patch.
- **I2.** Stack is current: Next 16.2.6, React 19.2, Stripe 22, Resend 6, Zod 4. Verify `npm ls lucide-react` — `^1.14.0` may be a stale fork vs the modern `0.5xx` line.
- **I3.** `public/` contains only intended media. `_reference/*.zip` at repo root is untracked working file.
- **I4.** `output: 'export'` is NOT set — correct, since API routes need Node runtime.
- **I5.** Production browser source maps disabled (Next 16 default). Good.
- **I6.** Only one Supabase query exists (`orders.upsert` in webhook), parameterized via JS client. No raw SQL, no `.rpc()`. Safe from SQLi.
- **I7.** Per `AGENTS.md`: this is non-standard Next.js — check `node_modules/next/dist/docs/` before writing the headers API for H1.

---

## Top 5 actions, in order

1. **Rotate `RESEND_API_KEY` and `SUPABASE_SECRET_KEY`** — assume compromised.
2. Add security headers in `next.config.ts` (H1).
3. Rate limit + Origin check on `/api/contact` and `/api/checkout` (H2, H3).
4. Tighten contact-form Zod schema (no `\r\n` in `subject`/`name`) and extend `safe()` to cover `"`/`'` (M1, M2).
5. Escape `</script>` in JSON-LD output (M3) and wire `next lint` into `prebuild` (M7).

Suggested grouping:
- **PR 1 (small):** H1 + M3 + M7
- **PR 2:** H2 + H3 once a rate-limit backend is chosen (Upstash Redis vs Vercel KV)
- **PR 3:** M1 + M2 + M5 comment + M6 cleanup
