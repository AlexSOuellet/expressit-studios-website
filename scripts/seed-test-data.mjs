#!/usr/bin/env node
// Seed ~20 fake orders with varied statuses/dates/customers so the admin
// dashboard has data to render. Everything is marked livemode=false so
// `npm run wipe:test` can clean it up. To see the seeded data in the
// admin UI, append ?test=1 to /admin, /admin/financial, etc.
//
//   npm run seed:test
//
// Idempotent: re-running adds another batch. Run wipe:test first if you
// want a clean slate.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID, randomBytes } from "node:crypto";

const envPath = resolve(process.cwd(), ".env.local");
const envText = readFileSync(envPath, "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function pgPost(path, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`POST ${path} ${r.status}: ${await r.text()}`);
  return r.json();
}

// 15 unique customers, with 4 of them buying twice → 19 orders total.
const CUSTOMERS = [
  { email: "sara.kim@example.com", repeat: true },
  { email: "mike.thompson@example.com", repeat: false },
  { email: "j.patel@example.com", repeat: true },
  { email: "emily.r@example.com", repeat: false },
  { email: "alex.morgan@example.com", repeat: false },
  { email: "carlos.diaz@example.com", repeat: true },
  { email: "lauren.b@example.com", repeat: false },
  { email: "david.chen@example.com", repeat: false },
  { email: "rachel.k@example.com", repeat: false },
  { email: "tom.fischer@example.com", repeat: true },
  { email: "priya.shah@example.com", repeat: false },
  { email: "kevin.oh@example.com", repeat: false },
  { email: "natalie.w@example.com", repeat: false },
  { email: "ben.lee@example.com", repeat: false },
  { email: "isabella.r@example.com", repeat: false },
];

const VARIANTS_BUSINESS = [
  { id: "business-single-starter", price: 3500 },
  { id: "business-single-pro", price: 5000 },
  { id: "business-single-premium", price: 7000 },
  { id: "business-bundle3-starter", price: 7500 },
  { id: "business-bundle3-pro", price: 12500 },
  { id: "business-bundle3-premium", price: 20000 },
];
const VARIANT_PERSONAL = { id: "personal-flat", price: 2499 };

const OCCASIONS = [
  "pet",
  "birthday",
  "gender-reveal",
  "anniversary",
  "wedding",
  "memorial",
  "other",
];

const STATUSES = [
  "awaiting_photos",
  "photos_received",
  "in_editing",
  "awaiting_approval",
  "revisions_requested",
  "delivered",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d.toISOString();
}

// Build the order list: each customer gets at least one order, repeat
// customers get two.
const ordersPlan = [];
for (const cust of CUSTOMERS) {
  const count = cust.repeat ? 2 : 1;
  for (let i = 0; i < count; i++) ordersPlan.push(cust.email);
}

// Spread dates: most recent in the last week, some this month, some older.
const ages = ordersPlan
  .map((_, idx) => {
    if (idx < 5) return Math.floor(Math.random() * 7); // this week
    if (idx < 12) return 7 + Math.floor(Math.random() * 21); // 1-4 weeks
    return 28 + Math.floor(Math.random() * 32); // 4-8 weeks
  })
  .sort((a, b) => a - b);

let created = 0;
let skipped = 0;
for (let i = 0; i < ordersPlan.length; i++) {
  const email = ordersPlan[i];
  const isBusiness = Math.random() < 0.6;
  const variant = isBusiness ? pick(VARIANTS_BUSINESS) : VARIANT_PERSONAL;
  const productSlug = isBusiness
    ? "custom-product-video-ad"
    : "custom-memory-video";
  const status = pick(STATUSES);
  const createdAt = daysAgo(ages[i]);
  const orderId = randomUUID();
  const accessToken = randomBytes(32).toString("base64url");
  const options = isBusiness ? {} : { occasion: pick(OCCASIONS) };

  let inserted;
  try {
    inserted = await pgPost("orders", {
      id: orderId,
      stripe_session_id: `seed_${randomBytes(8).toString("hex")}`,
      customer_email: email,
      product_slug: productSlug,
      variant_id: variant.id,
      options,
      price_cents: variant.price,
      status,
      access_token: accessToken,
      livemode: false,
      created_at: createdAt,
    });
  } catch (err) {
    console.error("skip:", err.message);
    skipped += 1;
    continue;
  }

  const orderRow = inserted[0];
  const videoCount = variant.id.includes("bundle3") ? 3 : 1;

  // For non-awaiting orders, simulate that the photos were submitted.
  const submittedAt =
    status === "awaiting_photos" ? null : daysAgo(Math.max(0, ages[i] - 1));

  const videoRows = Array.from({ length: videoCount }, (_, vi) => ({
    order_id: orderRow.id,
    video_index: vi + 1,
    brief:
      status === "awaiting_photos"
        ? ""
        : "Make it pop. Bright colors, fast cuts.",
    vibe: isBusiness ? "custom-product-video-ad" : null,
    status: videoStatusFor(status),
    submitted_at: submittedAt,
    revision_count: status === "revisions_requested" ? 1 : 0,
    revision_note:
      status === "revisions_requested"
        ? "Can we make the music a bit slower?"
        : null,
  }));

  try {
    await pgPost("order_videos", videoRows);
    created += 1;
  } catch (err) {
    console.error("video insert failed:", err.message);
  }
}

function videoStatusFor(orderStatus) {
  // Mirror the order's status onto each video (close enough for seed data).
  return orderStatus;
}

console.log(`Seeded ${created} orders (${skipped} skipped).`);
console.log(`View in admin: open /admin?test=1 (and /admin/orders?test=1, /admin/financial?test=1, /admin/customers?test=1)`);
console.log(`Clean up later: npm run wipe:test`);
