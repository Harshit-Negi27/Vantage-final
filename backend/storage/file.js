import crypto from "crypto";
import { readStore, writeStore } from "../store.js";

function nowIso() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function ensureBoard(store, boardId) {
  const board = store.whiteboards.find((w) => w.id === boardId);
  if (!board) {
    const err = new Error("Whiteboard not found");
    err.status = 404;
    throw err;
  }
  return board;
}

function ensureNode(board, nodeId) {
  const node = board.nodes.find((n) => n.id === nodeId);
  if (!node) {
    const err = new Error("Node not found");
    err.status = 404;
    throw err;
  }
  return node;
}

// Create an empty board (no default nodes)
function seedBoard({ title, description }) {
  const ts = nowIso();
  return {
    id: id("wb"),
    title,
    description,
    createdAt: ts,
    updatedAt: ts,
    nodes: [],
    edges: [],
  };
}

export async function listWhiteboards() {
  const store = await readStore();
  return store.whiteboards
    .slice()
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .map((w) => ({
      id: w.id,
      title: w.title,
      description: w.description,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      nodeCount: w.nodes.length,
      edgeCount: w.edges.length,
    }));
}

export async function createWhiteboard({ title, description }) {
  const store = await readStore();
  const board = seedBoard({ title, description });
  store.whiteboards.push(board);
  await writeStore(store);
  return board;
}

export async function getWhiteboard(boardId) {
  const store = await readStore();
  return ensureBoard(store, boardId);
}

export async function updateWhiteboard(boardId, patch) {
  const store = await readStore();
  const board = ensureBoard(store, boardId);
  if (typeof patch.title === "string") board.title = patch.title.trim() || board.title;
  if (typeof patch.description === "string") board.description = patch.description.trim();
  board.updatedAt = nowIso();
  await writeStore(store);
  return board;
}

export async function deleteWhiteboard(boardId) {
  const store = await readStore();
  const idx = store.whiteboards.findIndex((w) => w.id === boardId);
  if (idx === -1) {
    const err = new Error("Whiteboard not found");
    err.status = 404;
    throw err;
  }
  store.whiteboards.splice(idx, 1);
  await writeStore(store);
  return { success: true };
}

export async function createNode(boardId, input) {
  const store = await readStore();
  const board = ensureBoard(store, boardId);
  const ts = nowIso();
  const node = {
    id: id("node"),
    title: input.title || "New Node",
    summary: input.summary || "",
    x: input.x ?? 200,
    y: input.y ?? 200,
    type: input.type || "chat",
    data: input.data || {},
    parentId: input.parentId || null,
    width: input.width || null,
    height: input.height || null,
    createdAt: ts,
    updatedAt: ts,
    messages: [],
  };
  board.nodes.push(node);
  board.updatedAt = ts;
  await writeStore(store);
  return node;
}

export async function updateNode(boardId, nodeId, patch) {
  const store = await readStore();
  const board = ensureBoard(store, boardId);
  const node = ensureNode(board, nodeId);

  if (typeof patch.title === "string" && patch.title.trim()) node.title = patch.title.trim();
  if (typeof patch.summary === "string") node.summary = patch.summary;
  if (Number.isFinite(patch.x)) node.x = Number(patch.x);
  if (Number.isFinite(patch.y)) node.y = Number(patch.y);
  if (Number.isFinite(patch.width)) node.width = Number(patch.width);
  if (Number.isFinite(patch.height)) node.height = Number(patch.height);
  if (patch.data && typeof patch.data === "object") {
    node.data = { ...node.data, ...patch.data };
  }
  if (patch.parentId !== undefined) {
    node.parentId = patch.parentId;
  }

  node.updatedAt = nowIso();
  board.updatedAt = node.updatedAt;
  await writeStore(store);
  return node;
}

export async function deleteNode(boardId, nodeId) {
  const store = await readStore();
  const board = ensureBoard(store, boardId);
  const nodeIndex = board.nodes.findIndex((n) => n.id === nodeId);
  if (nodeIndex === -1) {
    const err = new Error("Node not found");
    err.status = 404;
    throw err;
  }

  // Remove node
  board.nodes.splice(nodeIndex, 1);

  // Remove any edges connected to this node
  board.edges = board.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);

  // Update children if this was a group
  board.nodes.forEach((n) => {
    if (n.parentId === nodeId) {
      n.parentId = null;
    }
  });

  board.updatedAt = nowIso();
  await writeStore(store);
  return { success: true };
}

export async function createEdge(boardId, source, target) {
  const store = await readStore();
  const board = ensureBoard(store, boardId);
  ensureNode(board, source);
  ensureNode(board, target);

  // Check for duplicate
  const exists = board.edges.some((e) => e.source === source && e.target === target);
  if (exists) {
    return board.edges.find((e) => e.source === source && e.target === target);
  }

  const edge = { id: id("edge"), source, target };
  board.edges.push(edge);
  board.updatedAt = nowIso();
  await writeStore(store);
  return edge;
}

export async function deleteEdge(boardId, edgeId) {
  const store = await readStore();
  const board = ensureBoard(store, boardId);
  const edgeIndex = board.edges.findIndex((e) => e.id === edgeId);
  if (edgeIndex === -1) {
    const err = new Error("Edge not found");
    err.status = 404;
    throw err;
  }
  board.edges.splice(edgeIndex, 1);
  board.updatedAt = nowIso();
  await writeStore(store);
  return { success: true };
}

export async function getNodeMessages(boardId, nodeId) {
  const store = await readStore();
  const board = ensureBoard(store, boardId);
  const node = ensureNode(board, nodeId);
  return node.messages;
}

export async function appendNodeMessages(boardId, nodeId, messagesToAppend) {
  const store = await readStore();
  const board = ensureBoard(store, boardId);
  const node = ensureNode(board, nodeId);
  node.messages.push(...messagesToAppend);
  const ts = nowIso();
  node.updatedAt = ts;
  board.updatedAt = ts;
  await writeStore(store);
  return node.messages;
}
