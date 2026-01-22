"use client";

import type { WhiteboardNode, Message, NodeType } from "@/lib/types";
import type { CompanyData, ChartDataPoint } from "@/lib/api";
import { XIcon, SearchIcon, ZapIcon, SendIcon } from "@/components/icons";
import { MiniChart } from "./MiniChart";

interface RightPanelProps {
  node: WhiteboardNode;
  onClose: () => void;
  onTitleChange: (title: string) => void;
  onTitleBlur: () => void;
  onSummaryChange: (summary: string) => void;
  onSummaryBlur: () => void;
  // Company/chart search
  companySearch: string;
  onCompanySearch: (query: string) => void;
  companyResults: CompanyData[];
  onSelectCompany: (company: CompanyData) => void;
  // Chart
  chartData: ChartDataPoint[];
  onTimeframeChange: (timeframe: string) => void;
  // Chat
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendChat: () => void;
  isChatting: boolean;
}

export function RightPanel({
  node,
  onClose,
  onTitleChange,
  onTitleBlur,
  onSummaryChange,
  onSummaryBlur,
  companySearch,
  onCompanySearch,
  companyResults,
  onSelectCompany,
  chartData,
  onTimeframeChange,
  chatInput,
  onChatInputChange,
  onSendChat,
  isChatting,
}: RightPanelProps) {
  const nodeType = (node.type || "research") as NodeType | "chat"; // Support legacy "chat" type
  const chartPrices = chartData.map((d) => d.price);

  return (
    <div className="w-80 border-l border-stone-800 bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-xs font-medium text-stone-400 uppercase">{nodeType}</span>
        </div>
        <button onClick={onClose} className="text-stone-500 hover:text-white">
          <XIcon />
        </button>
      </div>

      {/* Title */}
      <div className="p-3 border-b border-stone-800">
        <input
          className="w-full bg-transparent text-sm font-bold text-white outline-none"
          value={node.title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onTitleBlur}
        />
      </div>

      {/* Company/Chart Config */}
      {(nodeType === "company" || nodeType === "chart") && (
        <div className="p-3 border-b border-stone-800">
          <div className="relative">
            <input
              className="w-full bg-stone-900 border border-stone-800 rounded-lg py-2 pl-8 pr-3 text-xs text-stone-200 outline-none"
              placeholder="Search company (e.g., AAPL)"
              value={companySearch}
              onChange={(e) => onCompanySearch(e.target.value)}
            />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-500">
              <SearchIcon />
            </div>
          </div>
          {companyResults.length > 0 && (
            <div className="mt-2 bg-stone-900 border border-stone-800 rounded-lg max-h-40 overflow-y-auto">
              {companyResults.map((c) => (
                <button
                  key={c.ticker}
                  onClick={() => onSelectCompany(c)}
                  className="w-full text-left px-3 py-2 hover:bg-stone-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{c.ticker}</div>
                    <div className="text-[10px] text-stone-500">{c.name}</div>
                  </div>
                  <div className="text-xs text-stone-400">${c.price.toFixed(2)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chart Preview */}
      {nodeType === "chart" && chartPrices.length > 0 && (
        <div className="p-3 border-b border-stone-800">
          <div className="text-[10px] text-stone-500 uppercase mb-2">Preview</div>
          <MiniChart
            data={chartPrices}
            height={100}
            color={chartPrices[chartPrices.length - 1] >= chartPrices[0] ? "#22c55e" : "#ef4444"}
          />
          <div className="flex gap-1 mt-2">
            {["1D", "1W", "1M", "3M", "1Y"].map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`flex-1 py-1 text-[10px] rounded ${
                  node.data?.chart?.timeframe === tf
                    ? "bg-orange-600 text-white"
                    : "bg-stone-800 text-stone-400"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Company Metrics */}
      {nodeType === "company" && node.data?.company?.metrics && (
        <div className="p-3 border-b border-stone-800">
          <div className="text-[10px] text-stone-500 uppercase mb-2">Key Metrics</div>
          <div className="grid grid-cols-2 gap-2">
            {(node.data.company.metrics as { label: string; value: string }[]).map((m, i) => (
              <div key={i} className="bg-stone-900 rounded p-2">
                <div className="text-[10px] text-stone-500">{m.label}</div>
                <div className="text-sm font-bold text-white">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat for research nodes */}
      {(nodeType === "chat" || !nodeType) && (
        <>
          <textarea
            className="mx-3 mt-3 p-2 bg-stone-900 border border-stone-800 rounded text-xs text-stone-400 outline-none resize-none h-16"
            placeholder="Research context..."
            value={node.summary}
            onChange={(e) => onSummaryChange(e.target.value)}
            onBlur={onSummaryBlur}
          />
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {node.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                <ZapIcon />
                <p className="text-[10px] mt-2">Ask the AI</p>
              </div>
            ) : (
              node.messages.map((m: Message) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-lg px-3 py-2 text-[11px] leading-relaxed ${
                      m.role === "user"
                        ? "bg-stone-800 text-stone-100"
                        : "bg-stone-900 border border-stone-800 text-stone-400"
                    }`}
                  >
                    {m.content || <span className="opacity-50">...</span>}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-stone-800">
            <div className="relative">
              <input
                value={chatInput}
                onChange={(e) => onChatInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSendChat()}
                placeholder="Ask AI..."
                disabled={isChatting}
                className="w-full bg-stone-900 border border-stone-800 rounded-lg py-2 pl-3 pr-9 text-xs text-stone-200 outline-none focus:border-orange-500/50"
              />
              <button
                onClick={onSendChat}
                disabled={!chatInput.trim() || isChatting}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-orange-500 disabled:opacity-30"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
