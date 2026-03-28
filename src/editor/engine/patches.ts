import { API_ENDPOINT, SAVE_DEBOUNCE_MS } from "../constants";
import type { Patch, PatchFile } from "../types";

const LS_KEY = "editor-patches";

/**
 * In-memory patch store.
 * Primary persistence: localStorage (synchronous, survives Fast Refresh).
 * Secondary persistence: file API (debounced, keeps patches.json in sync for commit).
 */
export class PatchStore {
  private patches: Patch[] = [];
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  private listeners = new Set<() => void>();

  async load(): Promise<Patch[]> {
    // 1. Try localStorage first (instant, survives Fast Refresh)
    const local = this.loadFromLocalStorage();
    if (local.length > 0) {
      this.patches = local;
      // Sync to file in background so patches.json stays current
      this.scheduleSave();
      return this.patches;
    }

    // 2. Fall through to file API
    try {
      const res = await fetch(API_ENDPOINT);
      const data: PatchFile = await res.json();
      this.patches = data.patches ?? [];
      this.saveToLocalStorage();
    } catch {
      this.patches = [];
    }
    return this.patches;
  }

  getAll(): Patch[] {
    return this.patches;
  }

  getForPage(pathname: string): Patch[] {
    return this.patches.filter(
      (p) => p.pathname === pathname || p.pathname === "*"
    );
  }

  getBySelector(selector: string, pathname: string): Patch | undefined {
    return this.patches.find(
      (p) =>
        p.selector === selector &&
        (p.pathname === pathname || p.pathname === "*")
    );
  }

  upsert(patch: Patch): void {
    const idx = this.patches.findIndex((p) => p.id === patch.id);
    if (idx >= 0) {
      this.patches[idx] = { ...patch, updatedAt: new Date().toISOString() };
    } else {
      this.patches.push(patch);
    }
    this.saveToLocalStorage();
    this.scheduleSave();
    this.notify();
  }

  remove(patchId: string): void {
    this.patches = this.patches.filter((p) => p.id !== patchId);
    this.saveToLocalStorage();
    this.scheduleSave();
    this.notify();
  }

  removeAllForPage(pathname: string): void {
    this.patches = this.patches.filter((p) => p.pathname !== pathname);
    this.saveToLocalStorage();
    this.scheduleSave();
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  private saveToLocalStorage(): void {
    try {
      const data: PatchFile = { version: 1, patches: this.patches };
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch {
      // localStorage full or unavailable — in-memory still works
    }
  }

  private loadFromLocalStorage(): Patch[] {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      const data: PatchFile = JSON.parse(raw);
      return data.patches ?? [];
    } catch {
      return [];
    }
  }

  /** Force an immediate write to patches.json (cancels any pending debounce). */
  async flush(): Promise<void> {
    clearTimeout(this.saveTimer);
    await this.saveToFile();
  }

  private scheduleSave(): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveToFile(), SAVE_DEBOUNCE_MS);
  }

  private async saveToFile(): Promise<void> {
    const data: PatchFile = { version: 1, patches: this.patches };
    try {
      await fetch(API_ENDPOINT, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      // File save failed — localStorage still has the data
    }
  }

  destroy(): void {
    // Flush to localStorage before teardown
    this.saveToLocalStorage();
    clearTimeout(this.saveTimer);
    this.listeners.clear();
  }
}
