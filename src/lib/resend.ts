import "server-only";
import { Resend } from "resend";

let cached: Resend | null = null;

export function getResend(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not set. Configure it in .env.local (dev) or Vercel project env (prod)."
    );
  }
  cached = new Resend(key);
  return cached;
}

// Send contact-form notifications from alex@ instead of a generic
// contact@/noreply@ sender. A real human-name sender reads as more
// trustworthy (both to the recipient and to Gmail's spam scoring), and
// it avoids the Gmail "Send mail as" setup that contact@ would have
// required to make replies work the same way.
export const CONTACT_FROM = "Alex Ouellet <alex@expressitstudios.com>";
export const CONTACT_TO = "alex@expressitstudios.com";

// Named-human From scores better with Gmail's spam filter than a generic
// role account like Orders <orders@…>. The mailbox is the same (alex@) so
// replies still route to Alex; only the display name changes.
export const ORDERS_FROM = "Alex at ExpressIt Studios <alex@expressitstudios.com>";
export const ORDERS_ADMIN_TO = "alex@expressitstudios.com";
