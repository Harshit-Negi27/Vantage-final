"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createWhiteboard } from "@/lib/api";

export default function NewWhiteboardPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    createWhiteboard()
      .then((wb) => {
        if (cancelled) return;
        router.replace(`/whiteboard/${encodeURIComponent(wb.id)}`);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to create whiteboard");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="text-lg font-medium">Creating whiteboard...</div>
        {error ? <div className="mt-2 text-sm text-red-200/90">{error}</div> : <div className="mt-2 text-sm text-white/55">Please wait.</div>}
      </div>
    </div>
  );
}

