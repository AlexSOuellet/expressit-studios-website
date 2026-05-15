import "server-only";
import { getResend, ORDERS_FROM, ORDERS_ADMIN_TO } from "@/lib/resend";
import { orderUrl, type OrderRow, type OrderVideoRow } from "@/lib/orders";
import { getProductBySlug } from "@/lib/products";

// Status-transition transactional emails. Every send is wrapped so a Resend
// failure never bubbles up into the underlying order operation — we log and
// move on. Order state is the source of truth; an unsent email is recoverable,
// a broken webhook is not.

const HTML_ESCAPES: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
  "'": "&#39;",
};
const safe = (s: string) => s.replace(/[<>&"']/g, (c) => HTML_ESCAPES[c]!);

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://expressitstudios.com";
}

function customerOrderLink(order: Pick<OrderRow, "id" | "access_token">): string {
  return `${siteOrigin()}${orderUrl(order.id, order.access_token)}`;
}

function adminOrderLink(orderId: string): string {
  return `${siteOrigin()}/admin/orders/${orderId}`;
}

async function send(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  try {
    // The Resend SDK does NOT throw on send errors — it returns { data, error }.
    // We have to inspect the result to know whether the message was accepted.
    const result = await getResend().emails.send({
      from: ORDERS_FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    if (result.error) {
      console.error("[emails] send rejected", {
        to: args.to,
        subject: args.subject,
        error: result.error,
      });
    } else {
      console.log("[emails] sent", {
        to: args.to,
        subject: args.subject,
        id: result.data?.id,
      });
    }
  } catch (err) {
    console.error(
      "[emails] send threw",
      { to: args.to, subject: args.subject },
      err
    );
  }
}

async function productTitle(slug: string): Promise<string> {
  const p = await getProductBySlug(slug);
  return p?.title ?? slug;
}

function shell(bodyHtml: string): string {
  return `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px">
${bodyHtml}
<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0"/>
<p style="color:#666;font-size:13px">ExpressIt Studios · <a href="${siteOrigin()}" style="color:#666">expressitstudios.com</a></p>
</div>`;
}

// ───────────────────────────────────────────────────────────────────────────
// 1. Order paid — to customer. Includes the bookmark link.
// ───────────────────────────────────────────────────────────────────────────
export async function sendOrderConfirmation(order: OrderRow): Promise<void> {
  const link = customerOrderLink(order);
  const title = await productTitle(order.product_slug);

  const html = shell(`
<p>Thanks for your order — payment received.</p>
<p><strong>${safe(title)}</strong></p>
<p>The next step is for us to receive your photos and a quick brief. Open your order page to upload them:</p>
<p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px">Open your order</a></p>
<p style="font-size:13px;color:#444">Save this link — it's how you'll come back to view progress, review the finished video, and request revisions:<br/><a href="${link}">${link}</a></p>
`);

  const text = `Thanks for your order — payment received.

${title}

Next step: upload your photos at
${link}

Save this link — it's how you'll come back to view progress and review the finished video.`;

  await send({
    to: order.customer_email,
    subject: `Your ExpressIt order — next step: send us your photos`,
    html,
    text,
  });
}

// ───────────────────────────────────────────────────────────────────────────
// 2. A video's photos came in — to admin (Alex). Fires per-video so a bundle
//    customer who submits at different times produces multiple notifications.
// ───────────────────────────────────────────────────────────────────────────
export async function sendAdminPhotosReceived(
  order: OrderRow,
  videoIndex: number,
  videoCount: number
): Promise<void> {
  const title = await productTitle(order.product_slug);
  const link = adminOrderLink(order.id);
  const which =
    videoCount > 1 ? `Video ${videoIndex} of ${videoCount}` : "Photos";

  const html = shell(`
<p>Heads up — a customer just uploaded photos.</p>
<p><strong>${safe(title)}</strong> — ${safe(which)}<br/>${safe(order.customer_email)}</p>
<p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px">Open in admin</a></p>
`);

  const text = `A customer just uploaded photos.

${title} — ${which}
${order.customer_email}

Admin link: ${link}`;

  await send({
    to: ORDERS_ADMIN_TO,
    subject: `${which} ready to edit: ${title}`,
    html,
    text,
  });
}

// ───────────────────────────────────────────────────────────────────────────
// 3. Finished video uploaded — to customer.
// ───────────────────────────────────────────────────────────────────────────
export async function sendAwaitingApproval(
  order: OrderRow,
  videoIndex: number,
  videoCount: number
): Promise<void> {
  const link = customerOrderLink(order);
  const title = await productTitle(order.product_slug);
  const which =
    videoCount > 1 ? ` (video ${videoIndex} of ${videoCount})` : "";

  const html = shell(`
<p>Your video is ready to review${which}.</p>
<p><strong>${safe(title)}</strong></p>
<p>Take a look — you can either approve it, or request changes:</p>
<p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px">Review your video</a></p>
`);

  const text = `Your video is ready to review${which}.

${title}

Approve or request changes here:
${link}`;

  await send({
    to: order.customer_email,
    subject: `Your video is ready to review${which}`,
    html,
    text,
  });
}

// ───────────────────────────────────────────────────────────────────────────
// 4. Customer requested revisions — to admin.
// ───────────────────────────────────────────────────────────────────────────
export async function sendAdminRevisionsRequested(
  order: OrderRow,
  video: OrderVideoRow
): Promise<void> {
  const title = await productTitle(order.product_slug);
  const link = adminOrderLink(order.id);
  const note = video.revision_note?.trim() || "(no note provided)";

  const html = shell(`
<p>The customer requested revisions on video ${video.video_index}.</p>
<p><strong>${safe(title)}</strong><br/>${safe(order.customer_email)}</p>
<p><strong>Their note:</strong></p>
<blockquote style="margin:0;padding:10px 14px;background:#f6f6f6;border-left:3px solid #ccc;white-space:pre-wrap">${safe(note)}</blockquote>
<p>Revision ${video.revision_count} of 2.</p>
<p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px">Open in admin</a></p>
`);

  const text = `The customer requested revisions on video ${video.video_index}.

${title}
${order.customer_email}

Their note:
${note}

Revision ${video.revision_count} of 2.

Admin link: ${link}`;

  await send({
    to: ORDERS_ADMIN_TO,
    subject: `Revisions requested: ${title}`,
    html,
    text,
  });
}

// ───────────────────────────────────────────────────────────────────────────
// 5. Customer approved — thank-you to customer.
// ───────────────────────────────────────────────────────────────────────────
export async function sendDeliveredThanks(
  order: OrderRow,
  videoIndex: number,
  videoCount: number
): Promise<void> {
  const link = customerOrderLink(order);
  const title = await productTitle(order.product_slug);
  const which =
    videoCount > 1 ? ` Video ${videoIndex} of ${videoCount} is yours forever.` : "";

  const html = shell(`
<p>Thanks for approving — and thanks for choosing ExpressIt Studios.</p>
<p><strong>${safe(title)}</strong></p>
<p>${safe(which.trim()) || "Your video is yours forever."} You can download it any time from your order page:</p>
<p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px">Open your order</a></p>
`);

  const text = `Thanks for approving — and thanks for choosing ExpressIt Studios.

${title}
${which.trim() || "Your video is yours forever."}

Download any time:
${link}`;

  await send({
    to: order.customer_email,
    subject: `Thanks — your video is ready to download`,
    html,
    text,
  });
}

// ───────────────────────────────────────────────────────────────────────────
// 6. Customer approved — admin notification so Alex knows the order closed.
// ───────────────────────────────────────────────────────────────────────────
export async function sendAdminOrderApproved(
  order: OrderRow,
  videoIndex: number,
  videoCount: number,
  allDelivered: boolean
): Promise<void> {
  const title = await productTitle(order.product_slug);
  const link = adminOrderLink(order.id);
  const which =
    videoCount > 1
      ? `Video ${videoIndex} of ${videoCount} approved`
      : `Video approved`;
  const closing = allDelivered
    ? `Every video on this order is now delivered.`
    : `Other videos on this order are still in progress.`;

  const html = shell(`
<p>${safe(which)} by the customer.</p>
<p><strong>${safe(title)}</strong><br/>${safe(order.customer_email)}</p>
<p>${safe(closing)}</p>
<p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px">Open in admin</a></p>
`);

  const text = `${which} by the customer.

${title}
${order.customer_email}

${closing}

Admin link: ${link}`;

  const subject = allDelivered
    ? `Order fully delivered: ${title}`
    : `${which}: ${title}`;

  await send({
    to: ORDERS_ADMIN_TO,
    subject,
    html,
    text,
  });
}
