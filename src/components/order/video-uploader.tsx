"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, Check, AlertCircle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import type { Vibe } from "@/lib/vibes";

type LocalFile = {
  id: string; // client-side uuid
  file: File;
  path: string; // storage path after upload
  previewUrl: string;
  status: "uploading" | "ready" | "error";
  error?: string;
};

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
]);
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_PHOTOS = 3;

type Props = {
  orderId: string;
  videoIndex: number;
  token: string;
  vibes: Vibe[];
  initialStatus: "awaiting_photos" | "photos_received" | "in_editing" | "delivered";
};

export function VideoUploader({
  orderId,
  videoIndex,
  token,
  vibes,
  initialStatus,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      ),
    []
  );
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [vibe, setVibe] = useState<string>("");
  const [brief, setBrief] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(initialStatus !== "awaiting_photos");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    async (incoming: File[]) => {
      setError(null);

      // Count synchronously against current state — files.length in the
      // closure is stale when multiple files arrive in one drop.
      let nextCount = files.length;
      for (const file of incoming) {
        if (nextCount >= MAX_PHOTOS) {
          setError(`Max ${MAX_PHOTOS} photos per video.`);
          return;
        }
        nextCount += 1;
        if (!ALLOWED_MIME.has(file.type)) {
          setError("Only JPEG, PNG, HEIC, or WebP.");
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError("Each photo must be 25 MB or smaller.");
          continue;
        }

        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const entry: LocalFile = {
          id,
          file,
          path: "",
          previewUrl: URL.createObjectURL(file),
          status: "uploading",
        };
        setFiles((prev) => [...prev, entry]);

        try {
          // 1. Ask server for a signed upload URL.
          const signRes = await fetch(`/api/orders/${orderId}/upload-url`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              token,
              video_index: videoIndex,
              filename: file.name,
              mime: file.type,
              size: file.size,
            }),
          });
          if (!signRes.ok) {
            const { error: msg } = await signRes.json().catch(() => ({ error: "" }));
            throw new Error(msg || "Could not start upload.");
          }
          const { path, token: uploadToken } = (await signRes.json()) as {
            path: string;
            token: string;
            signedUrl: string;
          };

          // 2. Upload via the Supabase SDK (handles CORS + signed-URL token).
          const { error: putErr } = await supabase.storage
            .from("order-uploads")
            .uploadToSignedUrl(path, uploadToken, file, {
              contentType: file.type,
            });
          if (putErr) {
            throw new Error(putErr.message || "Upload failed.");
          }

          setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, path, status: "ready" } : f))
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Upload failed.";
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id ? { ...f, status: "error", error: msg } : f
            )
          );
        }
      }
    },
    [files.length, orderId, supabase, token, videoIndex]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      const dropped = Array.from(e.dataTransfer.files);
      void addFiles(dropped);
    },
    [addFiles]
  );

  const removeFile = useCallback(
    async (id: string) => {
      const target = files.find((f) => f.id === id);
      if (!target) return;
      URL.revokeObjectURL(target.previewUrl);

      // Only call server if the upload reached storage.
      if (target.status === "ready" && target.path) {
        await fetch(`/api/orders/${orderId}/upload-delete`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token, path: target.path }),
        }).catch(() => {
          /* best-effort */
        });
      }
      setFiles((prev) => prev.filter((f) => f.id !== id));
    },
    [files, orderId, token]
  );

  const submit = useCallback(async () => {
    setError(null);
    const ready = files.filter((f) => f.status === "ready");
    if (ready.length < 1) {
      setError("Upload at least one photo.");
      return;
    }
    if (vibes.length > 0 && !vibe) {
      setError("Pick a vibe.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/orders/${orderId}/videos/${videoIndex}/submit`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            token,
            vibe: vibe || null,
            brief: brief.trim(),
            photos: ready.map((f) => ({
              path: f.path,
              filename: f.file.name,
              size: f.file.size,
              mime: f.file.type,
            })),
          }),
        }
      );
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: "" }));
        throw new Error(msg || "Submit failed.");
      }
      setSubmitted(true);
      // Re-fetch server state so the status badge + section heading reflect
      // the new state instead of showing stale "Awaiting your photos".
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }, [files, vibe, vibes.length, brief, orderId, videoIndex, token, router]);

  if (submitted) {
    return (
      <div className="flex items-center gap-3 text-secondary">
        <Check className="h-5 w-5" aria-hidden="true" />
        <p className="font-body text-body-md">
          Photos submitted. We&rsquo;ll take it from here.
        </p>
      </div>
    );
  }

  const readyCount = files.filter((f) => f.status === "ready").length;
  const canSubmit = readyCount >= 1 && !submitting;

  return (
    <div className="space-y-5">
      {/* Dropzone + thumbnails */}
      <div>
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          htmlFor={`file-input-${videoIndex}`}
          className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-outline rounded-lg p-8 cursor-pointer hover:border-primary transition"
        >
          <Upload className="h-6 w-6 text-on-surface-variant" aria-hidden="true" />
          <p className="font-body text-body-md text-on-surface text-center">
            Drop photos here or{" "}
            <span className="text-primary underline">choose files</span>
          </p>
          <p className="font-mono text-ui-mono uppercase tracking-widest text-outline">
            JPEG / PNG / HEIC / WebP · up to 3 · 25 MB each
          </p>
          <input
            ref={inputRef}
            id={`file-input-${videoIndex}`}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
            multiple
            className="sr-only"
            onChange={(e) => {
              const chosen = Array.from(e.target.files ?? []);
              if (chosen.length) void addFiles(chosen);
              if (inputRef.current) inputRef.current.value = "";
            }}
          />
        </label>

        {files.length > 0 && (
          <ul className="grid grid-cols-3 gap-3 mt-4">
            {files.map((f) => (
              <li
                key={f.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-surface-container-low border border-outline"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.previewUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {f.status === "uploading" && (
                  <div className="absolute inset-0 bg-on-surface/40 flex items-center justify-center">
                    <span className="font-mono text-ui-mono uppercase tracking-widest text-white">
                      Uploading…
                    </span>
                  </div>
                )}
                {f.status === "error" && (
                  <div className="absolute inset-0 bg-error/40 flex items-center justify-center text-white p-2 text-center font-mono text-ui-mono">
                    {f.error ?? "Error"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-on-surface/70 text-white hover:bg-error transition"
                  aria-label={`Remove ${f.file.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Vibe picker */}
      {vibes.length > 0 && (
        <fieldset>
          <legend className="font-mono text-label-caps text-primary uppercase tracking-widest mb-3">
            Pick a vibe
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {vibes.map((v) => (
              <label
                key={v.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  vibe === v.id
                    ? "border-primary bg-primary/5"
                    : "border-outline hover:border-on-surface-variant"
                }`}
              >
                <input
                  type="radio"
                  name={`vibe-${videoIndex}`}
                  value={v.id}
                  checked={vibe === v.id}
                  onChange={(e) => setVibe(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <p className="font-display text-headline-sm text-on-surface">
                    {v.label}
                  </p>
                  <p className="font-body text-body-sm text-on-surface-variant">
                    {v.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Optional brief */}
      <div>
        <label
          htmlFor={`brief-${videoIndex}`}
          className="font-mono text-label-caps text-primary uppercase tracking-widest mb-2 block"
        >
          Anything else? (optional)
        </label>
        <textarea
          id={`brief-${videoIndex}`}
          rows={3}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          maxLength={2000}
          placeholder="Music genre preferences, captions, key message, special asks…"
          className="w-full rounded-lg border border-outline bg-surface-container-low p-3 font-body text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-error font-body text-body-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-on-primary px-6 py-3 font-mono text-ui-mono uppercase tracking-widest hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Check className="h-4 w-4" aria-hidden="true" />
        {submitting ? "Submitting…" : "Done — submit this video"}
      </button>
    </div>
  );
}
