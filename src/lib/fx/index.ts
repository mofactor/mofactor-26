import { blink, type BlinkOptions } from "./blink";
import { lazyVideo, type LazyVideoOptions } from "./lazyVideo";
import { thinking, type ThinkingOptions } from "./thinking";

export { blink, lazyVideo, thinking };
export type { BlinkOptions, LazyVideoOptions, ThinkingOptions };

const effects = {
  blink: (el: HTMLElement, options: unknown) => blink(el, options as BlinkOptions),
  "lazy-video": (el: HTMLElement, options: unknown) => lazyVideo(el, options as LazyVideoOptions),
  thinking: (el: HTMLElement, options: unknown) => thinking(el, options as ThinkingOptions),
};

/**
 * Starts every effect rendered by an Astro wrapper (`data-fx-auto`).
 * Elements rendered by React islands omit `data-fx-auto` and start from their own effect hook.
 */
export function initAutoFx(root: ParentNode = document) {
  root
    .querySelectorAll<HTMLElement>("[data-fx-auto]:not([data-fx-init])")
    .forEach((el) => {
      const run = effects[el.dataset.fx as keyof typeof effects];
      if (!run) return;
      el.setAttribute("data-fx-init", "");

      let options: unknown = {};
      try {
        options = JSON.parse(el.dataset.fxOptions ?? "{}");
      } catch {
        // Malformed options: run with defaults
      }
      run(el, options);
    });
}
