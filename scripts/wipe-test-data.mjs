#!/usr/bin/env node
// Delete every Stripe test-mode order plus its order_videos, uploads,
// and storage files. Live-mode rows (orders.livemode = true) are
// untouched. Run when test data starts cluttering the admin dashboard
// or before going live.
//
//   npm run wipe:test
//
// Reads SUPABASE config from .env.local. Idempotent — safe to re-run.
// Prints a summary and asks for confirmation unless --yes is passed.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const envPath = resolve(process.cwd(), ".env.local");
let envText = "";
try {
  envText = readFileSync(envPath, "utf8");
} catch {
  console.error(`Could not read ${envPath}. Run from the project root.`);
  process.exit(1);
}
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
};

async function pgGet(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!r.ok) throw new Error(`GET ${path} ${r.status}: ${await r.text()}`);
  return r.json();
}

async function pgDelete(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "DELETE",
    headers: { ...headers, Prefer: "return=minimal" },
  });
  if (!r.ok) throw new Error(`DELETE ${path} ${r.status}: ${await r.text()}`);
}

async function listStorage(bucket, prefix = "") {
  // PostgREST list — same API the dashboard uses.
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ prefix, limit: 1000, sortBy: { column: "name", order: "asc" } }),
  });
  if (!r.ok) throw new Error(`list ${bucket} ${r.status}: ${await r.text()}`);
  return r.json();
}

async function removeStorageFiles(bucket, paths) {
  if (paths.length === 0) return;
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}`, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ prefixes: paths }),
  });
  if (!r.ok) throw new Error(`remove ${bucket} ${r.status}: ${await r.text()}`);
}

const testOrders = await pgGet(
  "orders?select=id&livemode=eq.false"
);
const ids = testOrders.map((o) => o.id);

if (ids.length === 0) {
  console.log("No test-mode orders found. Nothing to do.");
  process.exit(0);
}

// Collect storage paths to wipe (uploads + deliverables) before deleting the
// rows that point at them.
const uploadRows = await pgGet(
  `uploads?select=storage_path&order_id=in.(${ids.join(",")})`
);
const videoRows = await pgGet(
  `order_videos?select=deliverable_path&order_id=in.(${ids.join(",")})&deliverable_path=not.is.null`
);
const uploadPaths = uploadRows.map((r) => r.storage_path).filter(Boolean);
const deliverablePaths = videoRows.map((r) => r.deliverable_path).filter(Boolean);

console.log(`About to delete:`);
console.log(`  ${ids.length} orders (livemode=false)`);
console.log(`  ${uploadPaths.length} files in order-uploads`);
console.log(`  ${deliverablePaths.length} files in order-deliverables`);

const yes = process.argv.includes("--yes") || process.argv.includes("-y");
if (!yes) {
  const rl = createInterface({ input, output });
  const answer = (await rl.question("Type YES to proceed: ")).trim();
  rl.close();
  if (answer !== "YES") {
    console.log("Aborted.");
    process.exit(0);
  }
}

// Delete storage first (orphan rows are recoverable; orphan files are not).
await removeStorageFiles("order-uploads", uploadPaths);
await removeStorageFiles("order-deliverables", deliverablePaths);

// Children before parents (FK cascades may already handle this depending on
// the schema, but explicit is cheap and clear).
await pgDelete(`uploads?order_id=in.(${ids.join(",")})`);
await pgDelete(`order_videos?order_id=in.(${ids.join(",")})`);
await pgDelete(`orders?id=in.(${ids.join(",")})`);

console.log(`Wiped ${ids.length} test orders + associated files.`);
