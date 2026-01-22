"use client";

import type { MetricConfig } from "@/lib/types";

// Trend icons moved outside component
function TrendUpIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    );
}

function TrendDownIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
            <polyline points="17 18 23 18 23 12" />
        </svg>
    );
}

function TrendNeutralIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

type Props = {
    config: MetricConfig;
};

export function MetricDisplay({ config }: Props) {
    const trendColor = config.trend === "up" ? "text-green-500" : config.trend === "down" ? "text-red-500" : "text-stone-500";
    const bgColor = config.trend === "up" ? "bg-green-500/10" : config.trend === "down" ? "bg-red-500/10" : "bg-stone-800";

    return (
        <div className="h-full flex flex-col justify-center p-4">
            {/* Label */}
            <div className="flex items-center gap-2 mb-1">
                {config.ticker && (
                    <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">
                        {config.ticker}
                    </span>
                )}
                <span className="text-[10px] text-stone-500 uppercase tracking-wide">{config.label || "Metric"}</span>
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{config.value || "—"}</span>
                {config.unit && <span className="text-sm text-stone-500">{config.unit}</span>}
            </div>

            {/* Change */}
            {config.changePercent !== undefined && (
                <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
                    <div className={`p-1 rounded ${bgColor}`}>
                        {config.trend === "up" && <TrendUpIcon />}
                        {config.trend === "down" && <TrendDownIcon />}
                        {config.trend === "neutral" && <TrendNeutralIcon />}
                    </div>
                    <span className="text-xs font-medium">
                        {config.changePercent >= 0 ? "+" : ""}{config.changePercent.toFixed(2)}%
                    </span>
                    {config.previousValue && (
                        <span className="text-[10px] text-stone-600 ml-1">from {config.previousValue}</span>
                    )}
                </div>
            )}

            {/* Alert indicator */}
            {config.alertEnabled && (
                <div className="mt-3 flex items-center gap-1 text-[10px] text-amber-500">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    Alert: {config.alertCondition} {config.alertThreshold}
                </div>
            )}
        </div>
    );
}
