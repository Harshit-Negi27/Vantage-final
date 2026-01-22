import * as file from "./file.js";
import * as mongo from "./mongo.js";

function useMongo() {
  return Boolean(process.env.MONGODB_URI);
}

export function storageMode() {
  return useMongo() ? "mongo" : "file";
}

export async function listWhiteboards() {
  return useMongo() ? await mongo.listWhiteboards() : await file.listWhiteboards();
}

export async function createWhiteboard(input) {
  return useMongo() ? await mongo.createWhiteboard(input) : await file.createWhiteboard(input);
}

export async function getWhiteboard(boardId) {
  return useMongo() ? await mongo.getWhiteboard(boardId) : await file.getWhiteboard(boardId);
}

export async function updateWhiteboard(boardId, patch) {
  return useMongo() ? await mongo.updateWhiteboard(boardId, patch) : await file.updateWhiteboard(boardId, patch);
}

export async function deleteWhiteboard(boardId) {
  return useMongo() ? await mongo.deleteWhiteboard(boardId) : await file.deleteWhiteboard(boardId);
}

export async function createNode(boardId, input) {
  return useMongo() ? await mongo.createNode(boardId, input) : await file.createNode(boardId, input);
}

export async function updateNode(boardId, nodeId, patch) {
  return useMongo() ? await mongo.updateNode(boardId, nodeId, patch) : await file.updateNode(boardId, nodeId, patch);
}

export async function deleteNode(boardId, nodeId) {
  return useMongo() ? await mongo.deleteNode(boardId, nodeId) : await file.deleteNode(boardId, nodeId);
}

export async function createEdge(boardId, source, target) {
  return useMongo() ? await mongo.createEdge(boardId, source, target) : await file.createEdge(boardId, source, target);
}

export async function deleteEdge(boardId, edgeId) {
  return useMongo() ? await mongo.deleteEdge(boardId, edgeId) : await file.deleteEdge(boardId, edgeId);
}

export async function getNodeMessages(boardId, nodeId) {
  return useMongo() ? await mongo.getNodeMessages(boardId, nodeId) : await file.getNodeMessages(boardId, nodeId);
}

export async function appendNodeMessages(boardId, nodeId, messagesToAppend) {
  return useMongo()
    ? await mongo.appendNodeMessages(boardId, nodeId, messagesToAppend)
    : await file.appendNodeMessages(boardId, nodeId, messagesToAppend);
}
