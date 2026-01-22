import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import YahooFinance from "yahoo-finance2";

// Initialize Yahoo Finance
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

import {
  appendNodeMessages,
  createEdge,
  createNode,
  createWhiteboard,
  deleteNode,
  deleteEdge,
  deleteWhiteboard,
  getNodeMessages,
  getWhiteboard,
  listWhiteboards,
  storageMode,
  updateNode,
  updateWhiteboard,
} from "./storage/index.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 5050;
const AI_BASE_URL = (process.env.AI_BASE_URL || "http://localhost:8000").trim();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Multer for file uploads (memory storage for Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

function nowIso() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

// ==========================
// Context Extraction Helpers
// ==========================

/**
 * Extract meaningful context from a node based on its type.
 * Supports all node types: research, chat, company, chart, metric, text, image, document
 */
function extractNodeContext(node) {
  if (!node) return null;
  
  const nodeType = node.type || "research";
  const contextParts = [];
  
  // Common fields
  if (node.title) {
    contextParts.push(`**${node.title}**`);
  }
  
  switch (nodeType) {
    case "research":
    case "chat": {
      // Research/chat nodes: include summary and recent conversation
      if (node.summary) {
        contextParts.push(`Summary: ${node.summary}`);
      }
      // Include last 3 messages for conversation context
      if (node.messages && node.messages.length > 0) {
        const recentMessages = node.messages.slice(-6); // Last 3 exchanges (user + assistant)
        const conversationSummary = recentMessages
          .map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content.slice(0, 200)}${m.content.length > 200 ? "..." : ""}`)
          .join("\n");
        contextParts.push(`Recent conversation:\n${conversationSummary}`);
      }
      break;
    }
    
    case "company": {
      // Company nodes: include financial data
      const company = node.data?.company;
      if (company) {
        const companyInfo = [];
        if (company.ticker) companyInfo.push(`Ticker: ${company.ticker}`);
        if (company.name) companyInfo.push(`Name: ${company.name}`);
        if (company.sector) companyInfo.push(`Sector: ${company.sector}`);
        if (company.marketCap) companyInfo.push(`Market Cap: ${company.marketCap}`);
        if (company.price !== undefined) companyInfo.push(`Price: $${company.price}`);
        if (company.changePercent !== undefined) {
          const sign = company.changePercent >= 0 ? "+" : "";
          companyInfo.push(`Change: ${sign}${company.changePercent.toFixed(2)}%`);
        }
        if (company.description) {
          companyInfo.push(`Description: ${company.description.slice(0, 300)}${company.description.length > 300 ? "..." : ""}`);
        }
        if (company.metrics && company.metrics.length > 0) {
          const metricsStr = company.metrics
            .map(m => `${m.label}: ${m.value}`)
            .join(", ");
          companyInfo.push(`Key Metrics: ${metricsStr}`);
        }
        contextParts.push(companyInfo.join("\n"));
      }
      break;
    }
    
    case "chart": {
      // Chart nodes: include chart configuration and ticker
      const chart = node.data?.chart;
      if (chart) {
        const chartInfo = [];
        if (chart.ticker) chartInfo.push(`Ticker: ${chart.ticker}`);
        if (chart.chartType) chartInfo.push(`Chart Type: ${chart.chartType}`);
        if (chart.timeframe) chartInfo.push(`Timeframe: ${chart.timeframe}`);
        if (chart.title) chartInfo.push(`Chart Title: ${chart.title}`);
        contextParts.push(`[Chart] ${chartInfo.join(", ")}`);
      }
      break;
    }
    
    case "metric": {
      // Metric nodes: include the metric data
      const metric = node.data?.metric;
      if (metric) {
        const metricInfo = [];
        if (metric.label) metricInfo.push(`Metric: ${metric.label}`);
        if (metric.value) metricInfo.push(`Value: ${metric.value}`);
        if (metric.ticker) metricInfo.push(`Ticker: ${metric.ticker}`);
        if (metric.trend) metricInfo.push(`Trend: ${metric.trend}`);
        if (metric.changePercent !== undefined) {
          metricInfo.push(`Change: ${metric.changePercent >= 0 ? "+" : ""}${metric.changePercent.toFixed(2)}%`);
        }
        contextParts.push(metricInfo.join(", "));
      }
      break;
    }
    
    case "text": {
      // Text nodes: include the content
      const content = node.data?.content;
      if (content) {
        // Truncate long text content
        const truncated = content.slice(0, 500);
        contextParts.push(`Notes:\n${truncated}${content.length > 500 ? "..." : ""}`);
      }
      break;
    }
    
    case "image": {
      // Image nodes: mention that there's an image
      if (node.data?.imageUrl) {
        contextParts.push(`[Image attached: ${node.title || "Untitled image"}]`);
      }
      break;
    }
    
    case "document": {
      // Document nodes: include document info
      const docName = node.data?.documentName || node.title;
      if (docName) {
        contextParts.push(`[Document: ${docName}]`);
      }
      break;
    }
    
    default: {
      // Fallback for any unknown types
      if (node.summary) {
        contextParts.push(node.summary);
      }
    }
  }
  
  if (contextParts.length === 0) return null;
  
  return {
    nodeId: node.id,
    nodeType: nodeType,
    context: contextParts.join("\n")
  };
}

/**
 * Get all nodes connected to a given node (both incoming and outgoing edges).
 * Returns an array of connected nodes with their extracted context.
 */
function getConnectedNodesContext(board, nodeId) {
  if (!board || !board.edges || !board.nodes) return [];
  
  // Find all edges connected to this node (both directions)
  const connectedNodeIds = new Set();
  
  for (const edge of board.edges) {
    if (edge.source === nodeId) {
      connectedNodeIds.add(edge.target);
    }
    if (edge.target === nodeId) {
      connectedNodeIds.add(edge.source);
    }
  }
  
  // Extract context from each connected node
  const connectedContexts = [];
  
  for (const connectedId of connectedNodeIds) {
    const connectedNode = board.nodes.find(n => n.id === connectedId);
    if (connectedNode) {
      const context = extractNodeContext(connectedNode);
      if (context) {
        connectedContexts.push(context);
      }
    }
  }
  
  return connectedContexts;
}

/**
 * Build a complete context string including connected nodes.
 */
function buildFullContext(board, node) {
  const parts = [];
  
  // 1. Current node context
  parts.push("=== CURRENT NODE ===");
  if (node.title) parts.push(`Topic: ${node.title}`);
  if (node.summary) parts.push(`Summary: ${node.summary}`);
  
  // 2. Connected nodes context
  const connectedContexts = getConnectedNodesContext(board, node.id);
  
  if (connectedContexts.length > 0) {
    parts.push("\n=== CONNECTED NODES (Related Context) ===");
    
    for (const ctx of connectedContexts) {
      parts.push(`\n[${ctx.nodeType.toUpperCase()}]`);
      parts.push(ctx.context);
    }
    
    parts.push("\n=== END CONNECTED CONTEXT ===");
  }
  
  return parts.join("\n");
}

// ==========================
// Health Check
// ==========================
app.get("/health", (_req, res) => {
  res.json({ ok: true, storage: storageMode() });
});

// ==========================
// Whiteboards CRUD
// ==========================
app.get("/whiteboards", async (_req, res, next) => {
  try {
    const list = await listWhiteboards();
    res.json({ whiteboards: list });
  } catch (e) {
    next(e);
  }
});

app.post("/whiteboards", async (req, res, next) => {
  try {
    const title = typeof req.body?.title === "string" && req.body.title.trim() ? req.body.title.trim() : "Untitled Whiteboard";
    const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
    const board = await createWhiteboard({ title, description });
    res.status(201).json({ whiteboard: board });
  } catch (e) {
    next(e);
  }
});

app.get("/whiteboards/:id", async (req, res, next) => {
  try {
    const board = await getWhiteboard(req.params.id);
    res.json({ whiteboard: board });
  } catch (e) {
    next(e);
  }
});

app.patch("/whiteboards/:id", async (req, res, next) => {
  try {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : undefined;
    const description = typeof req.body?.description === "string" ? req.body.description.trim() : undefined;
    const board = await updateWhiteboard(req.params.id, { title, description });
    res.json({ whiteboard: board });
  } catch (e) {
    next(e);
  }
});

app.delete("/whiteboards/:id", async (req, res, next) => {
  try {
    await deleteWhiteboard(req.params.id);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// ==========================
// Nodes CRUD
// ==========================

// Create node - now supports type and data
app.post("/whiteboards/:id/nodes", async (req, res, next) => {
  try {
    const { title, summary, x, y, type, data, parentId, width, height } = req.body || {};

    const nodeTitle = typeof title === "string" && title.trim() ? title.trim() : "New Node";
    const validTypes = ["chat", "research", "text", "image", "document", "group", "frame", "chart", "company", "metric", "table"];
    const nodeType = validTypes.includes(type) ? type : "research";

    const node = await createNode(req.params.id, {
      title: nodeTitle,
      summary: typeof summary === "string" ? summary : "",
      x: Number.isFinite(x) ? Number(x) : 200 + Math.round(Math.random() * 480),
      y: Number.isFinite(y) ? Number(y) : 140 + Math.round(Math.random() * 360),
      type: nodeType,
      data: data || {},
      parentId: typeof parentId === "string" ? parentId : null,
      width: Number.isFinite(width) ? Number(width) : null,
      height: Number.isFinite(height) ? Number(height) : null,
    });
    res.status(201).json({ node });
  } catch (e) {
    next(e);
  }
});

// Update node
app.patch("/whiteboards/:id/nodes/:nodeId", async (req, res, next) => {
  try {
    const { title, summary, x, y, data, parentId, width, height } = req.body || {};
    const node = await updateNode(req.params.id, req.params.nodeId, {
      title: typeof title === "string" ? title : undefined,
      summary: typeof summary === "string" ? summary : undefined,
      x: x,
      y: y,
      data: data,
      parentId: parentId,
      width: width,
      height: height,
    });
    res.json({ node });
  } catch (e) {
    next(e);
  }
});

// Delete node
app.delete("/whiteboards/:id/nodes/:nodeId", async (req, res, next) => {
  try {
    await deleteNode(req.params.id, req.params.nodeId);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// ==========================
// Edges CRUD
// ==========================
app.post("/whiteboards/:id/edges", async (req, res, next) => {
  try {
    const source = typeof req.body?.source === "string" ? req.body.source : "";
    const target = typeof req.body?.target === "string" ? req.body.target : "";
    if (!source || !target) {
      res.status(400).json({ error: "source and target are required" });
      return;
    }
    const edge = await createEdge(req.params.id, source, target);
    res.status(201).json({ edge });
  } catch (e) {
    next(e);
  }
});

app.delete("/whiteboards/:id/edges/:edgeId", async (req, res, next) => {
  try {
    await deleteEdge(req.params.id, req.params.edgeId);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// ==========================
// Chat / Messages
// ==========================
app.get("/whiteboards/:id/nodes/:nodeId/messages", async (req, res, next) => {
  try {
    const messages = await getNodeMessages(req.params.id, req.params.nodeId);
    res.json({ messages });
  } catch (e) {
    next(e);
  }
});

// Master AI Chat - creates nodes directly on the whiteboard without needing a specific node
app.post("/whiteboards/:id/nodes/master/chat", async (req, res, next) => {
  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const provider = typeof req.body?.provider === "string" ? req.body.provider : "groq";
    const model = typeof req.body?.model === "string" ? req.body.model : null;

    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    // Verify board exists
    await getWhiteboard(req.params.id);

    try {
      // Build request with research mode to encourage tool use
      const requestBody = { 
        query: `[WHITEBOARD COMMAND] ${message}\n\nIMPORTANT: Use your tools to create visual elements on the whiteboard. Do not just describe - actually call the tools to create charts, company cards, research nodes, etc.`,
        mode: "research",
        provider,
        model 
      };

      const aiRes = await fetch(`${AI_BASE_URL}/research`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!aiRes.ok) {
        const text = await aiRes.text().catch(() => "");
        throw new Error(`AI server error (${aiRes.status}): ${text}`);
      }

      // Stream response to client (we only care about ACTION and STATUS markers)
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");

      const reader = aiRes.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          // Only pass through STATUS and ACTION markers, filter out text
          const statusMatches = chunk.match(/<<<STATUS:.*?:STATUS>>>/g) || [];
          const actionMatches = chunk.match(/<<<ACTION:[\s\S]*?:ACTION>>>/g) || [];
          const markers = [...statusMatches, ...actionMatches].join("");
          if (markers) {
            res.write(markers);
          }
        }
      }
      res.end();
    } catch (err) {
      if (res.headersSent) {
        res.end();
      } else {
        res.status(502).json({ error: err.message });
      }
    }
  } catch (e) {
    next(e);
  }
});

app.post("/whiteboards/:id/nodes/:nodeId/chat", async (req, res, next) => {
  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const provider = typeof req.body?.provider === "string" ? req.body.provider : "groq";
    const model = typeof req.body?.model === "string" ? req.body.model : null;
    const mode = typeof req.body?.mode === "string" ? req.body.mode : "chat";

    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }
    const ts = nowIso();
    const board = await getWhiteboard(req.params.id);
    const node = board.nodes.find((n) => n.id === req.params.nodeId);
    if (!node) {
      res.status(404).json({ error: "Node not found" });
      return;
    }
    const userMessage = { id: id("msg"), role: "user", content: message, createdAt: ts };
    await appendNodeMessages(req.params.id, req.params.nodeId, [userMessage]);

    let assistantContent = "";
    try {
      // Build full context including connected nodes
      const fullContext = buildFullContext(board, node);
      
      const queryParts = [];
      queryParts.push(fullContext);
      queryParts.push(`\n=== USER MESSAGE ===`);
      queryParts.push(message);
      const query = queryParts.join("\n");

      // Build request body with optional provider/model
      const requestBody = { query, mode };
      if (provider) requestBody.provider = provider;
      if (model) requestBody.model = model;

      const aiRes = await fetch(`${AI_BASE_URL}/research`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!aiRes.ok) {
        const text = await aiRes.text().catch(() => "");
        throw new Error(`AI server error (${aiRes.status}): ${text}`);
      }

      // Stream response to client
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");

      const reader = aiRes.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          res.write(chunk);
          assistantContent += chunk;
        }
      }
      const final = decoder.decode();
      if (final) {
        res.write(final);
        assistantContent += final;
      }
      res.end();
    } catch (err) {
      if (res.headersSent) {
        res.end();
      } else {
        res.status(502).json({ error: err.message });
      }
    }

    if (assistantContent) {
      const ats = nowIso();
      const assistantMessage = { id: id("msg"), role: "assistant", content: assistantContent, createdAt: ats };
      await appendNodeMessages(req.params.id, req.params.nodeId, [assistantMessage]);
    }
  } catch (e) {
    next(e);
  }
});

// ==========================
// AI Models Endpoint (Proxy to AI Server)
// ==========================
app.get("/ai/models", async (req, res, next) => {
  try {
    const aiRes = await fetch(`${AI_BASE_URL}/models`);
    if (!aiRes.ok) {
      throw new Error(`AI server error: ${aiRes.status}`);
    }
    const data = await aiRes.json();
    res.json(data);
  } catch (e) {
    // Return fallback defaults if AI server is not available
    res.json({
      models: {
        groq: [
          { id: "qwen/qwen3-32b", name: "Qwen 3 32B (Recommended)", provider: "groq", description: "Best reasoning & function calling" },
          { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout", provider: "groq", description: "Fast, great for tool use" },
          { id: "moonshotai/kimi-k2-instruct-0905", name: "Kimi K2", provider: "groq", description: "262K context, excellent function calling" },
          { id: "openai/gpt-oss-120b", name: "GPT OSS 120B", provider: "groq", description: "OpenAI's flagship 120B - reasoning, tool use" },
          { id: "openai/gpt-oss-20b", name: "GPT OSS 20B", provider: "groq", description: "Fast 20B - reasoning, tool use" },
          { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "groq", description: "Production stable - versatile" },
        ],
        openai: [],
      },
      default_provider: "groq",
      default_model: "moonshotai/kimi-k2-instruct-0905",
    });
  }
});

// ==========================
// File Uploads (Cloudinary)
// ==========================

// Upload image
app.post("/upload/image", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "vantage-whiteboard",
          resource_type: "image"
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (e) {
    next(e);
  }
});

// Upload document (PDF, etc)
app.post("/upload/document", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "vantage-documents",
          resource_type: "raw"
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (e) {
    next(e);
  }
});

// ==========================
// AI Map Generation
// ==========================
app.post("/whiteboards/:id/generate-map", async (req, res, next) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      res.status(400).json({ error: "topic is required" });
      return;
    }

    const aiRes = await fetch(`${AI_BASE_URL}/map`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });

    if (!aiRes.ok) {
      throw new Error(`AI map generation failed: ${aiRes.status}`);
    }

    const data = await aiRes.json();
    const nodesData = data.nodes || [];
    const edgesData = data.edges || [];

    const createdNodes = [];
    const idMap = {};

    const centerX = 400;
    const centerY = 300;
    const radius = 250;
    const count = nodesData.length;

    for (let i = 0; i < count; i++) {
      const n = nodesData[i];
      const isCenter = n.label.toLowerCase() === topic.toLowerCase() || n.id.toLowerCase() === topic.toLowerCase();
      const x = isCenter ? centerX : centerX + radius * Math.cos((i / count) * 2 * Math.PI);
      const y = isCenter ? centerY : centerY + radius * Math.sin((i / count) * 2 * Math.PI);

      const newNode = await createNode(req.params.id, {
        title: n.label || n.id,
        summary: n.summary || "",
        x: Math.round(x),
        y: Math.round(y),
        type: "chat",
        data: {},
        parentId: null,
      });
      createdNodes.push(newNode);
      idMap[n.id] = newNode.id;
      idMap[n.label] = newNode.id;
    }

    for (const e of edgesData) {
      const sourceId = idMap[e.source];
      const targetId = idMap[e.target];
      if (sourceId && targetId) {
        await createEdge(req.params.id, sourceId, targetId);
      }
    }

    if (edgesData.length === 0 && createdNodes.length > 1) {
      const center = createdNodes[0];
      for (let i = 1; i < createdNodes.length; i++) {
        await createEdge(req.params.id, center.id, createdNodes[i].id);
      }
    }

    res.json({ success: true, nodes: createdNodes });
  } catch (e) {
    next(e);
  }
});

// ==========================
// Finance Data Endpoints (Real Data from Yahoo Finance)
// ==========================

// Helper to format market cap
function formatMarketCap(value) {
  if (!value) return "N/A";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

// Lookup company by ticker - REAL DATA
app.get("/finance/company/:ticker", async (req, res, next) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    
    // Fetch quote and summary data from Yahoo Finance
    const [quote, summary] = await Promise.all([
      yahooFinance.quote(ticker),
      yahooFinance.quoteSummary(ticker, { modules: ["summaryProfile", "defaultKeyStatistics", "financialData"] }).catch(() => null)
    ]);

    if (!quote) {
      return res.status(404).json({ error: "Company not found" });
    }

    const profile = summary?.summaryProfile || {};
    const keyStats = summary?.defaultKeyStatistics || {};
    const financials = summary?.financialData || {};

    const company = {
      ticker: quote.symbol,
      name: quote.shortName || quote.longName || ticker,
      sector: profile.sector || "N/A",
      marketCap: formatMarketCap(quote.marketCap),
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      description: profile.longBusinessSummary || `${quote.shortName || ticker} is a publicly traded company.`,
      metrics: [
        { label: "P/E Ratio", value: quote.trailingPE?.toFixed(2) || "N/A", trend: "neutral" },
        { label: "EPS", value: quote.epsTrailingTwelveMonths ? `$${quote.epsTrailingTwelveMonths.toFixed(2)}` : "N/A", trend: quote.epsTrailingTwelveMonths > 0 ? "up" : "down" },
        { label: "Dividend Yield", value: quote.dividendYield ? `${(quote.dividendYield * 100).toFixed(2)}%` : "N/A", trend: "neutral" },
        { label: "52W High", value: quote.fiftyTwoWeekHigh ? `$${quote.fiftyTwoWeekHigh.toFixed(2)}` : "N/A", trend: "up" },
        { label: "52W Low", value: quote.fiftyTwoWeekLow ? `$${quote.fiftyTwoWeekLow.toFixed(2)}` : "N/A", trend: "down" },
        { label: "Avg Volume", value: quote.averageDailyVolume3Month ? `${(quote.averageDailyVolume3Month / 1e6).toFixed(1)}M` : "N/A", trend: "neutral" },
      ]
    };

    res.json({ company });
  } catch (e) {
    console.error(`[FINANCE] Error fetching company ${req.params.ticker}:`, e.message);
    res.status(404).json({ error: "Company not found or data unavailable" });
  }
});

// Search companies - REAL DATA
app.get("/finance/search", async (req, res, next) => {
  try {
    const query = (req.query.q || "").trim();
    
    if (!query) {
      // Return some popular tickers if no query
      const popularTickers = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"];
      const quotes = await Promise.all(
        popularTickers.map(t => yahooFinance.quote(t).catch(() => null))
      );
      const results = quotes.filter(Boolean).map(q => ({
        ticker: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        sector: "Technology",
        marketCap: formatMarketCap(q.marketCap),
        price: q.regularMarketPrice || 0,
        change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        description: ""
      }));
      return res.json({ results });
    }

    // Search Yahoo Finance
    const searchResults = await yahooFinance.search(query, { quotesCount: 10 });
    
    // Filter to only stocks/equities and fetch quotes for them
    const stockQuotes = (searchResults.quotes || [])
      .filter(q => q.quoteType === "EQUITY" || q.quoteType === "ETF")
      .slice(0, 8);

    if (stockQuotes.length === 0) {
      return res.json({ results: [] });
    }

    // Fetch full quote data for each result
    const quotes = await Promise.all(
      stockQuotes.map(sq => yahooFinance.quote(sq.symbol).catch(() => null))
    );

    const results = quotes.filter(Boolean).map(q => ({
      ticker: q.symbol,
      name: q.shortName || q.longName || q.symbol,
      sector: "N/A",
      marketCap: formatMarketCap(q.marketCap),
      price: q.regularMarketPrice || 0,
      change: q.regularMarketChange || 0,
      changePercent: q.regularMarketChangePercent || 0,
      description: ""
    }));

    res.json({ results });
  } catch (e) {
    console.error("[FINANCE] Search error:", e.message);
    res.json({ results: [] });
  }
});

// Get chart data - REAL HISTORICAL DATA
app.get("/finance/chart/:ticker", async (req, res, next) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const timeframe = req.query.timeframe || "1M";

    // Map timeframe to Yahoo Finance parameters
    const timeframeConfig = {
      "1D": { period1: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), interval: "5m" },
      "1W": { period1: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), interval: "15m" },
      "1M": { period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), interval: "1d" },
      "3M": { period1: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), interval: "1d" },
      "6M": { period1: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), interval: "1d" },
      "1Y": { period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), interval: "1d" },
      "5Y": { period1: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000), interval: "1wk" },
    };

    const config = timeframeConfig[timeframe] || timeframeConfig["1M"];

    const historical = await yahooFinance.chart(ticker, {
      period1: config.period1,
      interval: config.interval,
    });

    if (!historical || !historical.quotes || historical.quotes.length === 0) {
      return res.status(404).json({ error: "No chart data available" });
    }

    const data = historical.quotes
      .filter(q => q.close !== null && q.close !== undefined)
      .map(q => ({
        timestamp: q.date.toISOString(),
        price: Number(q.close.toFixed(2)),
        volume: q.volume || 0,
        open: q.open ? Number(q.open.toFixed(2)) : undefined,
        high: q.high ? Number(q.high.toFixed(2)) : undefined,
        low: q.low ? Number(q.low.toFixed(2)) : undefined,
      }));

    res.json({ ticker, timeframe, data });
  } catch (e) {
    console.error(`[FINANCE] Chart error for ${req.params.ticker}:`, e.message);
    res.status(404).json({ error: "Chart data unavailable" });
  }
});

// ==========================
// Error Handler
// ==========================
app.use((err, _req, res, _next) => {
  const status = typeof err?.status === "number" ? err.status : 500;
  const message = typeof err?.message === "string" ? err.message : "Unknown error";
  console.error(`[ERROR] ${status}: ${message}`);
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  process.stdout.write(`Backend listening on http://localhost:${PORT}\n`);
});
