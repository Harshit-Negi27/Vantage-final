"use client";

import { GridIcon, ListIcon, PlusIcon } from "@/components/icons";

interface WelcomeSectionProps {
  itemCount: number;
  itemsView: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  onCreate: () => void;
  creating: boolean;
}

export function WelcomeSection({
  itemCount,
  itemsView,
  onViewChange,
  onCreate,
  creating,
}: WelcomeSectionProps) {
  return (
    <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-stone-400 mb-1">
          Good morning, Pranshu
        </h1>
        <p className="text-stone-400 text-sm">
          You have {itemCount} active research threads.
        </p>
      </div>

      <div className="flex items-center gap-3 animate-fade-in-up [animation-delay:100ms]">
        <div className="bg-stone-900 rounded-lg p-1 border border-stone-800 flex">
          <button
            onClick={() => onViewChange("grid")}
            className={`p-2 rounded-md transition-all ${
              itemsView === "grid"
                ? "bg-stone-800 text-white shadow-sm"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            <GridIcon />
          </button>
          <button
            onClick={() => onViewChange("list")}
            className={`p-2 rounded-md transition-all ${
              itemsView === "list"
                ? "bg-stone-800 text-white shadow-sm"
                : "text-stone-500 hover:text-stone-300"
            }`}
          >
            <ListIcon />
          </button>
        </div>
        <button
          onClick={onCreate}
          disabled={creating}
          className="h-10 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-orange-900/20 hover:shadow-orange-900/40 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <PlusIcon className="w-4 h-4" />
          {creating ? "Creating..." : "New Whiteboard"}
        </button>
      </div>
    </div>
  );
}
