"use client";

import { useState } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { ChartConfig } from "@/lib/types";
import type { ChartDataPoint } from "@/lib/api";

type Props = {
    config: ChartConfig;
    data: ChartDataPoint[];
    onTimeframeChange: (tf: ChartConfig["timeframe"]) => void;
    onToggleExpand?: () => void;
    isExpanded?: boolean;
};

const TIMEFRAMES: ChartConfig["timeframe"][] = ["1D", "1W", "1M", "3M", "6M", "1Y"];

// Icons
const ChartIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);

const EyeIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

// Formatter for recharts tooltip
const formatPrice = (value: number | string | (number | string)[] | undefined) => {
    if (value === undefined) return ['—', 'Price'];
    const num = typeof value === 'number' ? value : Array.isArray(value) ? Number(value[0]) : Number(value);
    return [`$${num?.toFixed(2) ?? '—'}`, "Price"];
};

export function InteractiveChart({ config, data, onTimeframeChange, onToggleExpand, isExpanded = false }: Props) {
    // Use internal state if no external control provided
    const [internalExpanded, setInternalExpanded] = useState(false);
    const expanded = onToggleExpand ? isExpanded : internalExpanded;
    
    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (onToggleExpand) {
            onToggleExpand();
        } else {
            setInternalExpanded(!internalExpanded);
        }
    };

    // Prevent pointer events from bubbling to node container (which triggers drag)
    const handlePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
    };

    const isUp = data.length > 1 ? data[data.length - 1].price >= data[0].price : true;
    const color = isUp ? "#22c55e" : "#ef4444";

    const chartData = data.map((d) => ({
        date: new Date(d.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        price: d.price,
        volume: d.volume,
    }));

    const renderChart = () => {
        const commonProps = {
            data: chartData,
            margin: { top: 5, right: 5, bottom: 5, left: 5 },
        };

        switch (config.chartType) {
            case "area":
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            <linearGradient id={`colorPrice-${config.ticker}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#78716c" }} />
                        <YAxis hide domain={["auto", "auto"]} />
                        <Tooltip
                            contentStyle={{ background: "#1c1917", border: "1px solid #44403c", borderRadius: 8, fontSize: 11 }}
                            labelStyle={{ color: "#a8a29e" }}
                            formatter={formatPrice}
                        />
                        <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill={`url(#colorPrice-${config.ticker})`} />
                    </AreaChart>
                );
            case "bar":
                return (
                    <BarChart {...commonProps}>
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#78716c" }} />
                        <YAxis hide domain={["auto", "auto"]} />
                        <Tooltip
                            contentStyle={{ background: "#1c1917", border: "1px solid #44403c", borderRadius: 8, fontSize: 11 }}
                            formatter={formatPrice}
                        />
                        <Bar dataKey="price" fill={color} radius={[2, 2, 0, 0]} />
                    </BarChart>
                );
            default: // line
                return (
                    <LineChart {...commonProps}>
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#78716c" }} />
                        <YAxis hide domain={["auto", "auto"]} />
                        <Tooltip
                            contentStyle={{ background: "#1c1917", border: "1px solid #44403c", borderRadius: 8, fontSize: 11 }}
                            labelStyle={{ color: "#a8a29e" }}
                            formatter={formatPrice}
                        />
                        <Line type="monotone" dataKey="price" stroke={color} strokeWidth={2} dot={false} />
                    </LineChart>
                );
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-3 pt-3 pb-2 bg-stone-900/50">
                <div className="flex items-center gap-2">
                    <ChartIcon />
                    <span className="text-xs font-medium text-stone-300">{config.ticker || "Select Ticker"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isUp ? "text-green-500" : "text-red-500"}`}>
                        {data.length > 0 ? `$${data[data.length - 1].price.toFixed(2)}` : "—"}
                    </span>
                    {/* Toggle Chart Visibility */}
                    <button
                        onClick={handleToggle}
                        onPointerDown={handlePointerDown}
                        className={`p-1.5 rounded transition-colors ${expanded ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-stone-800 text-stone-500 hover:text-stone-300 hover:bg-stone-700"}`}
                        title={expanded ? "Hide chart" : "Show chart"}
                    >
                        {expanded ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                </div>
            </div>

            {/* Chart - only render when expanded */}
            {expanded && (
                <>
                    <div className="flex-1 min-h-0 px-2">
                        {data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                {renderChart()}
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-stone-600 text-[10px]">
                                Loading chart data...
                            </div>
                        )}
                    </div>

                    {/* Timeframe selector */}
                    <div className="flex gap-0.5 px-2 pb-2 mt-1">
                        {TIMEFRAMES.map((tf) => (
                            <button
                                key={tf}
                                onClick={(e) => { e.stopPropagation(); onTimeframeChange(tf); }}
                                onPointerDown={handlePointerDown}
                                className={`flex-1 py-1 text-[9px] rounded transition-colors ${config.timeframe === tf ? "bg-stone-700 text-white" : "text-stone-500 hover:text-stone-300 hover:bg-stone-800"
                                    }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Collapsed state - show minimal info */}
            {!expanded && (
                <div className="flex-1 flex items-center justify-center text-stone-600 text-[10px] px-3">
                    <div className="text-center">
                        <div className="text-stone-500">Click eye icon to show chart</div>
                        {config.ticker && <div className="text-stone-400 mt-1">{config.timeframe} • {config.chartType}</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
