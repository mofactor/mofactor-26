import { EDITOR_ATTR, EDITOR_PATCHED_ATTR, MUTATION_DEBOUNCE_MS } from "../constants";
import type { Patch, PatchOperation } from "../types";

function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

function applyOperation(el: HTMLElement, op: PatchOperation): void {
  switch (op.type) {
    case "text":
      // Only set textContent on leaf elements to avoid clobbering children
      if (el.childElementCount === 0 && op.value != null) {
        el.textContent = op.value;
      }
      break;
    case "addClass":
      if (op.className) {
        op.className.split(/\s+/).forEach((c) => {
          if (c) el.classList.add(c);
        });
      }
      break;
    case "removeClass":
      if (op.className) {
        op.className.split(/\s+/).forEach((c) => {
          if (c) el.classList.remove(c);
        });
      }
      break;
    case "setStyle":
      if (op.property && op.styleValue != null) {
        el.style.setProperty(camelToKebab(op.property), op.styleValue);
      }
      break;
    case "removeStyle":
      if (op.property) {
        el.style.removeProperty(camelToKebab(op.property));
      }
      break;
    case "hide":
      el.style.display = "none";
      break;
    case "show":
      el.style.removeProperty("display");
      break;
    case "setProp":
      // Props require React re-render — applied only via source commit
      break;
  }
}

export class PatchApplicator {
  private observer: MutationObserver | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private currentPatches: Patch[] = [];
  private applying = false;

  /**
   * Set the active patches and apply them to the DOM.
   */
  apply(patches: Patch[]): void {
    this.currentPatches = patches;
    this.applyAll();
  }

  /**
   * Apply a single patch immediately.
   */
  applyOne(patch: Patch): void {
    const el = this.resolve(patch.selector);
    if (!el) return;

    el.setAttribute(EDITOR_PATCHED_ATTR, patch.id);
    for (const op of patch.operations) {
      applyOperation(el, op);
    }
  }

  /**
   * Revert a single patch by restoring original state.
   */
  revertOne(patch: Patch): void {
    const el = this.resolve(patch.selector);
    if (!el) return;

    el.removeAttribute(EDITOR_PATCHED_ATTR);

    // Restore original text
    if (patch.originalText != null) {
      const hasTextOp = patch.operations.some((op) => op.type === "text");
      if (hasTextOp && el.childElementCount === 0) {
        el.textContent = patch.originalText;
      }
    }

    // Restore original classes
    if (patch.originalClasses != null) {
      const hasClassOp = patch.operations.some(
        (op) => op.type === "addClass" || op.type === "removeClass"
      );
      if (hasClassOp) {
        el.setAttribute("class", patch.originalClasses);
      }
    }

    // Restore original styles
    if (patch.originalStyles != null) {
      const hasStyleOp = patch.operations.some(
        (op) => op.type === "setStyle" || op.type === "removeStyle"
      );
      if (hasStyleOp) {
        el.style.cssText = patch.originalStyles;
      }
    }
  }

  /**
   * Start observing DOM mutations to re-apply patches after React re-renders.
   */
  startObserving(): void {
    this.observer = new MutationObserver(() => {
      if (this.applying) return;
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.applyAll();
      }, MUTATION_DEBOUNCE_MS);
    });
    this.observe();
  }

  stopObserving(): void {
    this.observer?.disconnect();
    clearTimeout(this.debounceTimer);
  }

  destroy(): void {
    this.stopObserving();
    this.observer = null;
  }

  private applyAll(): void {
    this.applying = true;
    this.observer?.disconnect();

    for (const patch of this.currentPatches) {
      this.applyOne(patch);
    }

    this.applying = false;
    this.observe();
  }

  private observe(): void {
    if (!this.observer) return;
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  private resolve(selector: string): HTMLElement | null {
    try {
      const el = document.querySelector(selector);
      if (!el || !(el instanceof HTMLElement)) return null;
      // Don't patch editor UI elements
      if (el.closest(`[${EDITOR_ATTR}]`)) return null;
      return el;
    } catch {
      return null;
    }
  }
}
