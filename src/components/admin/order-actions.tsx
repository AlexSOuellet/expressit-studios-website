"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Check, AlertCircle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import type { OrderVideoStatus } from "@/lib/orders";

const ALLOWED_MIME = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
]);
const MAX_BYTES = 500 * 1024 * 1024;

async function postStatus(
  orderId: string,
  videoIndex: number,
  status: OrderVideoStatus
): Promise<void> {
  const res = await fetch(
    `/api/admin/orders/${orderId}/videos/${videoIndex}/status`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    }
  );
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "" }));
    throw new Error(error || "Update failed.");
  }
}

// Per-video admin controls. What renders depends on the video's status:
// photos_received -> start editing; in_editing / revisions_requested -> upload
// the finished video; awaiting_approval -> pull back to editing; delivered is
// terminal.
export function VideoAdminPanel({
  orderId,
  videoIndex,
  status,
}: {
  orderId: string;
  videoIndex: number;
  status: OrderVideoStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      ),
    []
  );

  const move = useCallback(
    async (to: OrderVideoStatus) => {
      setBusy(true);
      setError(null);
      try {
        await postStatus(orderId, videoIndex, to);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Update failed.");
      } finally {
        setBusy(false);
      }
    },
    [orderId, videoIndex, router]
  );

  const uploadDeliverable = useCallback(
    async (file: File) => {
      setError(null);
      if (!ALLOWED_MIME.has(file.type)) {
        setError("Use an MP4, MOV, WebM, or M4V file.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Video must be 500 MB or smaller.");
        return;
      }

      setBusy(true);
      try {
        setProgress("Preparing upload…");
        const signRes = await fetch(
          `/api/admin/orders/${orderId}/videos/${videoIndex}/deliverable-url`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              video_index: videoIndex,
              filename: file.name,
              mime: file.type,
              size: file.size,
            }),
          }
        );
        if (!signRes.ok) {
          const { error: msg } = await signRes.json().catch(() => ({ error: "" }));
          throw new Error(msg || "Could not start upload.");
        }
        const { path, token } = (await signRes.json()) as {
          path: string;
          token: string;
        };

        setProgress("Uploading video…");
        const { error: putErr } = await supabase.storage
          .from("order-deliverables")
          .uploadToSignedUrl(path, token, file, { contentType: file.type });
        if (putErr) throw new Error(putErr.message || "Upload failed.");

        setProgress("Finishing up…");
        const confirmRes = await fetch(
          `/api/admin/orders/${orderId}/videos/${videoIndex}/deliverable`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ path }),
          }
        );
        if (!confirmRes.ok) {
          const { error: msg } = await confirmRes.json().catch(() => ({ error: "" }));
          throw new Error(msg || "Could not finalize.");
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setBusy(false);
        setProgress(null);
      }
    },
    [orderId, videoIndex, supabase, router]
  );

  if (status === "awaiting_photos") {
    return (
      <p className="font-body text-body-sm text-on-surface-variant">
        Waiting on the customer to submit photos.
      </p>
    );
  }

  if (status === "delivered") {
    return (
      <p className="flex items-center gap-2 font-body text-body-sm text-secondary">
        <Check className="h-4 w-4" aria-hidden="true" />
        Approved by the customer — delivered.
      </p>
    );
  }

  if (status === "photos_received") {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => move("in_editing")}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-on-primary px-4 py-2 font-mono text-ui-mono uppercase tracking-widest hover:opacity-90 transition disabled:opacity-40"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          Start editing
        </button>
        {error && <ErrorLine message={error} />}
      </div>
    );
  }

  if (status === "awaiting_approval") {
    return (
      <div className="space-y-2">
        <p className="font-body text-body-sm text-on-surface-variant">
          Sent to the customer for approval.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => move("in_editing")}
          className="inline-flex items-center gap-2 rounded-lg border border-outline text-on-surface px-4 py-2 font-mono text-ui-mono uppercase tracking-widest hover:border-on-surface-variant transition disabled:opacity-40"
        >
          Pull back to editing
        </button>
        {error && <ErrorLine message={error} />}
      </div>
    );
  }

  // in_editing or revisions_requested — upload the finished video.
  return (
    <div className="space-y-3">
      <label
        htmlFor={`deliverable-${videoIndex}`}
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-outline rounded-lg p-6 cursor-pointer hover:border-primary transition"
      >
        <Upload className="h-6 w-6 text-on-surface-variant" aria-hidden="true" />
        <p className="font-body text-body-md text-on-surface text-center">
          {busy ? (
            (progress ?? "Working…")
          ) : (
            <>
              Upload the finished video —{" "}
              <span className="text-primary underline">choose file</span>
            </>
          )}
        </p>
        <p className="font-mono text-ui-mono uppercase tracking-widest text-outline">
          MP4 / MOV / WebM / M4V · up to 500 MB
        </p>
        <input
          ref={inputRef}
          id={`deliverable-${videoIndex}`}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadDeliverable(file);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </label>
      {error && <ErrorLine message={error} />}
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
