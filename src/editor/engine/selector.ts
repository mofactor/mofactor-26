/**
 * Generates a stable CSS selector path from an element up to document.body.
 * Leverages id attributes as anchors, falls back to nth-of-type for disambiguation.
 */

const IGNORED_ID_PREFIXES = ["__", "radix-", "headlessui-", ":r"];

function isUsableId(id: string): boolean {
  if (!id) return false;
  return !IGNORED_ID_PREFIXES.some((prefix) => id.startsWith(prefix));
}

function buildSegment(el: Element): string {
  const tag = el.tagName.toLowerCase();

  // Priority 1: stable id
  if (el.id && isUsableId(el.id)) {
    return `${tag}#${CSS.escape(el.id)}`;
  }

  // Priority 2: role + aria-label (accessible landmarks)
  const role = el.getAttribute("role");
  const ariaLabel = el.getAttribute("aria-label");
  if (role && ariaLabel) {
    return `${tag}[role="${role}"][aria-label="${CSS.escape(ariaLabel)}"]`;
  }

  // Priority 3: nth-of-type if needed to disambiguate among siblings
  const parent = el.parentElement;
  if (parent) {
    const sameTagSiblings = Array.from(parent.children).filter(
      (s) => s.tagName === el.tagName
    );
    if (sameTagSiblings.length === 1) {
      return tag;
    }
    const index = sameTagSiblings.indexOf(el) + 1;
    return `${tag}:nth-of-type(${index})`;
  }

  return tag;
}

export function generateSelector(el: Element): string {
  const segments: string[] = [];
  let current: Element | null = el;

  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    const segment = buildSegment(current);
    segments.unshift(segment);

    // If this segment uses an id, we have a unique anchor — stop walking up
    if (current.id && isUsableId(current.id)) {
      break;
    }

    current = current.parentElement;
  }

  // If we walked all the way up without hitting an id, prepend "body"
  if (!segments[0]?.includes("#")) {
    segments.unshift("body");
  }

  return segments.join(" > ");
}

/**
 * Validates that a selector uniquely resolves to the expected element.
 */
export function validateSelector(
  selector: string,
  expected: Element
): boolean {
  try {
    const found = document.querySelector(selector);
    return found === expected;
  } catch {
    return false;
  }
}
