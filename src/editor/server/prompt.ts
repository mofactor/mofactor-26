/**
 * Agent prompt builders for annotation-driven tasks.
 */

import type { ServerAnnotation } from "./store.js";

export function buildAgentPrompt(annotation: ServerAnnotation): string {
  const parts: string[] = [];

  parts.push(`You are working on a specific UI feedback item for a Next.js application.`);
  parts.push(``);
  parts.push(`## Feedback`);
  parts.push(`**Type:** ${annotation.intent || "feedback"}`);
  parts.push(`**Comment:** ${annotation.comment}`);
  parts.push(`**Element:** ${annotation.element}`);
  parts.push(`**DOM Path:** ${annotation.elementPath}`);

  if (annotation.sourceFile) {
    parts.push(`**Source File:** ${annotation.sourceFile}`);
    parts.push(``);
    parts.push(`Start by reading this source file to understand the current implementation.`);
  }

  if (annotation.reactComponents) {
    parts.push(`**React Components:** ${annotation.reactComponents}`);
  }

  if (annotation.cssClasses) {
    parts.push(`**CSS Classes:** ${annotation.cssClasses}`);
  }

  if (annotation.selectedText) {
    parts.push(`**Selected Text:** "${annotation.selectedText}"`);
  }

  if (annotation.nearbyText) {
    parts.push(`**Context Text:** ${annotation.nearbyText}`);
  }

  parts.push(``);
  parts.push(`## Instructions`);
  parts.push(`1. Read the source file and understand the current code.`);
  parts.push(`2. Implement the requested change. This is a ${annotation.intent || "fix"} request.`);
  parts.push(`3. Make minimal, focused changes. Do not refactor unrelated code.`);
  parts.push(`4. This project uses Tailwind CSS v4 for styling and Next.js App Router.`);
  parts.push(`5. Do NOT commit, push, or run any git commands. Just edit the file and stop.`);

  if (annotation.thread && annotation.thread.length > 0) {
    parts.push(``);
    parts.push(`## Thread History`);
    for (const msg of annotation.thread) {
      parts.push(`[${msg.role}]: ${msg.content}`);
    }
  }

  return parts.join("\n");
}

export function buildFollowUpPrompt(
  annotation: ServerAnnotation,
  newReply: string
): string {
  const parts: string[] = [];

  parts.push(`The user has sent a follow-up message about a UI feedback item you previously worked on.`);
  parts.push(``);
  parts.push(`## Original Feedback`);
  parts.push(`**Comment:** ${annotation.comment}`);
  parts.push(`**Element:** ${annotation.element}`);
  if (annotation.sourceFile) parts.push(`**Source File:** ${annotation.sourceFile}`);
  parts.push(``);
  parts.push(`## New Message from User`);
  parts.push(newReply);

  if (annotation.thread && annotation.thread.length > 0) {
    parts.push(``);
    parts.push(`## Full Thread History`);
    for (const msg of annotation.thread) {
      parts.push(`[${msg.role}]: ${msg.content}`);
    }
  }

  parts.push(``);
  parts.push(`## Instructions`);
  parts.push(`1. Review the user's new message and the thread history.`);
  parts.push(`2. Make any requested changes or answer any questions.`);
  parts.push(`3. Do NOT commit, push, or run any git commands. Just edit the file and stop.`);

  return parts.join("\n");
}
