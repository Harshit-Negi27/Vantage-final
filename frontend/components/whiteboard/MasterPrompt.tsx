"use client";

import { useState, useRef, useEffect } from "react";
import type { AIProvider, AIModelsResponse, AIAction } from "@/lib/types";

interface MasterPromptProps {
  boardId: string;
  aiModels: AIModelsResponse | null;
  selectedProvider: AIProvider;
  selectedModel: string;
  onProviderChange: (provider: AIProvider) => void;
  onModelChange: (model: string) => void;
  onAction: (action: AIAction) => void;
  onRefresh: () => void;
}

// Icons
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const SparklesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const LoaderIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export function MasterPrompt({
  boardId,
  aiModels,
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  onAction,
  onRefresh,
}: MasterPromptProps) {
  const [input, setInput] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [actionsCreated, setActionsCreated] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowModelMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get current model display name
  const getCurrentModelName = () => {
    const models = aiModels?.models?.[selectedProvider] || [];
    const model = models.find((m) => m.id === selectedModel);
    return model?.name || selectedModel.split("/").pop() || "Select Model";
  };

  const handleSubmit = async () => {
    if (!input.trim() || isWorking) return;

    const query = input.trim();
    setInput("");
    setIsWorking(true);
    setStatus("Thinking...");
    setActionsCreated([]);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050"}/whiteboards/${boardId}/nodes/master/chat`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            message: query,
            provider: selectedProvider,
            model: selectedModel,
          }),
        }
      );

      if (!res.ok) throw new Error("Request failed");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process STATUS markers
        const statusRegex = /<<<STATUS:(.*?):STATUS>>>/g;
        let statusMatch;
        while ((statusMatch = statusRegex.exec(buffer)) !== null) {
          const statusText = statusMatch[1];
          if (statusText) {
            setStatus(statusText);
          }
          buffer = buffer.replace(statusMatch[0], "");
        }

        // Process ACTION markers
        const actionRegex = /<<<ACTION:([\s\S]*?):ACTION>>>/g;
        let actionMatch;
        while ((actionMatch = actionRegex.exec(buffer)) !== null) {
          try {
            const action = JSON.parse(actionMatch[1]) as AIAction;
            console.log("[MASTER] Action received:", action.type);
            
            // Track what's being created
            const actionName = action.data?.title || action.type.replace("create_", "").replace("_", " ");
            setActionsCreated((prev) => [...prev, actionName]);
            setStatus(`Creating: ${actionName}`);
            
            onAction(action);
          } catch (e) {
            console.error("[MASTER] Failed to parse action:", e);
          }
          buffer = buffer.replace(actionMatch[0], "");
        }
      }

      // Done
      setStatus(actionsCreated.length > 0 ? `Done! Created ${actionsCreated.length} items` : "Done!");
      onRefresh();
      
      // Clear status after delay
      setTimeout(() => {
        setStatus(null);
        setActionsCreated([]);
      }, 3000);

    } catch (err) {
      console.error("[MASTER] Error:", err);
      setStatus("Error - please try again");
      setTimeout(() => setStatus(null), 3000);
    } finally {
      setIsWorking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const providerModels = aiModels?.models?.[selectedProvider] || [];

  return (
    <div className="absolute bottom-[140px] left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4">
      {/* Status bubble */}
      {status && (
        <div className="flex justify-center mb-2">
          <div className="bg-stone-900/95 border border-stone-700 rounded-full px-4 py-1.5 flex items-center gap-2 text-xs text-stone-300 shadow-lg backdrop-blur-sm">
            {isWorking ? <LoaderIcon /> : <CheckIcon />}
            <span>{status}</span>
            {actionsCreated.length > 0 && (
              <span className="text-orange-400">({actionsCreated.length})</span>
            )}
          </div>
        </div>
      )}

      {/* Main prompt bubble */}
      <div className="bg-stone-900/95 border border-stone-700 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
        <div className="flex items-center gap-2 p-2">
          {/* AI Icon */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shrink-0">
            <SparklesIcon />
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to create charts, research, analyze stocks..."
            disabled={isWorking}
            className="flex-1 bg-transparent text-sm text-stone-100 placeholder-stone-500 outline-none px-2 py-1 min-w-0"
          />

          {/* Model selector */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              disabled={isWorking}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors whitespace-nowrap"
            >
              <span className="max-w-[80px] truncate">{getCurrentModelName()}</span>
              <ChevronDownIcon />
            </button>

            {showModelMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-64 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl overflow-hidden">
                <div className="p-2 border-b border-stone-800">
                  <div className="flex gap-1">
                    {(["groq", "openai"] as AIProvider[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => onProviderChange(p)}
                        className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                          selectedProvider === p
                            ? "bg-orange-500/20 text-orange-400"
                            : "text-stone-400 hover:bg-stone-800"
                        }`}
                      >
                        {p.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto p-1">
                  {providerModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onModelChange(model.id);
                        setShowModelMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedModel === model.id
                          ? "bg-stone-800 text-white"
                          : "text-stone-300 hover:bg-stone-800/50"
                      }`}
                    >
                      <div className="text-xs font-medium">{model.name}</div>
                      <div className="text-[10px] text-stone-500 truncate">{model.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isWorking}
            className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-400 disabled:bg-stone-700 disabled:text-stone-500 flex items-center justify-center text-white transition-colors shrink-0"
          >
            {isWorking ? <LoaderIcon /> : <SendIcon />}
          </button>
        </div>
      </div>

      {/* Quick suggestions - only show when not busy and no input */}
      {!isWorking && !input && (
        <div className="flex justify-center gap-2 mt-2 flex-wrap">
          {[
            "Research NVIDIA",
            "Compare FAANG",
            "AAPL chart",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(suggestion)}
              className="px-2 py-0.5 rounded-full text-[9px] text-stone-500 bg-stone-900/50 border border-stone-800 hover:border-stone-600 hover:text-stone-300 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
