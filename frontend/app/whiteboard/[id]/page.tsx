"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  createEdge,
  createNode,
  deleteNode,
  getWhiteboard,
  sendNodeChat,
  sendMasterAICommand,
  updateNode,
  uploadImage,
  uploadDocument,
  searchCompanies,
  getChartData,
  getAIModels,
  generateMap,
  type CompanyData,
  type ChartDataPoint,
  type ChatCallbacks,
} from "@/lib/api";
import type { Message, Whiteboard, WhiteboardNode, NodeType, NodeData, ChartConfig, CompanyConfig, MetricConfig, AIAction, AIProvider, AIModelsResponse } from "@/lib/types";
import { InteractiveChart } from "@/components/whiteboard/InteractiveChart";
import { MetricDisplay } from "@/components/whiteboard/MetricDisplay";
import { CompanyCard } from "@/components/whiteboard/CompanyCard";
import { MarkdownText } from "@/components/MarkdownText";
import { MasterPrompt } from "@/components/whiteboard/MasterPrompt";

// ============================================================================
// CONSTANTS
// ============================================================================
type Viewport = { x: number; y: number; scale: number };
type Tool = "select" | "research" | "company" | "chart" | "metric" | "text" | "image" | "document";

const NODE_SIZES: Record<string, { w: number; h: number }> = {
  research: { w: 260, h: 120 },
  company: { w: 280, h: 200 },
  chart: { w: 320, h: 220 },
  metric: { w: 180, h: 120 },
  text: { w: 400, h: 300 },
  image: { w: 300, h: 200 },
  document: { w: 240, h: 80 },
  // Legacy support
  chat: { w: 260, h: 120 },
};

const STORAGE_KEYS = {
  PANEL_WIDTH: "vantage_panel_width",
  SELECTED_MODEL: "vantage_selected_model",
  SELECTED_PROVIDER: "vantage_selected_provider",
};

const DEFAULT_PANEL_WIDTH = 420;
const MIN_PANEL_WIDTH = 320;
const MAX_PANEL_WIDTH = 600;

function clamp(n: number, min: number, max: number) { return Math.min(max, Math.max(min, n)); }
function mkId(prefix: string) { return `${prefix}_${Math.random().toString(36).slice(2, 11)}`; }

// ============================================================================
// ICONS
// ============================================================================
const I = {
  Home: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /><path d="M12 5v14" /></svg>,
  Minus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /></svg>,
  MessageSquare: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  Type: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>,
  Image: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
  FileText: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
  Pointer: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>,
  Send: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
  Refresh: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>,
  Zap: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  BarChart: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  Building: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /></svg>,
  Target: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  Layers: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>,
  Search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>,
  ChevronDown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>,
  ChevronUp: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6" /></svg>,
  Cpu: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 1v3" /><path d="M15 1v3" /><path d="M9 20v3" /><path d="M15 20v3" /><path d="M20 9h3" /><path d="M20 14h3" /><path d="M1 9h3" /><path d="M1 14h3" /></svg>,
  Sparkles: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" /></svg>,
  // New AI icons
  Brain: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>,
  FileDocument: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
  Network: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><line x1="12" y1="8" x2="5" y2="16"/><line x1="12" y1="8" x2="19" y2="16"/></svg>,
  Download: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Users: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  DollarSign: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
};

// ============================================================================
// MAIN
// ============================================================================
export default function WhiteboardPage() {
  const params = useParams<{ id: string }>();
  const boardId = String(params.id || "");
  if (!boardId) return null;
  return <WhiteboardCanvas boardId={boardId} />;
}

function WhiteboardCanvas({ boardId }: { boardId: string }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const boardRef = useRef<Whiteboard | null>(null); // Keep a ref to avoid stale closures

  // State
  const [board, setBoard] = useState<Whiteboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // Interactions
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState<{ nodeId: string; startX: number; startY: number; ox: number; oy: number } | null>(null);
  const [isConnecting, setIsConnecting] = useState<{ nodeId: string } | null>(null);
  const [dragLine, setDragLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [quickMenu, setQuickMenu] = useState<{ x: number; y: number; sourceId?: string } | null>(null);
  const [isResizingNode, setIsResizingNode] = useState<{ nodeId: string; startX: number; startY: number; startW: number; startH: number } | null>(null);
  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  // Right Panel
  const [panelNode, setPanelNode] = useState<WhiteboardNode | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(DEFAULT_PANEL_WIDTH);

  // Finance data
  const [companySearch, setCompanySearch] = useState("");
  const [companyResults, setCompanyResults] = useState<CompanyData[]>([]);
  const [chartDataMap, setChartDataMap] = useState<Record<string, ChartDataPoint[]>>({});

  // AI Model Selection
  const [aiModels, setAiModels] = useState<AIModelsResponse | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>("groq");
  const [selectedModel, setSelectedModel] = useState<string>("moonshotai/kimi-k2-instruct-0905"); // Kimi K2 - best for tool calling
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [researchMode, setResearchMode] = useState(false); // New Research Mode state

  // AI Menu State
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratingType, setAiGeneratingType] = useState<"memo" | "investor-graph" | null>(null);
  const [generatedMemo, setGeneratedMemo] = useState<string | null>(null);
  const [showMemoModal, setShowMemoModal] = useState(false);

  // Keep boardRef in sync
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWidth = localStorage.getItem(STORAGE_KEYS.PANEL_WIDTH);
      const savedModel = localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);
      const savedProvider = localStorage.getItem(STORAGE_KEYS.SELECTED_PROVIDER);

      if (savedWidth) setPanelWidth(clamp(parseInt(savedWidth, 10), MIN_PANEL_WIDTH, MAX_PANEL_WIDTH));
      if (savedModel) setSelectedModel(savedModel);
      if (savedProvider && (savedProvider === "groq" || savedProvider === "openai")) {
        setSelectedProvider(savedProvider as AIProvider);
      }
    }
  }, []);

  // Save panel width preference
  useEffect(() => {
    if (typeof window !== "undefined" && !isResizing) {
      localStorage.setItem(STORAGE_KEYS.PANEL_WIDTH, String(panelWidth));
    }
  }, [panelWidth, isResizing]);

  // Save model preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, selectedModel);
      localStorage.setItem(STORAGE_KEYS.SELECTED_PROVIDER, selectedProvider);
    }
  }, [selectedModel, selectedProvider]);

  // Refresh board helper - fetches latest and updates state
  const refreshBoard = useCallback(async () => {
    try {
      const updated = await getWhiteboard(boardId);

      // Smart Merge: Preserve local chat messages if they are newer (streaming)
      setBoard((prev) => {
        if (!prev) {
          boardRef.current = updated;
          return updated;
        }

        const mergedNodes = updated.nodes.map(newNode => {
          const oldNode = prev.nodes.find(n => n.id === newNode.id);
          // If local has more messages, it means we have streaming content not yet saved/returned from backend
          if (oldNode && oldNode.messages.length > newNode.messages.length) {
            return { ...newNode, messages: oldNode.messages };
          }
          return newNode;
        });

        const mergedBoard = { ...updated, nodes: mergedNodes };
        boardRef.current = mergedBoard;
        return mergedBoard;
      });

      // Also update panelNode to ensure it reflects data changes (like title) but keeps chat
      setPanelNode(prev => {
        if (!prev) return null;
        const freshNode = updated.nodes.find(n => n.id === prev.id);
        if (!freshNode) return null; // Node deleted

        // Preserve local messages if newer
        if (prev.messages.length > freshNode.messages.length) {
          return { ...freshNode, messages: prev.messages };
        }
        return freshNode;
      });

      return updated;
    } catch (err) {
      console.error("Failed to refresh board:", err);
      return null;
    }
  }, [boardId]);

  // Load Board
  useEffect(() => {
    let active = true;
    setLoading(true);
    getWhiteboard(boardId).then((b) => {
      if (active) {
        setBoard(b);
        boardRef.current = b;
        if (containerRef.current) {
          const { width, height } = containerRef.current.getBoundingClientRect();
          setViewport({ x: width / 2 - 400, y: height / 2 - 300, scale: 1 });
        }
      }
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [boardId]);

  // Load AI Models
  useEffect(() => {
    getAIModels().then((models) => {
      setAiModels(models);
      if (models.default_provider) setSelectedProvider(models.default_provider);
      if (models.default_model) setSelectedModel(models.default_model);
    }).catch(console.error);
  }, []);

  // Load chart data for all chart nodes
  useEffect(() => {
    if (!board) return;
    
    const chartNodes = board.nodes.filter(n => 
      n.type === "chart" && n.data?.chart?.ticker
    );
    
    // Load data for each chart node that doesn't have data yet
    chartNodes.forEach(async (node) => {
      const ticker = node.data?.chart?.ticker as string;
      if (!ticker) return;
      
      const timeframe = (node.data?.chart?.timeframe || "1M") as string;
      const cacheKey = `${node.id}_${ticker}_${timeframe}`;
      
      // Skip if we already have data for this exact config
      if (chartDataMap[cacheKey]) return;
      
      try {
        const data = await getChartData(ticker, timeframe);
        setChartDataMap(prev => ({ ...prev, [cacheKey]: data }));
      } catch (err) {
        console.error(`Failed to load chart data for ${ticker}:`, err);
        setChartDataMap(prev => ({ ...prev, [cacheKey]: [] }));
      }
    });
  }, [board?.nodes, chartDataMap]);

  // Prevent default browser zoom/scroll on the canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const preventDefaultWheel = (e: WheelEvent) => {
      // Prevent browser zoom on pinch
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    
    // Must use passive: false to be able to preventDefault
    container.addEventListener('wheel', preventDefaultWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', preventDefaultWheel);
    };
  }, []);

  // Clean up stale selection/panel state if the node no longer exists
  useEffect(() => {
    if (!board) return;
    
    // Clear selectedId if the node was deleted
    if (selectedId && !board.nodes.some(n => n.id === selectedId)) {
      setSelectedId(null);
    }
    
    // Clear panelNode if it was deleted
    if (panelNode && !board.nodes.some(n => n.id === panelNode.id)) {
      setPanelNode(null);
    }
    
    // Clear editingNodeId if it was deleted
    if (editingNodeId && !board.nodes.some(n => n.id === editingNodeId)) {
      setEditingNodeId(null);
    }
  }, [board, selectedId, panelNode, editingNodeId]);

  // Helpers
  const getWorldPos = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left - viewport.x) / viewport.scale, y: (clientY - rect.top - viewport.y) / viewport.scale };
  }, [viewport]);

  const getNodeDimensions = (node: WhiteboardNode) => {
    const nodeType = node.type || "research";
    const base = NODE_SIZES[nodeType] || NODE_SIZES.research;
    return { w: node.width || base.w, h: node.height || base.h };
  };

  // Get child node count for a company node
  const getChildCount = (nodeId: string) => {
    if (!board) return 0;
    return board.edges.filter(e => e.source === nodeId).length;
  };

  // Wheel - handles both panning (two-finger scroll) and zooming (pinch or ctrl+scroll)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    // Pinch-to-zoom on trackpad sends ctrlKey=true with deltaY
    // Also handle explicit Ctrl/Cmd + scroll for zoom
    const isPinchZoom = e.ctrlKey || e.metaKey;
    
    if (isPinchZoom) {
      // Zoom towards cursor position
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // Get cursor position relative to container
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      
      // Calculate zoom
      const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
      const newScale = clamp(viewport.scale * zoomFactor, 0.1, 4);
      const scaleChange = newScale / viewport.scale;
      
      // Adjust viewport to zoom towards cursor
      // The cursor point should stay in the same world position
      const newX = cursorX - (cursorX - viewport.x) * scaleChange;
      const newY = cursorY - (cursorY - viewport.y) * scaleChange;
      
      setViewport({ x: newX, y: newY, scale: newScale });
    } else {
      // Pan - two finger scroll on trackpad or regular scroll
      setViewport((v) => ({ 
        ...v, 
        x: v.x - e.deltaX, 
        y: v.y - e.deltaY 
      }));
    }
  }, [viewport]);

  // Canvas Events
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const isBg = (e.target as HTMLElement).getAttribute("data-canvas-bg");
    if (isBg) {
      // Only start panning if we're in select mode
      // In other modes, the click handler will create a node
      if (tool === "select") {
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY, vx: viewport.x, vy: viewport.y };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
      setSelectedId(null);
      setEditingNodeId(null);
      setQuickMenu(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setViewport((v) => ({ ...v, x: panStart.current.vx + (e.clientX - panStart.current.x), y: panStart.current.vy + (e.clientY - panStart.current.y) }));
    }
    if (isDragging && board) {
      const dx = (e.clientX - isDragging.startX) / viewport.scale;
      const dy = (e.clientY - isDragging.startY) / viewport.scale;
      setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === isDragging.nodeId ? { ...n, x: isDragging.ox + dx, y: isDragging.oy + dy } : n) } : null);
    }
    if (isConnecting && board) {
      const pos = getWorldPos(e.clientX, e.clientY);
      const node = board.nodes.find((n) => n.id === isConnecting.nodeId);
      if (node) {
        const dim = getNodeDimensions(node);
        setDragLine({ x1: node.x + dim.w / 2, y1: node.y + dim.h / 2, x2: pos.x, y2: pos.y });
      }
    }
    if (isResizingNode && board) {
      const dx = (e.clientX - isResizingNode.startX) / viewport.scale;
      const dy = (e.clientY - isResizingNode.startY) / viewport.scale;
      const newW = Math.max(150, isResizingNode.startW + dx);
      const newH = Math.max(100, isResizingNode.startH + dy);
      setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === isResizingNode.nodeId ? { ...n, width: newW, height: newH } : n) } : null);
    }
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (isPanning) setIsPanning(false);
    if (isDragging && board) {
      const node = board.nodes.find((n) => n.id === isDragging.nodeId);
      if (node) await updateNode(board.id, node.id, { x: node.x, y: node.y });
      setIsDragging(null);
    }
    if (isConnecting && board) {
      const pos = getWorldPos(e.clientX, e.clientY);
      let targetNode: WhiteboardNode | null = null;
      for (const n of board.nodes) {
        if (n.id === isConnecting.nodeId) continue;
        const dim = getNodeDimensions(n);
        if (pos.x >= n.x && pos.x <= n.x + dim.w && pos.y >= n.y && pos.y <= n.y + dim.h) {
          targetNode = n; break;
        }
      }
      if (targetNode) {
        const edge = await createEdge(board.id, { source: isConnecting.nodeId, target: targetNode.id });
        setBoard((b) => b ? { ...b, edges: [...b.edges, edge] } : null);
      } else {
        setQuickMenu({ x: pos.x, y: pos.y, sourceId: isConnecting.nodeId });
      }
      setIsConnecting(null);
      setDragLine(null);
    }
    if (isResizingNode && board) {
      const node = board.nodes.find((n) => n.id === isResizingNode.nodeId);
      if (node) await updateNode(board.id, node.id, { width: node.width, height: node.height });
      setIsResizingNode(null);
    }
  };

  // Node Events
  const handleNodeDown = (e: React.PointerEvent, node: WhiteboardNode) => {
    e.stopPropagation();
    if (tool !== "select") return;
    setSelectedId(node.id);
    setIsDragging({ nodeId: node.id, startX: e.clientX, startY: e.clientY, ox: node.x, oy: node.y });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const nodeType = node.type || "research";
    // Open panel for nodes that support it (including metric)
    if (["research", "chart", "company", "chat", "metric"].includes(nodeType)) {
      setPanelNode(node);
    } else {
      setPanelNode(null);
    }
  };

  const handleNodeDoubleClick = (node: WhiteboardNode) => {
    const nodeType = node.type || "research";
    if (nodeType === "text") setEditingNodeId(node.id);
    else if (["research", "chart", "company", "chat", "metric"].includes(nodeType)) setPanelNode(node);
    else if (nodeType === "document" && node.data?.documentUrl) window.open(node.data.documentUrl as string, "_blank");
  };

  const handleHandleDown = (e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsConnecting({ nodeId });
  };

  const handleResizeStart = (e: React.PointerEvent, node: WhiteboardNode) => {
    e.stopPropagation();
    e.preventDefault();
    const dim = getNodeDimensions(node);
    setIsResizingNode({
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      startW: dim.w,
      startH: dim.h,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Create Node
  const handleCreateNode = async (type: NodeType, worldX?: number, worldY?: number, sourceId?: string) => {
    if (!board) return;
    const x = worldX ?? (containerRef.current ? (containerRef.current.clientWidth / 2 - viewport.x) / viewport.scale - 120 : 200);
    const y = worldY ?? (containerRef.current ? (containerRef.current.clientHeight / 2 - viewport.y) / viewport.scale - 80 : 200);

    const titles: Record<string, string> = { research: "Research", company: "Company", chart: "Chart", metric: "Metric", text: "Note", image: "Image", document: "Document" };
    const defaultData: Record<string, NodeData> = {
      chart: { chart: { chartType: "line", timeframe: "1M" } as ChartConfig },
      company: { company: {} as CompanyConfig },
      metric: { metric: { metricType: "price", label: "Price", value: "—", trend: "neutral" } as MetricConfig },
    };

    const node = await createNode(board.id, { title: titles[type] || "Node", type, x: Math.round(x), y: Math.round(y), data: defaultData[type] || {} as NodeData });
    if (sourceId) await createEdge(board.id, { source: sourceId, target: node.id });

    const updated = await getWhiteboard(board.id);
    setBoard(updated);
    setSelectedId(node.id);
    setQuickMenu(null);
    setTool("select");

    if (type === "text") setEditingNodeId(node.id);
    if (["research", "chart", "company", "metric"].includes(type)) {
      const newNode = updated.nodes.find(n => n.id === node.id);
      if (newNode) setPanelNode(newNode);
    }
  };

  const handleCanvasClick = async (e: React.MouseEvent) => {
    if (tool === "select") return;
    if (tool === "image") { imageInputRef.current?.click(); return; }
    if (tool === "document") { docInputRef.current?.click(); return; }
    const pos = getWorldPos(e.clientX, e.clientY);
    await handleCreateNode(tool as NodeType, pos.x, pos.y);
  };

  // Company search
  const handleCompanySearch = async (query: string) => {
    setCompanySearch(query);
    if (query.length >= 1) {
      const results = await searchCompanies(query);
      setCompanyResults(results);
    } else {
      setCompanyResults([]);
    }
  };

  const handleSelectCompany = async (company: CompanyData) => {
    if (!board || !panelNode) return;
    const nodeType = panelNode.type || "research";

    if (nodeType === "company") {
      const companyMetrics = company.metrics?.map(m => ({
        label: m.label,
        value: m.value,
        trend: (m.trend as "up" | "down" | "neutral") || "neutral"
      }));
      const updatedData: NodeData = { ...panelNode.data, company: { ticker: company.ticker, name: company.name, sector: company.sector, marketCap: company.marketCap, price: company.price, change: company.change, changePercent: company.changePercent, description: company.description, metrics: companyMetrics } };
      await updateNode(board.id, panelNode.id, { title: company.ticker, data: updatedData });
    } else if (nodeType === "chart") {
      const updatedData: NodeData = { ...panelNode.data, chart: { ...panelNode.data?.chart, ticker: company.ticker } as ChartConfig };
      await updateNode(board.id, panelNode.id, { title: `${company.ticker} Chart`, data: updatedData });
    } else if (nodeType === "metric") {
      const updatedData: NodeData = { ...panelNode.data, metric: { ...panelNode.data?.metric, ticker: company.ticker, label: `${company.ticker} Price`, value: `$${company.price.toFixed(2)}`, trend: company.change >= 0 ? "up" : "down", changePercent: company.changePercent } as MetricConfig };
      await updateNode(board.id, panelNode.id, { title: `${company.ticker} Price`, data: updatedData });
    }

    const updated = await getWhiteboard(board.id);
    setBoard(updated);
    const newNode = updated.nodes.find(n => n.id === panelNode.id);
    if (newNode) setPanelNode(newNode);
    setCompanySearch("");
    setCompanyResults([]);
  };

  // File uploads
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !board) return;
    setIsUploading(true);
    try {
      const result = await uploadImage(file);
      const x = containerRef.current ? (containerRef.current.clientWidth / 2 - viewport.x) / viewport.scale - 150 : 200;
      const y = containerRef.current ? (containerRef.current.clientHeight / 2 - viewport.y) / viewport.scale - 100 : 200;
      await createNode(board.id, { title: file.name.split('.')[0] || "Image", type: "image", data: { imageUrl: result.url }, x: Math.round(x), y: Math.round(y), width: Math.min(result.width, 400), height: Math.min(result.height, 300) });
      const updated = await getWhiteboard(board.id);
      setBoard(updated);
    } catch (err) { console.error("Upload failed:", err); }
    finally { setIsUploading(false); e.target.value = ""; setTool("select"); }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !board) return;
    setIsUploading(true);
    try {
      const result = await uploadDocument(file);
      const x = containerRef.current ? (containerRef.current.clientWidth / 2 - viewport.x) / viewport.scale - 120 : 200;
      const y = containerRef.current ? (containerRef.current.clientHeight / 2 - viewport.y) / viewport.scale - 40 : 200;
      await createNode(board.id, { title: result.originalName || file.name, type: "document", data: { documentUrl: result.url, documentName: result.originalName, documentSize: result.size }, x: Math.round(x), y: Math.round(y) });
      const updated = await getWhiteboard(board.id);
      setBoard(updated);
    } catch (err) { console.error("Upload failed:", err); }
    finally { setIsUploading(false); e.target.value = ""; setTool("select"); }
  };

  // Delete
  const handleDelete = useCallback(async () => {
    if (!board || !selectedId) return;
    
    const nodeToDelete = selectedId;
    const boardId = board.id;
    
    // Clear all related state first
    setSelectedId(null);
    setPanelNode(null);
    setEditingNodeId(null);
    setQuickMenu(null);
    
    // Optimistic update - remove node and its edges from local state
    setBoard((b) => {
      if (!b) return null;
      return {
        ...b,
        nodes: b.nodes.filter((n) => n.id !== nodeToDelete),
        edges: b.edges.filter((e) => e.source !== nodeToDelete && e.target !== nodeToDelete)
      };
    });
    
    // Also update boardRef immediately to prevent stale references
    if (boardRef.current) {
      boardRef.current = {
        ...boardRef.current,
        nodes: boardRef.current.nodes.filter((n) => n.id !== nodeToDelete),
        edges: boardRef.current.edges.filter((e) => e.source !== nodeToDelete && e.target !== nodeToDelete)
      };
    }
    
    try {
      await deleteNode(boardId, nodeToDelete);
      // Don't refresh immediately - the optimistic update is sufficient
      // Only refresh if there's an error to restore state
    } catch (err) {
      console.error("Delete failed:", err);
      // Refresh to restore state on error
      await refreshBoard();
    }
  }, [board, selectedId, refreshBoard]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Don't handle keyboard shortcuts when typing in inputs
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      
      // Delete selected node
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId && !isDragging && !isConnecting && !isResizingNode) {
        e.preventDefault();
        handleDelete();
      }
      
      // Escape to deselect
      if (e.key === "Escape") {
        setSelectedId(null);
        setEditingNodeId(null);
        setPanelNode(null);
        setQuickMenu(null);
        setIsConnecting(null);
        setDragLine(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, handleDelete, isDragging, isConnecting, isResizingNode]);

  // Update text
  const updateTextContent = async (nodeId: string, content: string) => {
    if (!board) return;
    await updateNode(board.id, nodeId, { data: { content } });
    setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, content } } : n) } : null);
  };

  // Chat
  const handleSendChat = async () => {
    if (!board || !panelNode || !chatInput.trim()) return;
    const message = chatInput.trim();
    setChatInput("");
    setIsChatting(true);
    const userMsg: Message = { id: mkId("msg"), role: "user", content: message, createdAt: new Date().toISOString() };
    const aiId = mkId("ai");
    const aiMsg: Message = { id: aiId, role: "assistant", content: "", createdAt: new Date().toISOString() };
    setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, messages: [...n.messages, userMsg, aiMsg] } : n) } : null);
    setPanelNode(prev => prev ? { ...prev, messages: [...prev.messages, userMsg, aiMsg] } : null);
    try {
      let content = "";
      const callbacks: ChatCallbacks = {
        onChunk: (chunk) => {
          content += chunk;
          setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, messages: n.messages.map((m) => m.id === aiId ? { ...m, content } : m) } : n) } : null);
          setPanelNode(prev => prev ? { ...prev, messages: prev.messages.map(m => m.id === aiId ? { ...m, content } : m) } : null);
        },
        onAction: (action) => {
          handleAIAction(action);
        },
        onStatus: (status) => {
          setAiStatus(status || null);
        }
      };
      await sendNodeChat(board.id, panelNode.id, message, callbacks, {
        provider: selectedProvider,
        model: selectedModel,
        mode: researchMode ? "research" : "chat",
      });
    } catch (err) { console.error(err); }
    finally {
      setIsChatting(false);
      setAiStatus(null);
    }
  };

  // Generate Investment Memo
  const handleGenerateInvestmentMemo = async () => {
    if (!board) return;
    setShowAIMenu(false);
    setAiGenerating(true);
    setAiGeneratingType("memo");
    setAiStatus("Analyzing whiteboard context...");

    try {
      // Gather context from all nodes on the board
      const contextParts: string[] = [];
      
      for (const node of board.nodes) {
        const nodeType = node.type || "research";
        
        if (nodeType === "company" && node.data?.company) {
          const c = node.data.company as CompanyConfig;
          contextParts.push(`Company: ${c.name || c.ticker} (${c.ticker}) - Sector: ${c.sector || "N/A"}, Market Cap: ${c.marketCap || "N/A"}, Price: $${c.price || "N/A"}`);
          if (c.description) contextParts.push(`Description: ${c.description}`);
          if (c.metrics) {
            const metricsStr = c.metrics.map(m => `${m.label}: ${m.value}`).join(", ");
            contextParts.push(`Metrics: ${metricsStr}`);
          }
        }
        
        if (nodeType === "text" && node.data?.content) {
          contextParts.push(`Notes (${node.title}): ${node.data.content}`);
        }
        
        if (nodeType === "research" && node.messages?.length > 0) {
          const recentMsgs = node.messages.slice(-4).map(m => `${m.role}: ${m.content.slice(0, 200)}`).join("\n");
          contextParts.push(`Research (${node.title}):\n${recentMsgs}`);
        }
        
        if (nodeType === "metric" && node.data?.metric) {
          const m = node.data.metric as MetricConfig;
          contextParts.push(`Metric: ${m.label} = ${m.value} (${m.trend || "neutral"})`);
        }
      }

      const boardContext = contextParts.length > 0 
        ? contextParts.join("\n\n") 
        : "No specific data found on whiteboard. Generate a template investment memo.";

      const memoPrompt = `You are a professional investment analyst. Generate a comprehensive Investment Memo based on the following whiteboard context.

WHITEBOARD CONTEXT:
${boardContext}

Generate a professional Investment Memo with the following structure:
1. **Executive Summary** - Key investment thesis in 2-3 sentences
2. **Company Overview** - Business description, sector, key products/services
3. **Market Opportunity** - TAM/SAM/SOM analysis, market trends
4. **Competitive Landscape** - Key competitors, competitive advantages/moats
5. **Financial Analysis** - Key metrics, growth rates, profitability
6. **Investment Thesis** - Why invest, key drivers of value
7. **Risks & Mitigants** - Key risks and how they can be addressed
8. **Valuation** - Current valuation, comparable analysis if available
9. **Recommendation** - Buy/Hold/Sell with target price if applicable

Format the memo in clean Markdown. Be specific with numbers when available, and clearly state when you're making assumptions.`;

      let memoContent = "";
      
      const callbacks: ChatCallbacks = {
        onChunk: (chunk) => {
          memoContent += chunk;
          setAiStatus("Writing investment memo...");
        },
        onAction: (action) => {
          handleAIAction(action);
        },
        onStatus: (status) => {
          setAiStatus(status || "Generating memo...");
        },
        onComplete: async () => {
          // Create a text node with the memo content
          const baseX = containerRef.current ? (containerRef.current.clientWidth / 2 - viewport.x) / viewport.scale : 400;
          const baseY = containerRef.current ? (containerRef.current.clientHeight / 2 - viewport.y) / viewport.scale : 300;
          
          await createNode(board.id, {
            title: "Investment Memo",
            type: "text",
            x: Math.round(baseX),
            y: Math.round(baseY),
            data: { content: memoContent },
            width: 500,
            height: 600,
          });
          
          await refreshBoard();
          setGeneratedMemo(memoContent);
          setShowMemoModal(true);
        }
      };

      await sendMasterAICommand(board.id, memoPrompt, callbacks, {
        provider: selectedProvider,
        model: selectedModel,
      });

    } catch (err) {
      console.error("Failed to generate memo:", err);
      setAiStatus("Failed to generate memo");
    } finally {
      setAiGenerating(false);
      setAiGeneratingType(null);
      setTimeout(() => setAiStatus(null), 2000);
    }
  };

  // Generate Investor Graph
  const handleGenerateInvestorGraph = async () => {
    if (!board) return;
    setShowAIMenu(false);
    setAiGenerating(true);
    setAiGeneratingType("investor-graph");
    setAiStatus("Researching investors and funding...");

    try {
      // Find target companies from the board
      const companies: string[] = [];
      for (const node of board.nodes) {
        if (node.type === "company" && node.data?.company) {
          const c = node.data.company as CompanyConfig;
          if (c.ticker || c.name) {
            companies.push(c.name || c.ticker || "");
          }
        }
      }

      const targetCompany = companies[0] || "the company on this whiteboard";
      
      const graphPrompt = `You are a financial research analyst specializing in investor relations and ownership analysis.

TARGET: ${companies.length > 0 ? companies.join(", ") : "Analyze general investment patterns"}

Research and create a comprehensive investor/ownership map. Use your tools to create visual nodes for:

1. **Major Institutional Investors** - Create company nodes for major shareholders (e.g., Vanguard, BlackRock, State Street, Fidelity)
   - Include their ownership percentage if known
   - Create metric nodes for their stake sizes

2. **Venture Capital / Private Equity** (if applicable)
   - Key VC firms that have invested
   - Funding rounds and amounts
   - Create nodes for each major investor

3. **Key Individual Investors**
   - Founders and their stakes
   - Notable individual shareholders
   - Board members with significant holdings

4. **Investment Relationships**
   - Who invested in whom
   - Co-investment patterns
   - Fund-to-company relationships

5. **Ownership Metrics**
   - Create metric nodes for: Institutional Ownership %, Insider Ownership %, Float %
   - Top 10 holders summary

Use the following tools:
- create_company_node for institutional investors and funds
- create_metric_node for ownership percentages and stake values
- create_text_node for detailed analysis and fund descriptions
- connect_nodes to show investment relationships

Research thoroughly and create an interconnected graph showing the investment ecosystem around ${targetCompany}.`;

      const callbacks: ChatCallbacks = {
        onChunk: (chunk) => {
          // We don't need to show the text output for graph generation
        },
        onAction: (action) => {
          handleAIAction(action);
          setAiStatus(`Creating: ${action.data?.title || action.type}...`);
        },
        onStatus: (status) => {
          setAiStatus(status || "Building investor graph...");
        },
        onComplete: async () => {
          await refreshBoard();
          setAiStatus("Investor graph complete!");
        }
      };

      await sendMasterAICommand(board.id, graphPrompt, callbacks, {
        provider: selectedProvider,
        model: selectedModel,
      });

    } catch (err) {
      console.error("Failed to generate investor graph:", err);
      setAiStatus("Failed to generate investor graph");
    } finally {
      setAiGenerating(false);
      setAiGeneratingType(null);
      setTimeout(() => setAiStatus(null), 3000);
    }
  };

  // Download memo as .txt file
  const handleDownloadMemo = () => {
    if (!generatedMemo) return;
    
    const blob = new Blob([generatedMemo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `investment-memo-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Chart timeframe change
  const handleTimeframeChange = async (tf: ChartConfig["timeframe"]) => {
    if (!board || !panelNode) return;
    const currentChart = panelNode.data?.chart || { chartType: "line" as const, timeframe: "1M" as const };
    const newData: NodeData = { ...panelNode.data, chart: { ...currentChart, timeframe: tf } as ChartConfig };
    await updateNode(board.id, panelNode.id, { data: newData });
    setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, data: newData } : n) } : null);
    setPanelNode(prev => prev ? { ...prev, data: newData } : null);
    
    // Load new chart data for this timeframe
    if (panelNode.data?.chart?.ticker) {
      const ticker = panelNode.data.chart.ticker;
      const cacheKey = `${panelNode.id}_${ticker}_${tf}`;
      try {
        const data = await getChartData(ticker, tf);
        setChartDataMap(prev => ({ ...prev, [cacheKey]: data }));
      } catch (err) {
        console.error(`Failed to load chart data:`, err);
      }
    }
  };

  // Handle AI actions  // --- AI ACTIONS ---

  // Helper to find a free spot
  const findSmartPosition = (board: Whiteboard, baseX: number, baseY: number) => {
    const nodeWidth = 300;
    const nodeHeight = 200;
    const padding = 20;

    // Spiral search
    let angle = 0;
    let radius = 0;
    const maxRadius = 2000;

    while (radius < maxRadius) {
      const x = baseX + Math.cos(angle) * radius;
      const y = baseY + Math.sin(angle) * radius;

      // Check collision
      const hasCollision = board.nodes.some(n => {
        return (
          x < n.x + nodeWidth + padding &&
          x + nodeWidth + padding > n.x &&
          y < n.y + nodeHeight + padding &&
          y + nodeHeight + padding > n.y
        );
      });

      if (!hasCollision) return { x: Math.round(x), y: Math.round(y) };

      // Advance spiral
      angle += 0.5;
      radius = 50 + (angle * 20); // Slowly increase radius
    }

    return { x: Math.round(baseX), y: Math.round(baseY) };
  };

  const handleAIAction = useCallback(async (action: AIAction) => {
    console.log("[WHITEBOARD] handleAIAction called with:", action);

    // Use ref to get latest board state (avoids stale closure)
    // We update the boardRef manually after each create to ensure subsequent creates in same batch don't overlap
    const currentBoard = boardRef.current;
    if (!currentBoard) {
      console.log("[WHITEBOARD] No board available, skipping action");
      return;
    }

    const baseX = containerRef.current ? (containerRef.current.clientWidth / 2 - viewport.x) / viewport.scale : 400;
    const baseY = containerRef.current ? (containerRef.current.clientHeight / 2 - viewport.y) / viewport.scale : 300;

    // Find smart position
    const { x, y } = findSmartPosition(currentBoard, baseX, baseY);

    console.log("[WHITEBOARD] Creating node at position:", { x, y });

    try {
      switch (action.type) {
        case "create_research":
        case "create_node": {
          console.log("[WHITEBOARD] Creating research node");
          const nodeType = action.data.node_type || "text"; // Default to text node if generic
          await createNode(currentBoard.id, {
            title: action.data.title || "Note",
            summary: action.data.summary || "",
            type: nodeType,
            x, y,
            data: action.data.data || {},
          });
          break;
        }

        case "create_chart": {
          console.log("[WHITEBOARD] Creating chart node for:", action.data.chart?.ticker);
          await createNode(currentBoard.id, {
            title: action.data.title || `${action.data.chart?.ticker || ""} Chart`,
            type: "chart",
            x, y,
            data: { chart: action.data.chart },
          });
          break;
        }

        case "create_metric": {
          console.log("[WHITEBOARD] Creating metric node:", action.data.metric);
          await createNode(currentBoard.id, {
            title: action.data.title || action.data.metric?.label || "Metric",
            type: "metric",
            x, y,
            data: { metric: action.data.metric },
          });
          break;
        }

        case "create_company": {
          console.log("[WHITEBOARD] Creating company node:", action.data.company?.ticker);
          await createNode(currentBoard.id, {
            title: action.data.title || action.data.company?.ticker || "Company",
            type: "company",
            x, y,
            data: { company: action.data.company },
          });
          break;
        }

        case "connect_nodes": {
          // Refresh to get latest nodes for finding by title
          const latestBoard = await refreshBoard();
          if (latestBoard) {
            const sourceNode = latestBoard.nodes.find(n =>
              n.title.toLowerCase() === action.data.source_title?.toLowerCase()
            );
            const targetNode = latestBoard.nodes.find(n =>
              n.title.toLowerCase() === action.data.target_title?.toLowerCase()
            );
            if (sourceNode && targetNode) {
              await createEdge(currentBoard.id, { source: sourceNode.id, target: targetNode.id });
            }
          }
          break;
        }

        case "generate_map": {
          if (action.data.topic) {
            await generateMap(currentBoard.id, action.data.topic);
          }
          break;
        }

        default:
          console.log("[WHITEBOARD] Unknown action type:", action.type);
      }

      // Refresh board to show new nodes
      console.log("[WHITEBOARD] Refreshing board...");
      await refreshBoard();
      console.log("[WHITEBOARD] Board refreshed");

    } catch (err) {
      console.error("[WHITEBOARD] Failed to execute AI action:", err);
    }
  }, [viewport, refreshBoard]);

  // Render
  if (loading || !board) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a] text-stone-500"><div className="animate-pulse">Loading...</div></div>;
  }

  // Node content renderer
  const renderNodeContent = (node: WhiteboardNode, isEditing: boolean) => {
    const nodeType = (node.type || "research") as NodeType | "chat"; // Support legacy "chat" type

    // Research Node - Simple header + message indicator
    if (nodeType === "research" || nodeType === "chat") {
      return (
        <div className="p-3 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center text-blue-400"><I.MessageSquare /></div>
            <span className="text-xs font-medium text-stone-200 truncate flex-1">{node.title}</span>
          </div>
          <p className="text-[10px] text-stone-500 line-clamp-2 flex-1">{node.summary || "AI Research Assistant"}</p>
          {(node.messages?.length || 0) > 0 && (
            <div className="mt-2 text-[10px] text-stone-600 flex items-center gap-1">
              <I.Zap /> {node.messages.length} messages
            </div>
          )}
        </div>
      );
    }

    // Company Node - Full card
    if (nodeType === "company") {
      return <CompanyCard config={node.data?.company as CompanyConfig || {}} childCount={getChildCount(node.id)} />;
    }

    // Chart Node - Interactive chart
    if (nodeType === "chart") {
      const ticker = node.data?.chart?.ticker;
      const timeframe = node.data?.chart?.timeframe || "1M";
      const cacheKey = `${node.id}_${ticker}_${timeframe}`;
      const data = chartDataMap[cacheKey] || [];
      
      return (
        <InteractiveChart
          config={node.data?.chart as ChartConfig || { chartType: "line", timeframe: "1M" }}
          data={data}
          onTimeframeChange={handleTimeframeChange}
        />
      );
    }

    // Metric Node
    if (nodeType === "metric") {
      const metricConfig = node.data?.metric as MetricConfig || { metricType: "custom", label: "Metric", value: "—" };
      return <MetricDisplay config={metricConfig} />;
    }

    // Text Node
    if (nodeType === "text") {
      const isCollapsed = node.data?.collapsed;

      return (
        <div className="flex flex-col h-full">
          {/* Document Header */}
          <div
            className="flex items-center justify-between px-3 py-2 bg-stone-900 border-b border-stone-800 group-hover:bg-stone-800/80 transition-colors cursor-pointer"
            onDoubleClick={(e) => { e.stopPropagation(); updateNode(board.id, node.id, { data: { ...node.data, collapsed: !isCollapsed } }); }}
          >
            <div className="flex items-center gap-2 text-[10px] font-bold text-stone-500 uppercase">
              <I.FileText /> Note
            </div>
            <div className="flex items-center gap-2">
              {/* Collapse Button */}
              <button
                onClick={(e) => { e.stopPropagation(); updateNode(board.id, node.id, { data: { ...node.data, collapsed: !isCollapsed } }); }}
                className="text-stone-500 hover:text-white p-1 hover:bg-stone-700/50 rounded"
              >
                {isCollapsed ? <I.ChevronDown /> : <I.ChevronUp />}
              </button>
            </div>
          </div>

          {/* Content */}
          {!isCollapsed && (
            <div 
              className="flex-1 min-h-0 overflow-hidden relative bg-[#141414]"
              onWheel={(e) => e.stopPropagation()}
            >
              {isEditing ? (
                <div className="absolute inset-0 p-3">
                  <textarea
                    autoFocus
                    className="w-full h-full bg-transparent text-sm text-stone-200 outline-none resize-none font-mono leading-relaxed"
                    defaultValue={(node.data?.content as string) || ""}
                    onBlur={(e) => { updateTextContent(node.id, e.target.value); setEditingNodeId(null); }}
                    onKeyDown={(e) => { if (e.key === "Escape") setEditingNodeId(null); }}
                    onWheel={(e) => e.stopPropagation()}
                    placeholder="# Markdown Title\n\nWrite your notes here..."
                  />
                </div>
              ) : (
                <div 
                  className="p-4 h-full text-stone-300 text-sm overflow-y-auto"
                  onWheel={(e) => e.stopPropagation()}
                >
                  {node.data?.content ? (
                    <MarkdownText content={node.data.content as string} />
                  ) : (
                    <span className="italic opacity-50">Double-click to edit...</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Image Node
    if (nodeType === "image" && node.data?.imageUrl) {
      return <img src={node.data.imageUrl as string} alt={node.title} className="w-full h-full object-cover" draggable={false} />;
    }

    // Document Node
    if (nodeType === "document") {
      return (
        <a href={(node.data?.documentUrl as string) || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 h-full hover:bg-stone-800/50" onClick={(e) => e.stopPropagation()}>
          <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center text-orange-500"><I.FileText /></div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-stone-200 truncate">{node.data?.documentName || node.title}</div>
            <div className="text-[10px] text-stone-500">Click to open</div>
          </div>
        </a>
      );
    }

    return <div className="p-3"><span className="text-xs text-stone-300">{node.title}</span></div>;
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-stone-100 overflow-hidden font-sans">
      <input ref={imageInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
      <input ref={docInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.md" onChange={handleDocUpload} />

      {/* LEFT PANEL */}
      <div className="w-56 border-r border-stone-800 flex flex-col bg-[#0a0a0a]">
        <div className="p-3 border-b border-stone-800">
          <button onClick={() => router.push("/home")} className="flex items-center gap-2 text-stone-400 hover:text-white text-xs mb-3"><I.Home /> Back</button>
          <h1 className="text-sm font-bold text-white truncate">{board.title}</h1>
        </div>
        <div className="p-3 border-b border-stone-800 grid grid-cols-2 gap-2">
          <div className="bg-stone-900/50 rounded p-2"><div className="text-[10px] text-stone-500">Nodes</div><div className="text-lg font-bold text-white">{board.nodes.length}</div></div>
          <div className="bg-stone-900/50 rounded p-2"><div className="text-[10px] text-stone-500">Links</div><div className="text-lg font-bold text-white">{board.edges.length}</div></div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-[10px] text-stone-500 uppercase font-bold px-2 mb-2 flex items-center gap-1"><I.Layers /> Layers</div>
          {board.nodes.map((node) => {
            const nodeType = (node.type || "research") as string;
            const icons: Record<string, React.ReactNode> = { research: <I.MessageSquare />, chat: <I.MessageSquare />, company: <I.Building />, chart: <I.BarChart />, metric: <I.Target />, text: <I.Type />, image: <I.Image />, document: <I.FileText /> };
            return (
              <button key={node.id} onClick={() => { setSelectedId(node.id); if (["research", "chat", "chart", "company", "metric"].includes(nodeType)) setPanelNode(node); }} className={`w-full text-left px-2 py-1.5 text-xs flex items-center gap-2 rounded transition-colors ${selectedId === node.id ? "bg-stone-800 text-white" : "text-stone-400 hover:bg-stone-900"}`}>
                {icons[nodeType] || <I.MessageSquare />}
                <span className="truncate flex-1">{node.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CENTER - Canvas */}
      <div className="flex-1 relative overflow-hidden" ref={containerRef}>
        {isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-stone-900 rounded-lg px-6 py-4 flex items-center gap-3"><div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /><span className="text-sm">Uploading...</span></div></div>}

        {/* Zoom controls */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          <div className="bg-stone-900/95 border border-stone-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-xs text-stone-400">{Math.round(viewport.scale * 100)}%</span>
            <button onClick={() => setViewport((v) => ({ ...v, scale: clamp(v.scale - 0.1, 0.1, 4) }))} className="p-1 hover:bg-stone-800 rounded text-stone-400"><I.Minus /></button>
            <button onClick={() => setViewport((v) => ({ ...v, scale: clamp(v.scale + 0.1, 0.1, 4) }))} className="p-1 hover:bg-stone-800 rounded text-stone-400"><I.Plus /></button>
            <button onClick={() => setViewport({ x: 0, y: 0, scale: 1 })} className="p-1 hover:bg-stone-800 rounded text-stone-400"><I.Refresh /></button>
          </div>
        </div>

        {/* MASTER AI PROMPT */}
        <MasterPrompt
          boardId={boardId}
          aiModels={aiModels}
          selectedProvider={selectedProvider}
          selectedModel={selectedModel}
          onProviderChange={setSelectedProvider}
          onModelChange={setSelectedModel}
          onAction={handleAIAction}
          onRefresh={refreshBoard}
        />

        {/* FLOATING BOTTOM TOOLBAR */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
          <div className="bg-stone-900/95 border border-stone-800 rounded-xl px-2 py-2 flex items-center gap-1 shadow-2xl">
            {[
              { id: "select" as Tool, icon: <I.Pointer />, label: "Select", color: "" },
              { id: "research" as Tool, icon: <I.MessageSquare />, label: "Research", color: "bg-blue-500" },
              { id: "company" as Tool, icon: <I.Building />, label: "Company", color: "bg-orange-500" },
              { id: "chart" as Tool, icon: <I.BarChart />, label: "Chart", color: "bg-green-500" },
              { id: "metric" as Tool, icon: <I.Target />, label: "Metric", color: "bg-purple-500" },
              { id: "text" as Tool, icon: <I.Type />, label: "Note", color: "" },
              { id: "image" as Tool, icon: <I.Image />, label: "Image", color: "" },
              { id: "document" as Tool, icon: <I.FileText />, label: "Doc", color: "" },
            ].map((t) => (
              <button key={t.id} onClick={() => { setTool(t.id); if (t.id === "image") imageInputRef.current?.click(); if (t.id === "document") docInputRef.current?.click(); }} title={t.label} className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all ${tool === t.id ? "bg-stone-700 text-white" : "text-stone-400 hover:bg-stone-800 hover:text-white"}`}>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${t.color && tool !== t.id ? t.color + "/20 text-white" : ""}`}>{t.icon}</div>
                <span className="text-[9px] mt-1">{t.label}</span>
              </button>
            ))}
            
            {/* Divider */}
            <div className="w-px h-8 bg-stone-700 mx-1" />
            
            {/* AI Menu Button */}
            <div className="relative">
              <button 
                onClick={() => setShowAIMenu(!showAIMenu)} 
                disabled={aiGenerating}
                className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all ${showAIMenu ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" : "text-stone-400 hover:bg-stone-800 hover:text-white"} ${aiGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${aiGenerating ? "animate-pulse" : ""}`}>
                  <I.Brain />
                </div>
                <span className="text-[9px] mt-1">{aiGenerating ? "Working..." : "AI"}</span>
              </button>
              
              {/* AI Dropdown Menu */}
              {showAIMenu && !aiGenerating && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl overflow-hidden w-56 z-50">
                  <div className="px-3 py-2 border-b border-stone-800">
                    <div className="text-[10px] uppercase font-bold text-stone-500 flex items-center gap-1">
                      <I.Sparkles /> AI Generate
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleGenerateInvestmentMemo}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-stone-800 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/30">
                      <I.FileDocument />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">Investment Memo</div>
                      <div className="text-[10px] text-stone-500">Generate detailed analysis</div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={handleGenerateInvestorGraph}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-stone-800 transition-colors text-left group border-t border-stone-800"
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-500/30">
                      <I.Network />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">Investor Graph</div>
                      <div className="text-[10px] text-stone-500">Map ownership & funding</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
            
            {selectedId && !isDragging && !isConnecting && (
              <>
                <div className="w-px h-8 bg-stone-700 mx-1" />
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }} 
                  className="flex flex-col items-center px-3 py-2 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors"
                  title="Delete selected node (Delete/Backspace)"
                >
                  <I.Trash />
                  <span className="text-[9px] mt-1">Delete</span>
                </button>
              </>
            )}
          </div>
          
          {/* AI Status Indicator */}
          {aiStatus && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-stone-900/95 border border-stone-700 rounded-lg px-4 py-2 flex items-center gap-2 shadow-xl">
              <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-xs text-stone-300">{aiStatus}</span>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="absolute inset-0 touch-none" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onWheel={handleWheel} onClick={handleCanvasClick} data-canvas-bg="true" style={{ cursor: isPanning ? "grabbing" : tool !== "select" ? "crosshair" : "default" }}>
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #78716c 1px, transparent 0)", backgroundSize: `${24 * viewport.scale}px ${24 * viewport.scale}px`, backgroundPosition: `${viewport.x}px ${viewport.y}px` }} />
          <div style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`, transformOrigin: "0 0" }}>
            <svg className="overflow-visible absolute top-0 left-0 pointer-events-none">
              <defs><marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#57534e" /></marker></defs>
              {board.edges.map((edge) => { const src = board.nodes.find((n) => n.id === edge.source); const dst = board.nodes.find((n) => n.id === edge.target); if (!src || !dst) return null; const sDim = getNodeDimensions(src); const dDim = getNodeDimensions(dst); return <line key={edge.id} x1={src.x + sDim.w / 2} y1={src.y + sDim.h / 2} x2={dst.x + dDim.w / 2} y2={dst.y + dDim.h / 2} stroke="#44403c" strokeWidth="1.5" markerEnd="url(#arrowhead)" />; })}
              {dragLine && <line x1={dragLine.x1} y1={dragLine.y1} x2={dragLine.x2} y2={dragLine.y2} stroke="#ea580c" strokeWidth="2" strokeDasharray="6,3" />}
            </svg>
            {board.nodes.map((node) => {
              const dim = getNodeDimensions(node); const isSelected = selectedId === node.id; const isNodeEditing = editingNodeId === node.id; const nodeType = (node.type || "research") as string; const borderColors: Record<string, string> = { research: "border-blue-500/50", company: "border-orange-500/50", chart: "border-green-500/50", metric: "border-purple-500/50", text: "border-yellow-500/50" };
              const isCollapsed = node.data?.collapsed;
              const nodeHeight = isCollapsed ? 44 : dim.h;
              const minHeight = isCollapsed ? 44 : 100;
              const isResizable = ["text", "image", "chart"].includes(nodeType);

              return (
                <div key={node.id} style={{ transform: `translate(${node.x}px, ${node.y}px)`, width: dim.w, height: nodeHeight, minHeight }} className={`absolute rounded-xl border transition-all group overflow-hidden bg-[#141414] ${isSelected ? `ring-2 ring-offset-1 ring-offset-[#0a0a0a] ${borderColors[nodeType] ? "ring-opacity-100" : "ring-orange-500"} ${borderColors[nodeType] || "border-orange-500"}` : "border-stone-800 hover:border-stone-600"}`} onPointerDown={(e) => handleNodeDown(e, node)} onClick={(e) => e.stopPropagation()} onDoubleClick={() => handleNodeDoubleClick(node)}>
                  {renderNodeContent(node, isNodeEditing)}
                  {/* Connection handle */}
                  <div className="absolute -right-2 top-1/2 -mt-2 w-4 h-4 rounded-full bg-stone-800 border-2 border-stone-600 cursor-crosshair opacity-0 group-hover:opacity-100 hover:bg-orange-500 hover:border-orange-400 transition-all flex items-center justify-center" onPointerDown={(e) => handleHandleDown(e, node.id)}><div className="w-1 h-1 bg-white rounded-full" /></div>
                  {/* Resize handle - only for resizable nodes */}
                  {isResizable && !isCollapsed && (
                    <div
                      className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onPointerDown={(e) => handleResizeStart(e, node)}
                    >
                      <svg className="w-4 h-4 text-stone-500 hover:text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
            {quickMenu && (
              <div className="absolute bg-stone-900 border border-stone-700 rounded-lg shadow-2xl p-1 w-44 z-50" style={{ transform: `translate(${quickMenu.x}px, ${quickMenu.y}px)` }}>
                <div className="text-[9px] uppercase font-bold text-stone-500 px-2 py-1">Create</div>
                {[{ type: "research" as NodeType, icon: <I.MessageSquare />, label: "Research" }, { type: "company" as NodeType, icon: <I.Building />, label: "Company" }, { type: "chart" as NodeType, icon: <I.BarChart />, label: "Chart" }, { type: "metric" as NodeType, icon: <I.Target />, label: "Metric" }].map((item) => (<button key={item.type} onClick={() => handleCreateNode(item.type, quickMenu.x, quickMenu.y, quickMenu.sourceId)} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-stone-300 hover:bg-stone-800 rounded">{item.icon} {item.label}</button>))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      {panelNode && board?.nodes.some(n => n.id === panelNode.id) && (
        <div
          className="border-l border-stone-800 bg-[#0a0a0a] flex flex-col relative"
          style={{ width: panelWidth, minWidth: 280, maxWidth: 600 }}
        >
          {/* Resize Handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-orange-500/50 transition-colors z-10"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
              resizeStartX.current = e.clientX;
              resizeStartWidth.current = panelWidth;
              const handleMouseMove = (e: MouseEvent) => {
                const delta = resizeStartX.current - e.clientX;
                const newWidth = Math.max(280, Math.min(600, resizeStartWidth.current + delta));
                setPanelWidth(newWidth);
              };
              const handleMouseUp = () => {
                setIsResizing(false);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
          <div className="p-3 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${panelNode.type === "company" ? "bg-orange-500" :
                panelNode.type === "chart" ? "bg-green-500" :
                  panelNode.type === "metric" ? "bg-purple-500" : "bg-blue-500"
                }`} />
              <span className="text-xs font-medium text-stone-400 uppercase">{panelNode.type || "research"}</span>
            </div>
            <button onClick={() => setPanelNode(null)} className="text-stone-500 hover:text-white"><I.X /></button>
          </div>

          {/* Title */}
          <div className="p-3 border-b border-stone-800">
            <input className="w-full bg-transparent text-sm font-bold text-white outline-none" value={panelNode.title} onChange={(e) => { const val = e.target.value; setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, title: val } : n) } : null); setPanelNode((p) => p ? { ...p, title: val } : null); }} onBlur={() => board && updateNode(board.id, panelNode.id, { title: panelNode.title })} />
          </div>

          {/* Company/Chart/Metric Ticker Search */}
          {["company", "chart", "metric"].includes(panelNode.type || "") && (
            <div className="p-3 border-b border-stone-800">
              <div className="text-[10px] text-stone-500 uppercase mb-2">Ticker</div>
              <div className="relative">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500"><I.Search /></div>
                <input className="w-full bg-stone-900 border border-stone-800 rounded-lg py-2 pl-8 pr-3 text-xs text-stone-200 outline-none focus:border-stone-600" placeholder="Search ticker (AAPL, MSFT...)" value={companySearch} onChange={(e) => handleCompanySearch(e.target.value)} />
              </div>
              {companyResults.length > 0 && (
                <div className="mt-2 bg-stone-900 border border-stone-800 rounded-lg max-h-40 overflow-y-auto">
                  {companyResults.map((c) => (
                    <button key={c.ticker} onClick={() => handleSelectCompany(c)} className="w-full text-left px-3 py-2 hover:bg-stone-800 flex items-center justify-between">
                      <div><div className="text-xs font-bold text-white">{c.ticker}</div><div className="text-[10px] text-stone-500">{c.name}</div></div>
                      <div className={`text-xs ${c.change >= 0 ? "text-green-500" : "text-red-500"}`}>${c.price.toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== COMPANY MANUAL CONTROLS ========== */}
          {panelNode.type === "company" && (
            <div className="p-3 border-b border-stone-800 space-y-3">
              <div className="text-[10px] text-stone-500 uppercase mb-2">Manual Entry</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-stone-600 uppercase">Ticker</label>
                  <input className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-white outline-none" placeholder="AAPL" value={panelNode.data?.company?.ticker || ""} onChange={(e) => { const val = e.target.value.toUpperCase(); const newData = { ...panelNode.data, company: { ...panelNode.data?.company, ticker: val } }; setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, data: newData } : n) } : null); setPanelNode((p) => p ? { ...p, data: newData } : null); }} onBlur={() => board && updateNode(board.id, panelNode.id, { data: panelNode.data })} />
                </div>
                <div>
                  <label className="text-[9px] text-stone-600 uppercase">Price</label>
                  <input type="number" className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-white outline-none" placeholder="178.50" value={panelNode.data?.company?.price || ""} onChange={(e) => { const val = parseFloat(e.target.value) || 0; const newData = { ...panelNode.data, company: { ...panelNode.data?.company, price: val } }; setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, data: newData } : n) } : null); setPanelNode((p) => p ? { ...p, data: newData } : null); }} onBlur={() => board && updateNode(board.id, panelNode.id, { data: panelNode.data })} />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-stone-600 uppercase">Company Name</label>
                <input className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-white outline-none" placeholder="Apple Inc." value={panelNode.data?.company?.name || ""} onChange={(e) => { const val = e.target.value; const newData = { ...panelNode.data, company: { ...panelNode.data?.company, name: val } }; setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, data: newData } : n) } : null); setPanelNode((p) => p ? { ...p, data: newData } : null); }} onBlur={() => board && updateNode(board.id, panelNode.id, { data: panelNode.data })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-stone-600 uppercase">Sector</label>
                  <input className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-white outline-none" placeholder="Technology" value={panelNode.data?.company?.sector || ""} onChange={(e) => { const val = e.target.value; const newData = { ...panelNode.data, company: { ...panelNode.data?.company, sector: val } }; setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, data: newData } : n) } : null); setPanelNode((p) => p ? { ...p, data: newData } : null); }} onBlur={() => board && updateNode(board.id, panelNode.id, { data: panelNode.data })} />
                </div>
                <div>
                  <label className="text-[9px] text-stone-600 uppercase">Market Cap</label>
                  <input className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-white outline-none" placeholder="$2.89T" value={panelNode.data?.company?.marketCap || ""} onChange={(e) => { const val = e.target.value; const newData = { ...panelNode.data, company: { ...panelNode.data?.company, marketCap: val } }; setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, data: newData } : n) } : null); setPanelNode((p) => p ? { ...p, data: newData } : null); }} onBlur={() => board && updateNode(board.id, panelNode.id, { data: panelNode.data })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-stone-600 uppercase">Change ($)</label>
                  <input type="number" step="0.01" className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-white outline-none" placeholder="2.34" value={panelNode.data?.company?.change || ""} onChange={(e) => { const val = parseFloat(e.target.value) || 0; const newData = { ...panelNode.data, company: { ...panelNode.data?.company, change: val } }; setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, data: newData } : n) } : null); setPanelNode((p) => p ? { ...p, data: newData } : null); }} onBlur={() => board && updateNode(board.id, panelNode.id, { data: panelNode.data })} />
                </div>
                <div>
                  <label className="text-[9px] text-stone-600 uppercase">Change (%)</label>
                  <input type="number" step="0.01" className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-white outline-none" placeholder="1.33" value={panelNode.data?.company?.changePercent || ""} onChange={(e) => { const val = parseFloat(e.target.value) || 0; const newData = { ...panelNode.data, company: { ...panelNode.data?.company, changePercent: val } }; setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, data: newData } : n) } : null); setPanelNode((p) => p ? { ...p, data: newData } : null); }} onBlur={() => board && updateNode(board.id, panelNode.id, { data: panelNode.data })} />
                </div>
              </div>
            </div>
          )}

          {/* ========== CHART MANUAL CONTROLS ========== */}
          {panelNode.type === "chart" && (
            <div className="p-3 border-b border-stone-800 space-y-3">
              <div>
                <div className="text-[10px] text-stone-500 uppercase mb-2">Chart Type</div>
                <div className="flex gap-1">
                  {(["line", "area", "bar"] as ChartConfig["chartType"][]).map((type) => (
                    <button key={type} onClick={async () => { const currentChart = panelNode.data?.chart || { chartType: "line" as const, timeframe: "1M" as const }; const newData = { ...panelNode.data, chart: { ...currentChart, chartType: type } as ChartConfig }; await updateNode(board.id, panelNode.id, { data: newData }); setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, data: newData } : n) } : null); setPanelNode(prev => prev ? { ...prev, data: newData } : null); }} className={`flex-1 py-1.5 text-[10px] rounded capitalize ${panelNode.data?.chart?.chartType === type ? "bg-green-600 text-white" : "bg-stone-800 text-stone-400"}`}>{type}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-stone-500 uppercase mb-2">Timeframe</div>
                <div className="flex gap-1">
                  {(["1D", "1W", "1M", "3M", "6M", "1Y"] as ChartConfig["timeframe"][]).map((tf) => (
                    <button key={tf} onClick={() => handleTimeframeChange(tf)} className={`flex-1 py-1.5 text-[9px] rounded ${panelNode.data?.chart?.timeframe === tf ? "bg-green-600 text-white" : "bg-stone-800 text-stone-400"}`}>{tf}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] text-stone-600 uppercase">Ticker Symbol</label>
                <input className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-white outline-none mt-1" placeholder="AAPL" value={panelNode.data?.chart?.ticker || ""} onChange={async (e) => { const val = e.target.value.toUpperCase(); const newData = { ...panelNode.data, chart: { ...panelNode.data?.chart, ticker: val } }; setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, data: newData } : n) } : null); setPanelNode((p) => p ? { ...p, data: newData } : null); }} onBlur={async () => { await updateNode(board.id, panelNode.id, { data: panelNode.data }); if (panelNode.data?.chart?.ticker) { const ticker = panelNode.data.chart.ticker; const timeframe = panelNode.data.chart.timeframe || "1M"; const cacheKey = `${panelNode.id}_${ticker}_${timeframe}`; const data = await getChartData(ticker, timeframe); setChartDataMap(prev => ({ ...prev, [cacheKey]: data })); } }} />
              </div>
              <div>
                <label className="text-[9px] text-stone-600 uppercase">Chart Title</label>
                <input className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-white outline-none mt-1" placeholder="Price Chart" value={panelNode.data?.chart?.title || ""} onChange={(e) => { const val = e.target.value; const newData = { ...panelNode.data, chart: { ...panelNode.data?.chart, title: val } }; setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, data: newData } : n) } : null); setPanelNode((p) => p ? { ...p, data: newData } : null); }} onBlur={() => board && updateNode(board.id, panelNode.id, { data: panelNode.data })} />
              </div>
            </div>
          )}

          {/* ========== METRIC MANUAL CONTROLS ========== */}
          {panelNode.type === "metric" && (
            <div className="p-3 border-b border-stone-800 space-y-3">
              <div className="text-[10px] text-stone-500 uppercase mb-2">Metric Settings</div>
              <div>
                <label className="text-[9px] text-stone-600 uppercase">Label</label>
                <input className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-white outline-none mt-1" placeholder="Stock Price" value={panelNode.data?.metric?.label || ""} onChange={async (e) => { const val = e.target.value; const newData = { ...panelNode.data, metric: { ...panelNode.data?.metric, label: val } }; setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, data: newData } : n) } : null); setPanelNode((p) => p ? { ...p, data: newData } : null); }} onBlur={async (e) => { const val = e.target.value; const newData = { ...panelNode.data, metric: { ...panelNode.data?.metric, label: val } }; board && await updateNode(board.id, panelNode.id, { data: newData }); }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-stone-600 uppercase">Value</label>
                  <input className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-white outline-none mt-1" placeholder="$178.50" value={panelNode.data?.metric?.value || ""} onChange={async (e) => { const val = e.target.value; const newData = { ...panelNode.data, metric: { ...panelNode.data?.metric, value: val } }; setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, data: newData } : n) } : null); setPanelNode((p) => p ? { ...p, data: newData } : null); }} onBlur={async (e) => { const val = e.target.value; const newData = { ...panelNode.data, metric: { ...panelNode.data?.metric, value: val } }; board && await updateNode(board.id, panelNode.id, { data: newData }); }} />
                </div>
                <div>
                  <label className="text-[9px] text-stone-600 uppercase">Unit</label>
                  <input className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-white outline-none mt-1" placeholder="USD" value={panelNode.data?.metric?.unit || ""} onChange={async (e) => { const val = e.target.value; const newData = { ...panelNode.data, metric: { ...panelNode.data?.metric, unit: val } }; setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, data: newData } : n) } : null); setPanelNode((p) => p ? { ...p, data: newData } : null); }} onBlur={async (e) => { const val = e.target.value; const newData = { ...panelNode.data, metric: { ...panelNode.data?.metric, unit: val } }; board && await updateNode(board.id, panelNode.id, { data: newData }); }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-stone-600 uppercase">Trend</label>
                  <select className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-white outline-none mt-1" value={panelNode.data?.metric?.trend || "neutral"} onChange={async (e) => { const val = e.target.value as "up" | "down" | "neutral"; const newData = { ...panelNode.data, metric: { ...panelNode.data?.metric, trend: val } }; await updateNode(board.id, panelNode.id, { data: newData }); setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, data: newData } : n) } : null); setPanelNode((p) => p ? { ...p, data: newData } : null); }}>
                    <option value="up">Up</option>
                    <option value="down">Down</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-stone-600 uppercase">Change %</label>
                  <input type="number" step="0.01" className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-white outline-none mt-1" placeholder="1.33" value={panelNode.data?.metric?.changePercent ?? ""} onChange={async (e) => { const val = e.target.value === "" ? undefined : parseFloat(e.target.value); const newData = { ...panelNode.data, metric: { ...panelNode.data?.metric, changePercent: val } }; setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, data: newData } : n) } : null); setPanelNode((p) => p ? { ...p, data: newData } : null); }} onBlur={async (e) => { const val = e.target.value === "" ? undefined : parseFloat(e.target.value); const newData = { ...panelNode.data, metric: { ...panelNode.data?.metric, changePercent: val } }; board && await updateNode(board.id, panelNode.id, { data: newData }); }} />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-stone-600 uppercase">Ticker (optional)</label>
                <input className="w-full bg-stone-900 border border-stone-800 rounded px-2 py-1.5 text-xs text-white outline-none mt-1" placeholder="AAPL" value={panelNode.data?.metric?.ticker || ""} onChange={async (e) => { const val = e.target.value.toUpperCase(); const newData = { ...panelNode.data, metric: { ...panelNode.data?.metric, ticker: val } }; setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, data: newData } : n) } : null); setPanelNode((p) => p ? { ...p, data: newData } : null); }} onBlur={async (e) => { const val = e.target.value.toUpperCase(); const newData = { ...panelNode.data, metric: { ...panelNode.data?.metric, ticker: val } }; board && await updateNode(board.id, panelNode.id, { data: newData }); }} />
              </div>
            </div>
          )}

          {/* Chat Section - for research, company, and chart nodes */}
          {["research", "chat", "company", "chart"].includes(panelNode.type || "research") && (
            <>
              {/* Context for research nodes */}
              {(panelNode.type === "research" || !panelNode.type) && (
                <textarea className="mx-3 mt-3 p-2 bg-stone-900 border border-stone-800 rounded text-xs text-stone-400 outline-none resize-none h-16" placeholder="Research context..." value={panelNode.summary} onChange={(e) => { const val = e.target.value; setBoard((b) => b ? { ...b, nodes: b.nodes.map((n) => n.id === panelNode.id ? { ...n, summary: val } : n) } : null); setPanelNode((p) => p ? { ...p, summary: val } : null); }} onBlur={async (e) => { const val = e.target.value; board && await updateNode(board.id, panelNode.id, { summary: val }); }} />
              )}

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {panelNode.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30"><I.Zap /><p className="text-[10px] mt-2">Ask the AI to research, create charts, metrics & more</p></div>
                ) : (
                  panelNode.messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[90%] rounded-lg px-3 py-2 text-[11px] leading-relaxed ${m.role === "user" ? "bg-stone-800 text-stone-100" : "bg-stone-900 border border-stone-800 text-stone-400"}`}>
                        {m.role === "user" ? (
                          m.content || <span className="opacity-50">...</span>
                        ) : (
                          m.content ? <MarkdownText content={m.content} /> : <span className="opacity-50">...</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Model Selector */}
              <div className="px-3 py-2 border-t border-stone-800">
                <div className="relative">
                  <button
                    onClick={() => setShowModelSelector(!showModelSelector)}
                    className="w-full flex items-center justify-between gap-2 px-2 py-1.5 bg-stone-900 border border-stone-800 rounded text-[10px] text-stone-400 hover:border-stone-700"
                  >
                    <div className="flex items-center gap-2">
                      <I.Cpu />
                      <span className="text-stone-300">{selectedModel}</span>
                      <span className="text-stone-600">({selectedProvider})</span>
                    </div>
                    <I.ChevronDown />
                  </button>

                  {showModelSelector && aiModels && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-stone-900 border border-stone-800 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                      {/* Groq Models */}
                      {aiModels.models.groq.length > 0 && (
                        <div>
                          <div className="px-3 py-1.5 text-[9px] uppercase font-bold text-stone-500 bg-stone-950 sticky top-0">Groq (Fast)</div>
                          {aiModels.models.groq.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => { setSelectedProvider("groq"); setSelectedModel(m.id); setShowModelSelector(false); }}
                              className={`w-full text-left px-3 py-2 hover:bg-stone-800 flex items-center justify-between ${selectedModel === m.id && selectedProvider === "groq" ? "bg-stone-800" : ""}`}
                            >
                              <div>
                                <div className="text-[11px] text-stone-200">{m.name}</div>
                                <div className="text-[9px] text-stone-500">{m.description}</div>
                              </div>
                              {selectedModel === m.id && selectedProvider === "groq" && <I.Check />}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* OpenAI Models */}
                      {aiModels.models.openai.length > 0 && (
                        <div>
                          <div className="px-3 py-1.5 text-[9px] uppercase font-bold text-stone-500 bg-stone-950 sticky top-0">OpenAI</div>
                          {aiModels.models.openai.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => { setSelectedProvider("openai"); setSelectedModel(m.id); setShowModelSelector(false); }}
                              className={`w-full text-left px-3 py-2 hover:bg-stone-800 flex items-center justify-between ${selectedModel === m.id && selectedProvider === "openai" ? "bg-stone-800" : ""}`}
                            >
                              <div>
                                <div className="text-[11px] text-stone-200">{m.name}</div>
                                <div className="text-[9px] text-stone-500">{m.description}</div>
                              </div>
                              {selectedModel === m.id && selectedProvider === "openai" && <I.Check />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 border-t border-stone-800">
                <div className="text-[9px] text-stone-600 mb-2 flex items-center gap-1">
                  <I.Sparkles /> Try: &quot;Create a chart for AAPL&quot; or &quot;Research OpenAI and show metrics&quot;
                </div>

                {/* Mode Toggle */}
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setResearchMode(!researchMode)}
                    className={`flex-1 text-[10px] py-1 px-2 rounded border transition-colors ${researchMode ? "bg-purple-900/30 border-purple-500/50 text-purple-300" : "bg-stone-900 border-stone-800 text-stone-500 hover:border-stone-700"}`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${researchMode ? "bg-purple-400 shadow-[0_0_5px_rgba(168,85,247,0.5)]" : "bg-stone-600"}`} />
                      {researchMode ? "Research Mode (Deep finding)" : "Chat Mode (Quick)"}
                    </div>
                  </button>
                </div>

                {aiStatus && (
                  <div className="mb-2 flex items-center gap-2 px-2 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded text-orange-400 text-xs animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" />
                    {aiStatus}
                  </div>
                )}
                <div className="relative">
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendChat()} placeholder={panelNode.type === "chart" ? "Modify chart..." : "Ask AI to research, create nodes..."} disabled={isChatting} className="w-full bg-stone-900 border border-stone-800 rounded-lg py-2 pl-3 pr-9 text-xs text-stone-200 outline-none focus:border-stone-600" />
                  <button onClick={handleSendChat} disabled={!chatInput.trim() || isChatting} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-orange-500 disabled:opacity-30"><I.Send /></button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Investment Memo Modal */}
      {showMemoModal && generatedMemo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <I.FileDocument />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Investment Memo</h2>
                  <p className="text-xs text-stone-500">Generated {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMemoModal(false)} 
                className="text-stone-500 hover:text-white p-2 hover:bg-stone-800 rounded-lg transition-colors"
              >
                <I.X />
              </button>
            </div>

            {/* Modal Body - Scrollable Memo Preview */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="prose prose-invert prose-sm max-w-none">
                <MarkdownText content={generatedMemo} />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-stone-800 bg-stone-900/50">
              <p className="text-xs text-stone-500">
                A text node with this memo has also been added to your whiteboard.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMemoModal(false)}
                  className="px-4 py-2 text-xs text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { handleDownloadMemo(); setShowMemoModal(false); }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <I.Download />
                  Download .txt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
