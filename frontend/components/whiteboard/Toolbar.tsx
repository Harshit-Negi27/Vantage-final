"use client";

import {
  PointerIcon,
  MessageSquareIcon,
  BuildingIcon,
  BarChartIcon,
  TargetIcon,
  TypeIcon,
  ImageIcon,
  FileTextIcon,
  TrashIcon,
  MinusIcon,
  PlusIcon,
  RefreshIcon,
} from "@/components/icons";

type Tool = "select" | "chat" | "text" | "company" | "chart" | "metric" | "image" | "document";

interface ToolbarProps {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  onImageClick: () => void;
  onDocumentClick: () => void;
  selectedId: string | null;
  onDelete: () => void;
  viewport: { scale: number };
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function Toolbar({
  tool,
  onToolChange,
  onImageClick,
  onDocumentClick,
  selectedId,
  onDelete,
  viewport,
  onZoomIn,
  onZoomOut,
  onReset,
}: ToolbarProps) {
  const tools = [
    { id: "select" as Tool, icon: <PointerIcon />, label: "Select" },
    { id: "chat" as Tool, icon: <MessageSquareIcon />, label: "Research" },
    { id: "company" as Tool, icon: <BuildingIcon />, label: "Company" },
    { id: "chart" as Tool, icon: <BarChartIcon />, label: "Chart" },
    { id: "metric" as Tool, icon: <TargetIcon />, label: "Metric" },
    { id: "text" as Tool, icon: <TypeIcon />, label: "Note" },
    { id: "image" as Tool, icon: <ImageIcon />, label: "Image" },
    { id: "document" as Tool, icon: <FileTextIcon />, label: "Doc" },
  ];

  return (
    <>
      {/* Top zoom controls */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <div className="bg-stone-900/95 border border-stone-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
          <span className="text-xs text-stone-400">{Math.round(viewport.scale * 100)}%</span>
          <button
            onClick={onZoomOut}
            className="p-1 hover:bg-stone-800 rounded text-stone-400"
          >
            <MinusIcon />
          </button>
          <button
            onClick={onZoomIn}
            className="p-1 hover:bg-stone-800 rounded text-stone-400"
          >
            <PlusIcon />
          </button>
          <button
            onClick={onReset}
            className="p-1 hover:bg-stone-800 rounded text-stone-400"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-stone-900/95 border border-stone-800 rounded-xl px-2 py-2 flex items-center gap-1 shadow-2xl">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onToolChange(t.id);
                if (t.id === "image") onImageClick();
                if (t.id === "document") onDocumentClick();
              }}
              title={t.label}
              className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all ${
                tool === t.id
                  ? "bg-orange-600 text-white"
                  : "text-stone-400 hover:bg-stone-800 hover:text-white"
              }`}
            >
              {t.icon}
              <span className="text-[9px] mt-1">{t.label}</span>
            </button>
          ))}
          <div className="w-px h-8 bg-stone-700 mx-1" />
          {selectedId && (
            <button
              onClick={onDelete}
              title="Delete"
              className="flex flex-col items-center px-3 py-2 rounded-lg text-red-400 hover:bg-red-900/30"
            >
              <TrashIcon />
              <span className="text-[9px] mt-1">Delete</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
