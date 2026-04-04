/**
 * Persistent annotation history — survives server restarts.
 * Stores completed (resolved/dismissed) annotations to a JSON file.
 */

import fs from "node:fs";
import path from "node:path";
import type { ServerAnnotation } from "./store.js";

export interface HistoryEntry extends ServerAnnotation {
  completedAt: number;
}

interface HistoryFile {
  entries: HistoryEntry[];
}

const HISTORY_PATH = path.resolve(process.cwd(), ".claude", "annotation-history.json");

function ensureDir(): void {
  const dir = path.dirname(HISTORY_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readFile(): HistoryFile {
  try {
    const raw = fs.readFileSync(HISTORY_PATH, "utf-8");
    return JSON.parse(raw) as HistoryFile;
  } catch {
    return { entries: [] };
  }
}

function writeFile(data: HistoryFile): void {
  ensureDir();
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function appendToHistory(annotation: ServerAnnotation): void {
  const data = readFile();
  // Avoid duplicates
  if (data.entries.some((e) => e.id === annotation.id)) return;
  const entry: HistoryEntry = { ...annotation, completedAt: Date.now() };
  data.entries.push(entry);
  writeFile(data);
}

export function getHistory(): HistoryEntry[] {
  return readFile().entries;
}

export function clearHistory(): void {
  writeFile({ entries: [] });
}
