import { NextResponse } from "next/server";
import { z } from "zod";
import { getResend, CONTACT_FROM, CONTACT_TO } from "@/lib/resend";
import { checkOrigin, rateLimit } from "@/lib/api/guards";

const requestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().min(1).max(150),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(0).optional().default(""),
});

export async function POST(req: Request) {
  const originBlock = checkOrigin(req);
  if (originBlock) return originBlock;

  const rateBlock = rateLimit(req, {
    key: "contact",
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (rateBlock) return rateBlock;

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Contact form is not configured." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fill in every field correctly." },
      { status: 400 }
    );
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const { name, email, subject, message } = parsed.data;
  const safe = (s: string) =>
    s.replace(/[<>&]/g, (c) =>
      c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;"
    );

  try {
    await getResend().emails.send({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
      html: `<div style="font-family:system-ui,sans-serif;line-height:1.6">
  <p><strong>From:</strong> ${safe(name)} &lt;${safe(email)}&gt;</p>
  <p><strong>Subject:</strong> ${safe(subject)}</p>
  <hr/>
  <p style="white-space:pre-wrap">${safe(message)}</p>
</div>`,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not send message. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
