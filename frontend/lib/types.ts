export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

// AI Provider and Model types
export type AIProvider = "groq" | "openai";

export type AIModel = {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
};

export type AIModelsResponse = {
  models: {
    groq: AIModel[];
    openai: AIModel[];
  };
  default_provider: AIProvider;
  default_model: string;
};

export type AIConfig = {
  provider: AIProvider;
  model: string;
};

// AI Action types (from streaming response)
export type AIActionType =
  | "create_node"
  | "create_chart"
  | "create_metric"
  | "create_company"
  | "create_research"
  | "update_node"
  | "connect_nodes"
  | "generate_map";

export type AIAction = {
  type: AIActionType;
  data: {
    title?: string;
    node_type?: NodeType;
    summary?: string;
    initial_query?: string;
    chart?: ChartConfig;
    metric?: MetricConfig;
    company?: CompanyConfig;
    content?: string;
    source_title?: string;
    target_title?: string;
    relationship?: string;
    topic?: string;
    depth?: string;
    data?: NodeData;
  };
};

// Finance-focused node types
export type NodeType =
  | "research"   // Simple AI research chat
  | "company"    // Company supreme node (parent)
  | "chart"      // Interactive graph node
  | "metric"     // KPI display
  | "text"       // Plain text/notes
  | "image"      // Uploaded images
  | "document";  // Uploaded documents

// Chart configuration
export type ChartConfig = {
  chartType?: "line" | "bar" | "area" | "candlestick";
  ticker?: string;
  timeframe?: "1D" | "1W" | "1M" | "3M" | "6M" | "1Y";
  title?: string;
  showVolume?: boolean;
  overlays?: ("sma20" | "sma50" | "ema")[];
  // Pending changes from AI (require confirmation)
  pendingChanges?: Partial<ChartConfig>;
};

// Company research configuration
export type CompanyConfig = {
  ticker?: string;
  name?: string;
  sector?: string;
  marketCap?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  description?: string;
  metrics?: {
    label: string;
    value: string;
    trend?: "up" | "down" | "neutral";
  }[];
};

// Metric display configuration
export type MetricType = "price" | "pe_ratio" | "market_cap" | "volume" | "high_52w" | "low_52w" | "eps" | "dividend" | "custom";

export type MetricConfig = {
  metricType?: MetricType;
  label?: string;
  value?: string;
  previousValue?: string;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  changePercent?: number;
  ticker?: string;
  // Alert threshold
  alertThreshold?: number;
  alertCondition?: "above" | "below";
  alertEnabled?: boolean;
};

export type NodeData = {
  // For text nodes
  content?: string;
  // For image nodes
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  // For document nodes
  documentUrl?: string;
  documentName?: string;
  documentSize?: number;
  // For chart nodes
  chart?: ChartConfig;
  // For company nodes
  company?: CompanyConfig;
  // For metric nodes
  metric?: MetricConfig;
  // Generic
  collapsed?: boolean;
  [key: string]: unknown;
};

export type WhiteboardNode = {
  id: string;
  title: string;
  summary: string;
  x: number;
  y: number;
  type: NodeType;
  data: NodeData;
  parentId: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
};

export type WhiteboardEdge = {
  id: string;
  source: string;
  target: string;
};

export type Whiteboard = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  nodes: WhiteboardNode[];
  edges: WhiteboardEdge[];
};

export type WhiteboardListItem = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
  edgeCount: number;
};

export type UploadImageResponse = {
  url: string;
  publicId: string;
  width: number;
  height: number;
};

export type UploadDocumentResponse = {
  url: string;
  publicId: string;
  originalName: string;
  size: number;
};
