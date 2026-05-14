"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertCircle } from "lucide-react";
import type { OrderVideoStatus } from "@/lib/orders";

const NEXT_LABEL: Partial<Record<OrderVideoStatus, { to: OrderVideoStatus; label: string }>> = {
  photos_received: { to: "in_editing", label: "Start editing" },
  in_editing: { to: "delivered", label: "Mark delivered" },
};

const BACK_LABEL: Partial<Record<OrderVideoStatus, { to: OrderVideoStatus; label: string }>> = {
  in_editing: { to: "photos_received", label: "Back to photos received" },
  delivered: { to: "in_editing", label: "Reopen editing" },
};

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

export function VideoStatusActions({
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

  const forward = NEXT_LABEL[status];
  const back = BACK_LABEL[status];

  if (status === "awaiting_photos") {
    return (
      <p className="font-body text-body-sm text-on-surface-variant">
        Waiting on the customer to submit photos.
      </p>
    );
  }

  async function move(to: OrderVideoStatus) {
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
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {forward && (
          <button
            type="button"
            disabled={busy}
            onClick={() => move(forward.to)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-on-primary px-4 py-2 font-mono text-ui-mono uppercase tracking-widest hover:opacity-90 transition disabled:opacity-40"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            {forward.label}
          </button>
        )}
        {back && (
          <button
            type="button"
            disabled={busy}
            onClick={() => move(back.to)}
            className="inline-flex items-center gap-2 rounded-lg border border-outline text-on-surface px-4 py-2 font-mono text-ui-mono uppercase tracking-widest hover:border-on-surface-variant transition disabled:opacity-40"
          >
            {back.label}
          </button>
        )}
      </div>
      {error && (
        <div className="flex items-start gap-2 text-error font-body text-body-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export function DeliverForm({
  orderId,
  initialUrl,
}: {
  orderId: string;
  initialUrl: string | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(value: string | null) {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/deliver`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: "" }));
        throw new Error(msg || "Save failed.");
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save(url.trim() || null);
      }}
      className="space-y-3"
    >
      <input
        type="url"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setSaved(false);
        }}
        placeholder="https://… link to the finished video"
        className="w-full rounded-lg border border-outline bg-surface-container-low p-3 font-body text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-on-primary px-5 py-2.5 font-mono text-ui-mono uppercase tracking-widest hover:opacity-90 transition disabled:opacity-40"
        >
          {busy ? "Saving…" : "Save delivery link"}
        </button>
        {initialUrl && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setUrl("");
              void save(null);
            }}
            className="font-mono text-ui-mono uppercase tracking-widest text-outline hover:text-error transition"
          >
            Clear
          </button>
        )}
        {saved && (
          <span className="font-body text-body-sm text-secondary">Saved.</span>
        )}
      </div>
      {error && (
        <div className="flex items-start gap-2 text-error font-body text-body-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </form>
  );
}
