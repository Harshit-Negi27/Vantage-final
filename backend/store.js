import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.join(__dirname, "data.json");

function emptyStore() {
  return { whiteboards: [] };
}

export async function readStore() {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.whiteboards)) return emptyStore();
    return parsed;
  } catch (_e) {
    return emptyStore();
  }
}

export async function writeStore(store) {
  const tmpPath = `${STORE_PATH}.tmp`;
  const data = JSON.stringify(store, null, 2);
  await fs.writeFile(tmpPath, data, "utf8");
  await fs.rename(tmpPath, STORE_PATH);
}

