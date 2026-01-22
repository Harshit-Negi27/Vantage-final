import crypto from "crypto";
import { MongoClient } from "mongodb";

function nowIso() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function dbNameFromUri(uri) {
  try {
    const u = new URL(uri);
    const name = u.pathname.replace("/", "").trim();
    return name || undefined;
  } catch {
    return undefined;
  }
}

let clientPromise;

async function getClient() {
  if (clientPromise) return clientPromise;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required");
  const client = new MongoClient(uri);
  clientPromise = client.connect().then(() => client);
  return clientPromise;
}

async function getDb() {
  const client = await getClient();
  const dbName = process.env.MONGODB_DB || dbNameFromUri(process.env.MONGODB_URI) || "vantage";
  return client.db(dbName);
}

async function coll() {
  const db = await getDb();
  const c = db.collection("whiteboards");
  await c.createIndex({ id: 1 }, { unique: true });
  await c.createIndex({ updatedAt: -1 });
  return c;
}

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

function notFound(msg) {
  const err = new Error(msg);
  err.status = 404;
  return err;
}

export async function listWhiteboards() {
  const c = await coll();
  const docs = await c
    .aggregate([
      { $sort: { updatedAt: -1 } },
      {
        $project: {
          _id: 0,
          id: 1,
          title: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
          nodeCount: { $size: { $ifNull: ["$nodes", []] } },
          edgeCount: { $size: { $ifNull: ["$edges", []] } },
        },
      },
    ])
    .toArray();
  return docs;
}

export async function createWhiteboard({ title, description }) {
  const c = await coll();
  const board = seedBoard({ title, description });
  await c.insertOne(board);
  return board;
}

export async function getWhiteboard(boardId) {
  const c = await coll();
  const board = await c.findOne({ id: boardId }, { projection: { _id: 0 } });
  if (!board) throw notFound("Whiteboard not found");
  return board;
}

export async function updateWhiteboard(boardId, patch) {
  const c = await coll();
  const $set = {};
  if (typeof patch.title === "string") $set.title = patch.title.trim() || undefined;
  if (typeof patch.description === "string") $set.description = patch.description.trim();
  $set.updatedAt = nowIso();
  if ($set.title === undefined) delete $set.title;
  const res = await c.findOneAndUpdate(
    { id: boardId },
    { $set },
    { returnDocument: "after", projection: { _id: 0 } },
  );
  if (!res.value) throw notFound("Whiteboard not found");
  return res.value;
}

export async function deleteWhiteboard(boardId) {
  const c = await coll();
  const res = await c.deleteOne({ id: boardId });
  if (res.deletedCount === 0) throw notFound("Whiteboard not found");
  return { success: true };
}

export async function createNode(boardId, input) {
  const c = await coll();
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
  const res = await c.updateOne({ id: boardId }, { $push: { nodes: node }, $set: { updatedAt: ts } });
  if (!res.matchedCount) throw notFound("Whiteboard not found");
  return node;
}

export async function updateNode(boardId, nodeId, patch) {
  const c = await coll();
  const ts = nowIso();
  const $set = { updatedAt: ts };

  if (typeof patch.title === "string" && patch.title.trim()) $set["nodes.$[n].title"] = patch.title.trim();
  if (typeof patch.summary === "string") $set["nodes.$[n].summary"] = patch.summary;
  if (Number.isFinite(patch.x)) $set["nodes.$[n].x"] = Number(patch.x);
  if (Number.isFinite(patch.y)) $set["nodes.$[n].y"] = Number(patch.y);
  if (Number.isFinite(patch.width)) $set["nodes.$[n].width"] = Number(patch.width);
  if (Number.isFinite(patch.height)) $set["nodes.$[n].height"] = Number(patch.height);
  if (patch.data && typeof patch.data === "object") {
    // Merge data
    const board = await getWhiteboard(boardId);
    const node = board.nodes?.find((n) => n.id === nodeId);
    if (node) {
      $set["nodes.$[n].data"] = { ...(node.data || {}), ...patch.data };
    }
  }
  if (patch.parentId !== undefined) {
    $set["nodes.$[n].parentId"] = patch.parentId;
  }

  $set["nodes.$[n].updatedAt"] = ts;

  const res = await c.updateOne({ id: boardId }, { $set }, { arrayFilters: [{ "n.id": nodeId }] });
  if (!res.matchedCount) throw notFound("Whiteboard not found");

  const board = await getWhiteboard(boardId);
  const node = board.nodes?.find((n) => n.id === nodeId);
  if (!node) throw notFound("Node not found");
  return node;
}

export async function deleteNode(boardId, nodeId) {
  const c = await coll();
  const ts = nowIso();

  // Remove node from nodes array
  const res = await c.updateOne(
    { id: boardId },
    {
      $pull: { nodes: { id: nodeId } },
      $set: { updatedAt: ts }
    }
  );

  if (!res.matchedCount) throw notFound("Whiteboard not found");

  // Also remove any edges connected to this node
  await c.updateOne(
    { id: boardId },
    {
      $pull: { edges: { $or: [{ source: nodeId }, { target: nodeId }] } }
    }
  );

  // Update any children that had this as parent
  await c.updateOne(
    { id: boardId },
    { $set: { "nodes.$[n].parentId": null } },
    { arrayFilters: [{ "n.parentId": nodeId }] }
  );

  return { success: true };
}

export async function createEdge(boardId, source, target) {
  const c = await coll();
  const board = await getWhiteboard(boardId);
  const hasSource = board.nodes?.some((n) => n.id === source);
  const hasTarget = board.nodes?.some((n) => n.id === target);
  if (!hasSource || !hasTarget) throw notFound("Node not found");

  // Check for duplicate
  const exists = board.edges?.some((e) => e.source === source && e.target === target);
  if (exists) {
    return board.edges.find((e) => e.source === source && e.target === target);
  }

  const edge = { id: id("edge"), source, target };
  const ts = nowIso();
  await c.updateOne({ id: boardId }, { $push: { edges: edge }, $set: { updatedAt: ts } });
  return edge;
}

export async function deleteEdge(boardId, edgeId) {
  const c = await coll();
  const ts = nowIso();

  const res = await c.updateOne(
    { id: boardId },
    {
      $pull: { edges: { id: edgeId } },
      $set: { updatedAt: ts }
    }
  );

  if (!res.matchedCount) throw notFound("Whiteboard not found");
  return { success: true };
}

export async function getNodeMessages(boardId, nodeId) {
  const board = await getWhiteboard(boardId);
  const node = board.nodes?.find((n) => n.id === nodeId);
  if (!node) throw notFound("Node not found");
  return node.messages || [];
}

export async function appendNodeMessages(boardId, nodeId, messagesToAppend) {
  const c = await coll();
  const ts = nowIso();
  const res = await c.updateOne(
    { id: boardId },
    {
      $push: { "nodes.$[n].messages": { $each: messagesToAppend } },
      $set: { updatedAt: ts, "nodes.$[n].updatedAt": ts },
    },
    { arrayFilters: [{ "n.id": nodeId }] },
  );
  if (!res.matchedCount) throw notFound("Whiteboard not found");
  if (!res.modifiedCount) {
    const board = await getWhiteboard(boardId);
    const node = board.nodes?.find((n) => n.id === nodeId);
    if (!node) throw notFound("Node not found");
    return node.messages || [];
  }
  return await getNodeMessages(boardId, nodeId);
}
