"use client";

import { useRouter } from "next/navigation";
import type { Whiteboard } from "@/lib/types";
import {
  HomeIcon,
  LayersIcon,
  MessageSquareIcon,
  TypeIcon,
  BuildingIcon,
  BarChartIcon,
  TargetIcon,
  ImageIcon,
  FileTextIcon,
} from "@/components/icons";

interface LeftPanelProps {
  board: Whiteboard;
  selectedId: string | null;
  onSelectNode: (nodeId: string, nodeType: string) => void;
}

export function LeftPanel({ board, selectedId, onSelectNode }: LeftPanelProps) {
  const router = useRouter();

  const getNodeIcon = (nodeType: string) => {
    const icons: Record<string, React.ReactNode> = {
      chat: <MessageSquareIcon />,
      text: <TypeIcon />,
      company: <BuildingIcon />,
      chart: <BarChartIcon />,
      metric: <TargetIcon />,
      image: <ImageIcon />,
      document: <FileTextIcon />,
    };
    return icons[nodeType] || <MessageSquareIcon />;
  };

  return (
    <div className="w-56 border-r border-stone-800 flex flex-col bg-[#0a0a0a]">
      <div className="p-3 border-b border-stone-800">
        <button
          onClick={() => router.push("/home")}
          className="flex items-center gap-2 text-stone-400 hover:text-white text-xs mb-3"
        >
          <HomeIcon className="w-4 h-4" /> Back to Home
        </button>
        <h1 className="text-sm font-bold text-white truncate">{board.title}</h1>
        <p className="text-[10px] text-stone-500 mt-1">
          {board.description || "Finance Research Workspace"}
        </p>
      </div>

      {/* Board Stats */}
      <div className="p-3 border-b border-stone-800 grid grid-cols-2 gap-2">
        <div className="bg-stone-900/50 rounded p-2">
          <div className="text-[10px] text-stone-500">Nodes</div>
          <div className="text-lg font-bold text-white">{board.nodes.length}</div>
        </div>
        <div className="bg-stone-900/50 rounded p-2">
          <div className="text-[10px] text-stone-500">Connections</div>
          <div className="text-lg font-bold text-white">{board.edges.length}</div>
        </div>
      </div>

      {/* Layers */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="text-[10px] text-stone-500 uppercase font-bold px-2 mb-2 flex items-center gap-1">
            <LayersIcon /> Layers
          </div>
          {board.nodes.map((node) => {
            const nodeType = node.type || "chat";
            return (
              <button
                key={node.id}
                onClick={() => onSelectNode(node.id, nodeType)}
                className={`w-full text-left px-2 py-1.5 text-xs flex items-center gap-2 rounded transition-colors ${
                  selectedId === node.id
                    ? "bg-stone-800 text-white"
                    : "text-stone-400 hover:bg-stone-900"
                }`}
              >
                {getNodeIcon(nodeType)}
                <span className="truncate flex-1">{node.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
