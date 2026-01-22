import type {
  Whiteboard,
  WhiteboardListItem,
  WhiteboardNode,
  NodeType,
  NodeData,
  UploadImageResponse,
  UploadDocumentResponse,
  AIModelsResponse,
  AIAction,
  AIProvider,
} from "./types";

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return (await res.json()) as T;
}

// ==========================
// Whiteboards
// ==========================

export async function listWhiteboards(): Promise<WhiteboardListItem[]> {
  const data = await apiFetch<{ whiteboards: WhiteboardListItem[] }>("/whiteboards");
  return data.whiteboards;
}

export async function createWhiteboard(input?: { title?: string; description?: string }): Promise<Whiteboard> {
  const data = await apiFetch<{ whiteboard: Whiteboard }>("/whiteboards", {
    method: "POST",
    body: JSON.stringify(input || {}),
  });
  return data.whiteboard;
}

export async function getWhiteboard(id: string): Promise<Whiteboard> {
  const data = await apiFetch<{ whiteboard: Whiteboard }>(`/whiteboards/${encodeURIComponent(id)}`);
  return data.whiteboard;
}

export async function updateWhiteboard(id: string, input: { title?: string; description?: string }): Promise<Whiteboard> {
  const data = await apiFetch<{ whiteboard: Whiteboard }>(`/whiteboards/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.whiteboard;
}

export async function deleteWhiteboard(id: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/whiteboards/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ==========================
// Nodes
// ==========================

export type CreateNodeInput = {
  title?: string;
  summary?: string;
  x?: number;
  y?: number;
  type?: NodeType;
  data?: NodeData;
  parentId?: string | null;
  width?: number | null;
  height?: number | null;
};

export async function createNode(boardId: string, input?: CreateNodeInput): Promise<WhiteboardNode> {
  const data = await apiFetch<{ node: WhiteboardNode }>(`/whiteboards/${encodeURIComponent(boardId)}/nodes`, {
    method: "POST",
    body: JSON.stringify(input || {}),
  });
  return data.node;
}

export type UpdateNodeInput = Partial<Pick<WhiteboardNode, "title" | "summary" | "x" | "y" | "data" | "parentId" | "width" | "height">>;

export async function updateNode(boardId: string, nodeId: string, input: UpdateNodeInput): Promise<WhiteboardNode> {
  const data = await apiFetch<{ node: WhiteboardNode }>(
    `/whiteboards/${encodeURIComponent(boardId)}/nodes/${encodeURIComponent(nodeId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  return data.node;
}

export async function deleteNode(boardId: string, nodeId: string): Promise<void> {
  await apiFetch<{ success: boolean }>(
    `/whiteboards/${encodeURIComponent(boardId)}/nodes/${encodeURIComponent(nodeId)}`,
    { method: "DELETE" },
  );
}

// ==========================
// Edges
// ==========================

export async function createEdge(boardId: string, input: { source: string; target: string }): Promise<{ id: string; source: string; target: string }> {
  const data = await apiFetch<{ edge: { id: string; source: string; target: string } }>(`/whiteboards/${encodeURIComponent(boardId)}/edges`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.edge;
}

export async function deleteEdge(boardId: string, edgeId: string): Promise<void> {
  await apiFetch<{ success: boolean }>(
    `/whiteboards/${encodeURIComponent(boardId)}/edges/${encodeURIComponent(edgeId)}`,
    { method: "DELETE" },
  );
}

// ==========================
// Chat (Streaming) with AI Actions
// ==========================

// Parse AI actions from streamed content
function parseAIActions(content: string): { text: string; actions: AIAction[] } {
  const actions: AIAction[] = [];
  const actionRegex = /<<<ACTION:([\s\S]*?):ACTION>>>/g;
  let text = content;
  let match;

  while ((match = actionRegex.exec(content)) !== null) {
    try {
      const action = JSON.parse(match[1]) as AIAction;
      actions.push(action);
      text = text.replace(match[0], '');
    } catch (e) {
      console.error("Failed to parse AI action:", e);
    }
  }

  return { text: text.trim(), actions };
}

export type ChatCallbacks = {
  onChunk: (chunk: string) => void;
  onAction?: (action: AIAction) => void | Promise<void>;
  onStatus?: (status: string) => void;
  onComplete?: (fullText: string, actions: AIAction[]) => void;
};

export async function sendNodeChat(
  boardId: string,
  nodeId: string,
  message: string,
  callbacks: ChatCallbacks | ((chunk: string) => void),
  aiConfig?: { provider?: AIProvider; model?: string; mode?: "chat" | "research" }
): Promise<void> {
  // Support both old callback style and new object style
  const { onChunk, onAction, onStatus, onComplete } = typeof callbacks === 'function'
    ? { onChunk: callbacks, onAction: undefined, onStatus: undefined, onComplete: undefined }
    : callbacks;

  const res = await fetch(`${apiBaseUrl()}/whiteboards/${encodeURIComponent(boardId)}/nodes/${encodeURIComponent(nodeId)}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message,
      provider: aiConfig?.provider || "groq",
      model: aiConfig?.model || null,
      mode: aiConfig?.mode || "chat",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  // Buffers for handling streamed content
  let fullContent = "";           // Complete stream content
  let processingBuffer = "";      // Buffer for accumulating content to process
  let displayBuffer = "";         // Buffer for text to display (without tags)
  const processedActions: AIAction[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    fullContent += chunk;
    processingBuffer += chunk;

    // Process buffer - look for <<<TAG:...:TAG>>> patterns
    let searchStart = 0;
    while (true) {
      const tagStart = processingBuffer.indexOf("<<<", searchStart);

      if (tagStart === -1) {
        // No tag start found - everything before is safe text
        if (searchStart === 0) {
          // No partial tag in buffer, send all text except potential partial at end
          const safeEnd = processingBuffer.lastIndexOf("\n");
          if (safeEnd > 0) {
            const safeText = processingBuffer.substring(0, safeEnd + 1);
            displayBuffer += safeText;
            processingBuffer = processingBuffer.substring(safeEnd + 1);
          }
        }
        break;
      }

      // Determine tag type
      let tagType: "ACTION" | "STATUS" | null = null;
      if (processingBuffer.startsWith("<<<ACTION:", tagStart)) tagType = "ACTION";
      else if (processingBuffer.startsWith("<<<STATUS:", tagStart)) tagType = "STATUS";

      if (!tagType) {
        // Not a known tag (or incomplete prefix), skip this <<<
        searchStart = tagStart + 3;
        continue;
      }

      const tagEndMarker = `:${tagType}>>>`;
      const tagEnd = processingBuffer.indexOf(tagEndMarker, tagStart);

      if (tagEnd === -1) {
        // Incomplete tag - keep in buffer but send text before it
        if (tagStart > 0) {
          const textBefore = processingBuffer.substring(0, tagStart);
          displayBuffer += textBefore;
          processingBuffer = processingBuffer.substring(tagStart);
        }
        break;
      }

      // Found complete tag!
      const fullTagEnd = tagEnd + tagEndMarker.length;
      const contentStr = processingBuffer.substring(tagStart + `<<<${tagType}:`.length, tagEnd);

      // Add text before tag to display buffer
      if (tagStart > 0) {
        displayBuffer += processingBuffer.substring(0, tagStart);
      }

      if (tagType === "ACTION") {
        try {
          const action = JSON.parse(contentStr) as AIAction;
          console.log("[API] Parsed action:", action.type);
          processedActions.push(action);
          if (onAction) await onAction(action);

          // Inject visual tool card into the chat stream
          let toolTitle = action.data.title || action.type;
          if (action.type === "create_chart") toolTitle = `Chart: ${action.data.chart?.ticker || "?"}`;
          else if (action.type === "create_company") toolTitle = `Company: ${action.data.company?.ticker || "?"}`;
          else if (action.type === "create_metric") toolTitle = `Metric: ${action.data.metric?.label || "?"}`;

          displayBuffer += `\n[[TOOL:${action.type}:${toolTitle}]]\n`;

        } catch (e) {
          console.error("[API] Failed to parse action JSON:", e);
        }
      } else if (tagType === "STATUS") {
        console.log("[API] Status update:", contentStr);
        if (onStatus) onStatus(contentStr);

        // Optional: Also show status in chat history?
        // displayBuffer += `\n[[STATUS:${contentStr}]]\n`; 
      }

      // Remove processed tag from buffer
      processingBuffer = processingBuffer.substring(fullTagEnd);
      searchStart = 0; // Reset search in new buffer
    }

    // Send accumulated display text to onChunk
    if (displayBuffer) {
      onChunk(displayBuffer);
      displayBuffer = "";
    }
  }

  // Handle any remaining text in buffers
  if (processingBuffer && !processingBuffer.includes("<<<")) {
    onChunk(processingBuffer);
  }

  // Final processing
  console.log("[API] Stream complete. Total content:", fullContent.length, "chars, Actions found:", processedActions.length);

  // The original parseAIActions fallback is removed as the new streaming logic handles all tags.
  // onComplete should now be called with the full text (excluding tags) and the actions processed.
  if (onComplete) {
    const { text, actions } = parseAIActions(fullContent);
    // Merge with already processed actions (dedupe by checking if same type & title)
    const allActions = [...processedActions];
    for (const action of actions) {
      const isDupe = processedActions.some(p =>
        p.type === action.type &&
        p.data?.title === action.data?.title
      );
      if (!isDupe) {
        allActions.push(action);
      }
    }
    console.log("[API] Final actions:", allActions.length);
    onComplete(text, allActions);
  }
}

// ==========================
// AI Models
// ==========================

export async function getAIModels(): Promise<AIModelsResponse> {
  const data = await apiFetch<AIModelsResponse>("/ai/models");
  return data;
}

// ==========================
// File Uploads
// ==========================

export async function uploadImage(file: File): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${apiBaseUrl()}/upload/image`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Upload failed: ${res.status}`);
  }

  return (await res.json()) as UploadImageResponse;
}

export async function uploadDocument(file: File): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${apiBaseUrl()}/upload/document`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Upload failed: ${res.status}`);
  }

  return (await res.json()) as UploadDocumentResponse;
}

// ==========================
// AI Map Generation
// ==========================

export async function generateMap(boardId: string, topic: string): Promise<{ success: boolean; nodes: WhiteboardNode[] }> {
  const data = await apiFetch<{ success: boolean; nodes: WhiteboardNode[] }>(`/whiteboards/${encodeURIComponent(boardId)}/generate-map`, {
    method: "POST",
    body: JSON.stringify({ topic }),
  });
  return data;
}

// ==========================
// Finance Data
// ==========================

export type CompanyData = {
  ticker: string;
  name: string;
  sector: string;
  marketCap: string;
  price: number;
  change: number;
  changePercent: number;
  description: string;
  metrics?: { label: string; value: string; trend: string }[];
};

export type ChartDataPoint = {
  timestamp: string;
  price: number;
  volume: number;
};

export async function getCompany(ticker: string): Promise<CompanyData> {
  const data = await apiFetch<{ company: CompanyData }>(`/finance/company/${encodeURIComponent(ticker)}`);
  return data.company;
}

export async function searchCompanies(query: string): Promise<CompanyData[]> {
  const data = await apiFetch<{ results: CompanyData[] }>(`/finance/search?q=${encodeURIComponent(query)}`);
  return data.results;
}

export async function getChartData(ticker: string, timeframe?: string): Promise<ChartDataPoint[]> {
  const tf = timeframe || "1M";
  const data = await apiFetch<{ ticker: string; timeframe: string; data: ChartDataPoint[] }>(`/finance/chart/${encodeURIComponent(ticker)}?timeframe=${tf}`);
  return data.data;
}

// ==========================
// Master AI Commands (Board-level)
// ==========================

export async function sendMasterAICommand(
  boardId: string,
  command: string,
  callbacks: ChatCallbacks,
  aiConfig?: { provider?: AIProvider; model?: string }
): Promise<void> {
  const { onChunk, onAction, onStatus, onComplete } = callbacks;

  const res = await fetch(`${apiBaseUrl()}/whiteboards/${encodeURIComponent(boardId)}/nodes/master/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message: command,
      provider: aiConfig?.provider || "groq",
      model: aiConfig?.model || null,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let fullContent = "";
  const processedActions: AIAction[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    fullContent += chunk;

    // Parse STATUS markers
    const statusRegex = /<<<STATUS:(.*?):STATUS>>>/g;
    let statusMatch;
    while ((statusMatch = statusRegex.exec(chunk)) !== null) {
      if (onStatus) onStatus(statusMatch[1]);
    }

    // Parse ACTION markers
    const actionRegex = /<<<ACTION:([\s\S]*?):ACTION>>>/g;
    let actionMatch;
    while ((actionMatch = actionRegex.exec(chunk)) !== null) {
      try {
        const action = JSON.parse(actionMatch[1]) as AIAction;
        console.log("[MASTER AI] Action:", action.type);
        processedActions.push(action);
        if (onAction) await onAction(action);
      } catch (e) {
        console.error("[MASTER AI] Failed to parse action:", e);
      }
    }

    // Send text chunks (filtering out markers)
    const cleanChunk = chunk
      .replace(/<<<STATUS:.*?:STATUS>>>/g, '')
      .replace(/<<<ACTION:[\s\S]*?:ACTION>>>/g, '');
    if (cleanChunk && onChunk) onChunk(cleanChunk);
  }

  if (onComplete) onComplete(fullContent, processedActions);
}

