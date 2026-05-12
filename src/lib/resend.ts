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

export const CONTACT_FROM = "ExpressIt Studios <noreply@expressitstudios.com>";
export const CONTACT_TO = "alex@expressitstudios.com";
