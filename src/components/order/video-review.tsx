"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertCircle, RotateCcw } from "lucide-react";

// Customer review controls for a finished video that's awaiting approval.
// The customer either approves it (-> delivered) or requests revisions, which
// are capped — once revisionsRemaining hits 0, only Approve is offered.
export function VideoReview({
  orderId,
  videoIndex,
  token,
  revisionsRemaining,
}: {
  orderId: string;
  videoIndex: number;
  token: string;
  revisionsRemaining: number;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "revising">("idle");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(
    decision: "approve" | "request_revisions",
    noteText?: string
  ) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/orders/${orderId}/videos/${videoIndex}/review`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token, decision, note: noteText }),
        }
      );
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: "" }));
        throw new Error(msg || "Something went wrong.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  if (mode === "revising") {
    return (
      <div className="space-y-3">
        <label
          htmlFor={`revision-note-${videoIndex}`}
          className="font-mono text-label-caps text-primary uppercase tracking-widest block"
        >
          What would you like changed?
        </label>
        <textarea
          id={`revision-note-${videoIndex}`}
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
          placeholder="Be as specific as you can — timing, music, captions, clips to swap…"
          className="w-full rounded-lg border border-outline bg-surface-container-low p-3 font-body text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
        />
        <p className="font-body text-body-sm text-on-surface-variant">
          {revisionsRemaining} revision{revisionsRemaining === 1 ? "" : "s"}{" "}
          remaining after this one is used.
        </p>
        {error && <ErrorLine message={error} />}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || note.trim().length === 0}
            onClick={() => void submit("request_revisions", note.trim())}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-on-primary px-5 py-2.5 font-mono text-ui-mono uppercase tracking-widest hover:opacity-90 transition disabled:opacity-40"
          >
            {busy ? "Sending…" : "Send revision request"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setMode("idle");
              setError(null);
            }}
            className="font-mono text-ui-mono uppercase tracking-widest text-outline hover:text-on-surface transition"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-body text-body-md text-on-surface-variant">
        Happy with it? Approve to finish — or ask for changes.
      </p>
      {error && <ErrorLine message={error} />}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit("approve")}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-on-primary px-6 py-3 font-mono text-ui-mono uppercase tracking-widest hover:opacity-90 transition disabled:opacity-40"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          {busy ? "Working…" : "Approve this video"}
        </button>
        {revisionsRemaining > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setMode("revising")}
            className="inline-flex items-center gap-2 rounded-lg border border-outline text-on-surface px-6 py-3 font-mono text-ui-mono uppercase tracking-widest hover:border-on-surface-variant transition disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Request revisions ({revisionsRemaining} left)
          </button>
        )}
      </div>
      {revisionsRemaining === 0 && (
        <p className="font-body text-body-sm text-on-surface-variant">
          You&rsquo;ve used all your revisions for this video. If something
          still isn&rsquo;t right, get in touch and we&rsquo;ll make it right.
        </p>
      )}
    </div>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 text-error font-body text-body-sm">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
