"use client";

import Link from "next/link";
import type { WhiteboardListItem } from "@/lib/types";
import { formatRelativeTime } from "@/lib/time";
import { PlusIcon } from "@/components/icons";

interface WhiteboardGridProps {
  items: WhiteboardListItem[];
  loading: boolean;
  itemsView: "grid" | "list";
  onCreate: () => void;
  onDelete?: (id: string) => void;
}

export function WhiteboardGrid({ items, loading, itemsView, onCreate, onDelete }: WhiteboardGridProps) {
  return (
    <div
      className={`grid gap-6 ${
        itemsView === "grid"
          ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "grid-cols-1"
      }`}
    >
      {/* Create Card (only in grid view) */}
      {itemsView === "grid" && (
        <button
          onClick={onCreate}
          className="group relative rounded-2xl border border-stone-800 bg-stone-900/20 h-52 flex flex-col items-center justify-center hover:bg-stone-900/40 hover:border-orange-500/30 transition-all cursor-pointer overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="h-12 w-12 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-400 group-hover:scale-110 group-hover:border-orange-500/50 group-hover:text-orange-500 transition-all z-10">
            <PlusIcon className="w-5 h-5" />
          </div>
          <span className="mt-4 text-sm font-medium text-stone-300 group-hover:text-white transition-colors z-10">
            Create New Board
          </span>
        </button>
      )}

      {loading ? (
        <LoadingSkeletons />
      ) : (
        items.map((w) => (
          <WhiteboardCard key={w.id} item={w} itemsView={itemsView} onDelete={onDelete} />
        ))
      )}
    </div>
  );
}

function LoadingSkeletons() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={`sk_${idx}`}
          className="rounded-2xl border border-stone-800 bg-stone-900/20 h-52 p-6 animate-pulse"
        >
          <div className="h-4 w-1/3 bg-stone-800 rounded mb-4" />
          <div className="h-3 w-2/3 bg-stone-800/50 rounded" />
        </div>
      ))}
    </>
  );
}

interface WhiteboardCardProps {
  item: WhiteboardListItem;
  itemsView: "grid" | "list";
  onDelete?: (id: string) => void;
}

function WhiteboardCard({ item: w, itemsView, onDelete }: WhiteboardCardProps) {
  const colorClass = [
    "bg-blue-500/10 text-blue-500",
    "bg-orange-500/10 text-orange-500",
    "bg-purple-500/10 text-purple-500",
    "bg-green-500/10 text-green-500",
  ][w.title.length % 4];

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && confirm(`Delete "${w.title}"? This cannot be undone.`)) {
      onDelete(w.id);
    }
  };

  if (itemsView === "list") {
    return (
      <div className="group rounded-2xl border border-stone-800 bg-stone-900/40 p-5 hover:border-stone-600 hover:bg-stone-900/60 hover:shadow-xl transition-all relative overflow-hidden flex flex-row items-center gap-6 h-auto min-h-[80px]">
        <Link
          href={`/whiteboard/${encodeURIComponent(w.id)}`}
          className="flex flex-row items-center gap-6 flex-1 min-w-0"
        >
          <div
            className={`w-12 h-12 shrink-0 rounded-lg flex items-center justify-center text-lg font-bold ${colorClass}`}
          >
            {w.title.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-stone-100 group-hover:text-orange-400 transition-colors truncate">
              {w.title || "Untitled Whiteboard"}
            </h3>
            <p className="text-xs text-stone-500 truncate">
              {w.description || "No description added yet."}
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs text-stone-500">
            <span className="hidden sm:inline-block">{w.nodeCount} nodes</span>
            <span className="hidden sm:inline-block">{w.edgeCount} links</span>
            <span>{formatRelativeTime(w.updatedAt)}</span>
          </div>
        </Link>
        <button
          onClick={handleDelete}
          className="p-2 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
          title="Delete whiteboard"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="group rounded-2xl border border-stone-800 bg-stone-900/40 hover:border-stone-600 hover:bg-stone-900/60 hover:shadow-xl transition-all relative overflow-hidden flex flex-col h-52">
      <Link
        href={`/whiteboard/${encodeURIComponent(w.id)}`}
        className="p-5 flex flex-col flex-1 justify-between"
      >
        <div className="space-y-3 relative z-10">
          <div className="flex items-start justify-between">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${colorClass}`}
            >
              {w.title.charAt(0).toUpperCase()}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-stone-100 leading-tight group-hover:text-orange-400 transition-colors truncate">
              {w.title || "Untitled Whiteboard"}
            </h3>
            <p className="text-xs text-stone-500 mt-1 line-clamp-2">
              {w.description || "No description added yet."}
            </p>
          </div>
        </div>

        <div className="relative z-10 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-stone-600" /> {w.nodeCount} nodes
            </span>
          </div>
          <span>{formatRelativeTime(w.updatedAt)}</span>
        </div>

        {/* Hover decoration */}
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-stone-800/30 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors" />
      </Link>
      
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-4 right-4 p-2 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 z-20"
        title="Delete whiteboard"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
