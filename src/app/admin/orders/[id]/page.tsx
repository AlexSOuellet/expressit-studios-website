import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminOrder } from "@/lib/admin";
import { getProductBySlug, formatPrice } from "@/lib/products";
import { vibesForProduct } from "@/lib/vibes";
import { orderUrl, type OrderVideoStatus } from "@/lib/orders";
import { VideoStatusActions, DeliverForm } from "@/components/admin/order-actions";

export const metadata: Metadata = {
  title: "Admin — Order",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type RouteParams = Promise<{ id: string }>;

const VIDEO_STATUS_LABEL: Record<OrderVideoStatus, string> = {
  awaiting_photos: "Awaiting photos",
  photos_received: "Photos received",
  in_editing: "In editing",
  delivered: "Delivered",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const product = await getProductBySlug(order.product_slug);
  const variant = product?.variants.find((v) => v.id === order.variant_id);
  const vibeLabel = new Map(
    vibesForProduct(order.product_slug).map((v) => [v.id, v.label])
  );

  return (
    <main className="flex-1 px-margin-mobile md:px-margin-desktop py-16">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10">
          <Link
            href="/admin"
            className="font-mono text-ui-mono uppercase tracking-widest text-primary hover:underline"
          >
            ← All orders
          </Link>
          <h1 className="font-display text-headline-xl text-on-surface mt-3 mb-2">
            Order #{order.id.slice(0, 8)}
          </h1>
          <p className="font-body text-body-md text-on-surface-variant">
            {product?.title ?? order.product_slug} ·{" "}
            {variant?.label ?? order.variant_id} · {formatPrice(order.price_cents)}
          </p>
        </header>

        <section className="glass-card rounded-xl p-6 mb-8">
          <h2 className="font-mono text-label-caps text-primary uppercase tracking-widest mb-4">
            Order details
          </h2>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 font-body text-body-md">
            <dt className="text-on-surface-variant">Customer</dt>
            <dd className="text-on-surface break-all">{order.customer_email}</dd>
            <dt className="text-on-surface-variant">Status</dt>
            <dd className="text-on-surface">{order.status}</dd>
            <dt className="text-on-surface-variant">Stripe session</dt>
            <dd className="text-on-surface break-all font-mono text-ui-mono">
              {order.stripe_session_id}
            </dd>
            {Object.entries(order.options).map(([k, v]) => (
              <span key={k} className="contents">
                <dt className="text-on-surface-variant capitalize">
                  {k.replace(/_/g, " ")}
                </dt>
                <dd className="text-on-surface">{v}</dd>
              </span>
            ))}
            <dt className="text-on-surface-variant">Customer link</dt>
            <dd className="text-on-surface break-all">
              <Link
                href={orderUrl(order.id, order.access_token)}
                className="text-primary hover:underline font-mono text-ui-mono"
              >
                {orderUrl(order.id, order.access_token)}
              </Link>
            </dd>
          </dl>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-label-caps text-primary uppercase tracking-widest mb-4">
            Videos
          </h2>
          <div className="space-y-4">
            {order.videos.map((v) => (
              <article key={v.video_index} className="glass-card rounded-xl p-6">
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="font-display text-headline-md text-on-surface">
                    Video {v.video_index}
                  </h3>
                  <span className="font-mono text-ui-mono uppercase tracking-widest text-secondary">
                    {VIDEO_STATUS_LABEL[v.status]}
                  </span>
                </div>

                <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 font-body text-body-md mb-5">
                  <dt className="text-on-surface-variant">Vibe</dt>
                  <dd className="text-on-surface">
                    {v.vibe ? vibeLabel.get(v.vibe) ?? v.vibe : "—"}
                  </dd>
                  <dt className="text-on-surface-variant">Brief</dt>
                  <dd className="text-on-surface whitespace-pre-wrap">
                    {v.brief.trim() || "—"}
                  </dd>
                </dl>

                {v.uploads.length > 0 && (
                  <ul className="grid grid-cols-3 gap-3 mb-5">
                    {v.uploads.map((u) => (
                      <li
                        key={u.id}
                        className="relative aspect-square rounded-lg overflow-hidden bg-surface-container-low border border-outline"
                      >
                        {u.signedUrl ? (
                          <a
                            href={u.signedUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={`${u.original_filename} · ${formatBytes(u.size_bytes)}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={u.signedUrl}
                              alt={u.original_filename}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          </a>
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center font-mono text-ui-mono text-outline p-2 text-center">
                            {u.original_filename}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <VideoStatusActions
                  orderId={order.id}
                  videoIndex={v.video_index}
                  status={v.status}
                />
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-xl p-6">
          <h2 className="font-mono text-label-caps text-primary uppercase tracking-widest mb-4">
            Delivered video link
          </h2>
          <p className="font-body text-body-sm text-on-surface-variant mb-4">
            The customer sees this link on their order page once it&rsquo;s set.
          </p>
          <DeliverForm orderId={order.id} initialUrl={order.delivered_video_url} />
        </section>
      </div>
    </main>
  );
}
