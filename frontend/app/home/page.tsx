"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createWhiteboard, deleteWhiteboard, listWhiteboards } from "@/lib/api";
import type { WhiteboardListItem } from "@/lib/types";
import { Header, WelcomeSection, WhiteboardGrid } from "@/components/home";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<WhiteboardListItem[]>([]);
  const [itemsView, setItemsView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    let cancelled = false;
    listWhiteboards()
      .then((data) => {
        if (cancelled) return;
        setItems(data);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load whiteboards");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (w) =>
        (w.title || "").toLowerCase().includes(q) ||
        (w.description || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  async function onCreate() {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const wb = await createWhiteboard({ title: "Untitled Research" });
      router.push(`/whiteboard/${encodeURIComponent(wb.id)}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create whiteboard");
      setCreating(false);
    }
  }

  async function onDelete(id: string) {
    setError(null);
    try {
      await deleteWhiteboard(id);
      setItems((prev) => prev.filter((w) => w.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete whiteboard");
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-50 font-sans selection:bg-orange-500/30 selection:text-orange-200">
      <Header query={query} onQueryChange={setQuery} />

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <WelcomeSection
          itemCount={items.length}
          itemsView={itemsView}
          onViewChange={setItemsView}
          onCreate={onCreate}
          creating={creating}
        />

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {error}
          </div>
        )}

        {/* Filters/Tags */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {["All", "Recent", "Favorites", "Shared", "Archived"].map((tag, i) => (
            <button
              key={tag}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                i === 0
                  ? "bg-white text-stone-950 border-white"
                  : "bg-transparent text-stone-400 border-stone-800 hover:border-stone-600 hover:text-stone-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <WhiteboardGrid
          items={filtered}
          loading={loading}
          itemsView={itemsView}
          onCreate={onCreate}
          onDelete={onDelete}
        />
      </main>
    </div>
  );
}
