import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { previewTestData, wipeTestData } from "@/lib/admin/wipe-test";

export const metadata: Metadata = {
  title: "Admin — Wipe test data",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  done?: string;
  orders?: string;
  uploads?: string;
  deliverables?: string;
}>;

async function performWipe() {
  "use server";
  const { redirect } = await import("next/navigation");
  const result = await wipeTestData();
  revalidatePath("/admin");
  revalidatePath("/admin/wipe-test");
  redirect(
    `/admin/wipe-test?done=1&orders=${result.orders}&uploads=${result.uploadFiles}&deliverables=${result.deliverableFiles}`
  );
}

export default async function WipeTestPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const justRan = params.done === "1";
  const summary = await previewTestData();
  const nothingToDo = summary.orders === 0;

  return (
    <main className="flex-1 px-margin-mobile md:px-margin-desktop py-16">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-3">
            Admin
          </span>
          <h1 className="font-display text-headline-xl text-on-surface mb-2">
            Wipe test data
          </h1>
          <p className="font-body text-body-md text-on-surface-variant">
            Deletes every Stripe <strong>test-mode</strong> order plus its videos,
            uploads, and storage files in both private buckets. Live-mode orders
            are never touched.
          </p>
        </header>

        {justRan && (
          <div className="glass-card rounded-xl p-5 mb-6 border-l-4 border-primary">
            <p className="font-body text-body-md text-on-surface">
              <strong>Done.</strong> Removed {params.orders ?? "0"} orders,{" "}
              {params.uploads ?? "0"} upload files, {params.deliverables ?? "0"}{" "}
              deliverable files.
            </p>
          </div>
        )}

        <section className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-display text-headline-sm text-on-surface">
            Currently in the database
          </h2>
          <ul className="font-body text-body-md text-on-surface-variant space-y-1">
            <li>
              <strong>{summary.orders}</strong> test-mode orders
            </li>
            <li>
              <strong>{summary.uploadFiles}</strong> files in{" "}
              <code>order-uploads</code>
            </li>
            <li>
              <strong>{summary.deliverableFiles}</strong> files in{" "}
              <code>order-deliverables</code>
            </li>
          </ul>

          {nothingToDo ? (
            <p className="font-body text-body-sm text-outline">
              Nothing to wipe — no test-mode orders exist right now.
            </p>
          ) : (
            <form action={performWipe} className="pt-2">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-mono uppercase tracking-wider text-ui-mono px-5 py-3 rounded-lg transition"
              >
                Wipe {summary.orders}{" "}
                {summary.orders === 1 ? "order" : "orders"} now
              </button>
              <p className="font-body text-body-sm text-outline mt-3">
                This is irreversible. Storage files are deleted from Supabase
                immediately.
              </p>
            </form>
          )}
        </section>

        <p className="mt-8">
          <Link href="/admin" className="underline text-primary">
            ← Back to orders
          </Link>
        </p>
      </div>
    </main>
  );
}
