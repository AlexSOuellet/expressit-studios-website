import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getOrderForToken,
  getDeliverableUrl,
  orderUrl,
  MAX_REVISIONS,
  type OrderVideoStatus,
  type OrderWithVideos,
} from "@/lib/orders";
import { getProductBySlug, formatPrice } from "@/lib/products";
import { vibesForProduct } from "@/lib/vibes";
import { VideoUploader } from "@/components/order/video-uploader";
import { VideoReview } from "@/components/order/video-review";

export const metadata: Metadata = {
  title: "Your Order",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ t?: string }>;
type RouteParams = Promise<{ id: string }>;

const VIDEO_STATUS_LABEL: Record<OrderVideoStatus, string> = {
  awaiting_photos: "Awaiting your photos",
  photos_received: "Photos received",
  in_editing: "In editing",
  awaiting_approval: "Ready for your review",
  revisions_requested: "Revisions in progress",
  delivered: "Delivered",
};

type VideoLinks = { view: string | null; download: string | null };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: RouteParams;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  const token = t ?? "";

  const order: OrderWithVideos | null = await getOrderForToken(id, token);
  if (!order) notFound();

  const product = await getProductBySlug(order.product_slug);
  const variant = product?.variants.find((v) => v.id === order.variant_id);
  const vibes = vibesForProduct(order.product_slug);

  // Sign the finished-video links for any video that has a deliverable.
  const deliverableLinks = new Map<number, VideoLinks>();
  await Promise.all(
    order.videos.map(async (v) => {
      if (!v.deliverable_path) return;
      const [view, download] = await Promise.all([
        getDeliverableUrl(v.deliverable_path),
        getDeliverableUrl(v.deliverable_path, { download: true }),
      ]);
      deliverableLinks.set(v.video_index, { view, download });
    })
  );

  return (
    <main className="flex-1 px-margin-mobile md:px-margin-desktop py-16">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10">
          <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-3">
            Your Order
          </span>
          <h1 className="font-display text-headline-xl text-on-surface mb-4">
            {product?.title ?? order.product_slug}
          </h1>
          <p className="font-body text-body-md text-on-surface-variant">
            {variant?.label ?? order.variant_id} ·{" "}
            {formatPrice(order.price_cents)} ·{" "}
            <span className="font-mono text-ui-mono uppercase tracking-wider">
              Order #{order.id.slice(0, 8)}
            </span>
          </p>
        </header>

        <section className="glass-card rounded-xl p-6 mb-8">
          <h2 className="font-mono text-label-caps text-primary uppercase tracking-widest mb-4">
            What you bought
          </h2>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 font-body text-body-md">
            <dt className="text-on-surface-variant">Product</dt>
            <dd className="text-on-surface">{product?.title ?? order.product_slug}</dd>
            <dt className="text-on-surface-variant">Variant</dt>
            <dd className="text-on-surface">{variant?.label ?? order.variant_id}</dd>
            {Object.entries(order.options).map(([k, v]) => (
              <span key={k} className="contents">
                <dt className="text-on-surface-variant capitalize">{k.replace(/_/g, " ")}</dt>
                <dd className="text-on-surface">{v}</dd>
              </span>
            ))}
            <dt className="text-on-surface-variant">Total</dt>
            <dd className="text-on-surface">{formatPrice(order.price_cents)}</dd>
            <dt className="text-on-surface-variant">Email</dt>
            <dd className="text-on-surface">{order.customer_email}</dd>
          </dl>
        </section>

        <section className="mb-8">
          <h2 className="font-mono text-label-caps text-primary uppercase tracking-widest mb-4">
            {order.videos.length === 1
              ? "Your video"
              : `Your ${order.videos.length} videos`}
          </h2>

          <div className="space-y-4">
            {order.videos.map((v) => {
              const links = deliverableLinks.get(v.video_index);
              const revisionsRemaining = Math.max(
                0,
                MAX_REVISIONS - v.revision_count
              );
              return (
                <article
                  key={v.video_index}
                  className="glass-card rounded-xl p-6"
                  aria-labelledby={`video-${v.video_index}-title`}
                >
                  <div className="flex items-baseline justify-between mb-4">
                    <h3
                      id={`video-${v.video_index}-title`}
                      className="font-display text-headline-md text-on-surface"
                    >
                      Video {v.video_index}
                    </h3>
                    <span className="font-mono text-ui-mono uppercase tracking-widest text-secondary">
                      {VIDEO_STATUS_LABEL[v.status]}
                    </span>
                  </div>

                  {v.status === "awaiting_photos" && (
                    <VideoUploader
                      orderId={order.id}
                      videoIndex={v.video_index}
                      token={order.access_token}
                      vibes={vibes}
                      initialStatus={v.status}
                    />
                  )}

                  {(v.status === "photos_received" ||
                    v.status === "in_editing") && (
                    <p className="font-body text-body-md text-on-surface-variant">
                      We&rsquo;ve got your photos — your video is in the works.
                      We&rsquo;ll let you know the moment it&rsquo;s ready to
                      review.
                    </p>
                  )}

                  {v.status === "revisions_requested" && (
                    <p className="font-body text-body-md text-on-surface-variant">
                      Thanks — we&rsquo;re working on your requested changes and
                      will send the updated cut for review shortly.
                    </p>
                  )}

                  {v.status === "awaiting_approval" && (
                    <div className="space-y-5">
                      {links?.view && (
                        <video
                          src={links.view}
                          controls
                          className="w-full rounded-lg border border-outline bg-black"
                        />
                      )}
                      <VideoReview
                        orderId={order.id}
                        videoIndex={v.video_index}
                        token={order.access_token}
                        revisionsRemaining={revisionsRemaining}
                      />
                    </div>
                  )}

                  {v.status === "delivered" && (
                    <div className="space-y-4">
                      {links?.view && (
                        <video
                          src={links.view}
                          controls
                          className="w-full rounded-lg border border-outline bg-black"
                        />
                      )}
                      <p className="font-body text-body-md text-secondary">
                        Approved and delivered — thank you!
                      </p>
                      {links?.download && (
                        <a
                          href={links.download}
                          className="inline-flex items-center gap-2 rounded-lg bg-primary text-on-primary px-6 py-3 font-mono text-ui-mono uppercase tracking-widest hover:opacity-90 transition"
                        >
                          ↓ Download your video
                        </a>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <footer className="text-center">
          <p className="font-body text-body-sm text-on-surface-variant mb-2">
            Bookmark this page — it&rsquo;s your private link to this order.
          </p>
          <p className="font-mono text-ui-mono uppercase tracking-widest text-outline">
            <Link href="/" className="hover:underline text-primary">
              ← Back to home
            </Link>
          </p>
          {/* hidden anchor used by share/print flows */}
          <span className="sr-only">{orderUrl(order.id, order.access_token)}</span>
        </footer>
      </div>
    </main>
  );
}
