import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderForToken, orderUrl, type OrderVideoStatus } from "@/lib/orders";
import { getProductBySlug, formatPrice } from "@/lib/products";
import { vibesForProduct } from "@/lib/vibes";
import { VideoUploader } from "@/components/order/video-uploader";

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
  delivered: "Delivered",
};

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

  const order = await getOrderForToken(id, token);
  if (!order) notFound();

  const product = await getProductBySlug(order.product_slug);
  const variant = product?.variants.find((v) => v.id === order.variant_id);
  const vibes = vibesForProduct(order.product_slug);

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
              ? "Send us your photos"
              : `Send us photos for each of your ${order.videos.length} videos`}
          </h2>

          <div className="space-y-4">
            {order.videos.map((v) => (
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

                <VideoUploader
                  orderId={order.id}
                  videoIndex={v.video_index}
                  token={order.access_token}
                  vibes={vibes}
                  initialStatus={v.status}
                />
              </article>
            ))}
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
