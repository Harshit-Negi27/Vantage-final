"use client";

import type { CompanyConfig } from "@/lib/types";

type Props = {
    config: CompanyConfig;
    childCount: number;
    onExpand?: () => void;
};

// Mini sparkline SVG
function Sparkline({ trend }: { trend: "up" | "down" }) {
    const points = trend === "up"
        ? "0,20 10,18 20,22 30,15 40,12 50,8 60,10 70,5 80,3"
        : "0,5 10,8 20,4 30,10 40,15 50,12 60,18 70,20 80,22";
    const color = trend === "up" ? "#22c55e" : "#ef4444";

    return (
        <svg width="80" height="24" viewBox="0 0 80 24" className="opacity-60">
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
        </svg>
    );
}

export function CompanyCard({ config, childCount, onExpand }: Props) {
    if (!config.ticker) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <div className="text-center">
                    <svg className="w-8 h-8 text-stone-600 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                        <path d="M9 22v-4h6v4" />
                    </svg>
                    <p className="text-xs text-stone-500">Click to add company</p>
                </div>
            </div>
        );
    }

    const isUp = (config.change || 0) >= 0;
    const changeColor = isUp ? "text-green-500" : "text-red-500";
    const changeBg = isUp ? "bg-green-500/10" : "bg-red-500/10";

    return (
        <div className="h-full flex flex-col p-3">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                        {config.ticker.charAt(0)}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">{config.ticker}</div>
                        <div className="text-[10px] text-stone-500 truncate max-w-[120px]">{config.name}</div>
                    </div>
                </div>
                <Sparkline trend={isUp ? "up" : "down"} />
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-3">
                <span className="text-xl font-bold text-white">${config.price?.toFixed(2)}</span>
                <span className={`text-xs ${changeColor} ${changeBg} px-1.5 py-0.5 rounded flex items-center gap-0.5`}>
                    {isUp ? "▲" : "▼"} {Math.abs(config.changePercent || 0).toFixed(2)}%
                </span>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-stone-900/50 rounded p-1.5">
                    <div className="text-[9px] text-stone-500">Market Cap</div>
                    <div className="text-xs font-medium text-stone-300">{config.marketCap || "—"}</div>
                </div>
                <div className="bg-stone-900/50 rounded p-1.5">
                    <div className="text-[9px] text-stone-500">Sector</div>
                    <div className="text-xs font-medium text-stone-300 truncate">{config.sector || "—"}</div>
                </div>
            </div>

            {/* Child nodes indicator */}
            {childCount > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onExpand?.(); }}
                    className="mt-auto flex items-center gap-1.5 text-[10px] text-stone-500 hover:text-orange-500 transition-colors"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                    </svg>
                    {childCount} connected node{childCount !== 1 ? "s" : ""}
                </button>
            )}
        </div>
    );
}
