"use client";

import { useState, type FormEvent } from "react";
import { Send, CheckCircle2, AlertTriangle } from "lucide-react";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function ContactForm({
  initialSubject = "",
  initialMessage = "",
}: {
  initialSubject?: string;
  initialMessage?: string;
} = {}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "submitting") return;

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      subject: String(data.get("subject") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
      website: String(data.get("website") ?? ""),
    };

    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setStatus({
          kind: "error",
          message: body.error ?? "Could not send message.",
        });
        return;
      }
      setStatus({ kind: "success" });
      form.reset();
    } catch {
      setStatus({
        kind: "error",
        message: "Network error. Please try again.",
      });
    }
  }

  if (status.kind === "success") {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <CheckCircle2
          className="h-12 w-12 text-primary mx-auto mb-6"
          aria-hidden="true"
        />
        <h2 className="font-headline text-headline-md text-on-surface mb-3">
          Message Sent
        </h2>
        <p className="font-body text-body-md text-on-surface-variant">
          Thanks for reaching out. We&rsquo;ll get back to you within 24
          hours — usually much faster.
        </p>
      </div>
    );
  }

  const submitting = status.kind === "submitting";
  const inputClass =
    "w-full px-4 py-3 rounded-lg bg-surface-container border border-white/10 text-on-surface font-body text-body-md placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors";
  const labelClass =
    "font-mono text-label-caps uppercase tracking-widest text-on-surface-variant block mb-2";

  return (
    <form onSubmit={onSubmit} className="glass-card rounded-xl p-8 md:p-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            disabled={submitting}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClass}>
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            disabled={submitting}
            className={inputClass}
          />
        </div>
      </div>
      <div className="mt-6">
        <label htmlFor="contact-subject" className={labelClass}>
          Subject
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          required
          maxLength={150}
          defaultValue={initialSubject}
          disabled={submitting}
          className={inputClass}
        />
      </div>
      <div className="mt-6">
        <label htmlFor="contact-message" className={labelClass}>
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          defaultValue={initialMessage}
          disabled={submitting}
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Honeypot — real users leave this empty; bots fill it. */}
      <div aria-hidden="true" className="hidden">
        <label>
          Website
          <input
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      {status.kind === "error" ? (
        <div className="mt-6 flex items-start gap-3 p-4 rounded-lg bg-error-container/30 border border-error/40">
          <AlertTriangle
            className="h-5 w-5 text-error shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="font-body text-body-md text-on-error-container">
            {status.message}
          </p>
        </div>
      ) : null}

      <div className="mt-8 flex justify-center">
        <button
          type="submit"
          disabled={submitting}
          className="primary-gradient text-on-primary-fixed font-mono text-ui-mono px-8 py-3 rounded-lg uppercase inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {submitting ? "Sending…" : "Send Message"}
        </button>
      </div>
    </form>
  );
}
