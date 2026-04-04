/**
 * In-memory annotation store + event bus.
 * No database — annotations are transient dev feedback.
 */

import { appendToHistory } from "./history.js";

// =============================================================================
// Types (server-side, compatible with browser Annotation type)
// =============================================================================

export interface Session {
  id: string;
  url: string;
  status: "active" | "closed";
  createdAt: number;
  updatedAt: number;
}

export interface ServerAnnotation {
  id: string;
  sessionId: string;
  x: number;
  y: number;
  comment: string;
  element: string;
  elementPath: string;
  timestamp: number;
  selectedText?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  nearbyText?: string;
  cssClasses?: string;
  computedStyles?: string;
  fullPath?: string;
  accessibility?: string;
  isFixed?: boolean;
  reactComponents?: string;
  sourceFile?: string;
  intent?: "fix" | "change" | "question" | "approve";
  severity?: "blocking" | "important" | "suggestion";
  status: "pending" | "acknowledged" | "resolved" | "dismissed";
  resolvedBy?: string;
  thread?: ThreadMessage[];
  // Agent orchestrator fields
  agentId?: string;
  agentStatus?: "spawning" | "working" | "done" | "failed" | "aborted";
  agentBranch?: string;
  agentSummary?: string;
}

export interface ThreadMessage {
  role: "user" | "agent";
  content: string;
  timestamp: number;
}

export interface StoreEvent {
  sequence: number;
  type: string;
  sessionId: string;
  payload: unknown;
  timestamp: number;
}

// =============================================================================
// Event Bus
// =============================================================================

type EventHandler = (event: StoreEvent) => void;

class EventBus {
  private globalHandlers: Set<EventHandler> = new Set();
  private sessionHandlers: Map<string, Set<EventHandler>> = new Map();
  private sequence = 0;
  private recentEvents: StoreEvent[] = [];

  subscribe(handler: EventHandler): () => void {
    this.globalHandlers.add(handler);
    return () => this.globalHandlers.delete(handler);
  }

  subscribeToSession(sessionId: string, handler: EventHandler): () => void {
    if (!this.sessionHandlers.has(sessionId)) {
      this.sessionHandlers.set(sessionId, new Set());
    }
    this.sessionHandlers.get(sessionId)!.add(handler);
    return () => {
      const handlers = this.sessionHandlers.get(sessionId);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) this.sessionHandlers.delete(sessionId);
      }
    };
  }

  emit(type: string, sessionId: string, payload: unknown): StoreEvent {
    const event: StoreEvent = {
      sequence: ++this.sequence,
      type,
      sessionId,
      payload,
      timestamp: Date.now(),
    };

    // Keep last 1000 events for replay
    this.recentEvents.push(event);
    if (this.recentEvents.length > 1000) {
      this.recentEvents = this.recentEvents.slice(-500);
    }

    for (const handler of this.globalHandlers) {
      try { handler(event); } catch { /* resilient */ }
    }
    const sessionH = this.sessionHandlers.get(sessionId);
    if (sessionH) {
      for (const handler of sessionH) {
        try { handler(event); } catch { /* resilient */ }
      }
    }

    return event;
  }

  getEventsSince(sequence: number, sessionId?: string): StoreEvent[] {
    return this.recentEvents.filter(
      (e) => e.sequence > sequence && (!sessionId || e.sessionId === sessionId)
    );
  }

  getSequence(): number {
    return this.sequence;
  }
}

// =============================================================================
// Store
// =============================================================================

export const eventBus = new EventBus();

const sessions = new Map<string, Session>();
const annotations = new Map<string, ServerAnnotation>();

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// -- Sessions --

export function createSession(url: string): Session {
  const id = generateId();
  const now = Date.now();
  const session: Session = { id, url, status: "active", createdAt: now, updatedAt: now };
  sessions.set(id, session);
  eventBus.emit("session.created", id, session);
  return session;
}

export function getSession(id: string): (Session & { annotations: ServerAnnotation[] }) | null {
  const session = sessions.get(id);
  if (!session) return null;
  const anns = Array.from(annotations.values()).filter((a) => a.sessionId === id);
  return { ...session, annotations: anns };
}

export function listSessions(): Session[] {
  return Array.from(sessions.values());
}

export function updateSessionStatus(id: string, status: Session["status"]): Session | null {
  const session = sessions.get(id);
  if (!session) return null;
  session.status = status;
  session.updatedAt = Date.now();
  eventBus.emit("session.updated", id, session);
  return session;
}

// -- Annotations --

export function addAnnotation(sessionId: string, data: Omit<ServerAnnotation, "sessionId">): ServerAnnotation {
  const annotation: ServerAnnotation = {
    ...data,
    sessionId,
    status: data.status || "pending",
    thread: data.thread || [],
  };
  annotations.set(annotation.id, annotation);

  // Update session timestamp
  const session = sessions.get(sessionId);
  if (session) session.updatedAt = Date.now();

  eventBus.emit("annotation.created", sessionId, annotation);
  return annotation;
}

export function getAnnotation(id: string): ServerAnnotation | null {
  return annotations.get(id) || null;
}

export function updateAnnotation(
  id: string,
  updates: Partial<Pick<ServerAnnotation, "comment" | "status" | "intent" | "severity" | "resolvedBy">>
): ServerAnnotation | null {
  const annotation = annotations.get(id);
  if (!annotation) return null;
  Object.assign(annotation, updates);
  eventBus.emit("annotation.updated", annotation.sessionId, annotation);

  // Auto-archive completed annotations to persistent history
  if (annotation.status === "resolved" || annotation.status === "dismissed") {
    appendToHistory(annotation);
  }

  return annotation;
}

export function updateAnnotationAgent(
  id: string,
  updates: Partial<Pick<ServerAnnotation, "agentId" | "agentStatus" | "agentBranch" | "agentSummary">>
): ServerAnnotation | null {
  const annotation = annotations.get(id);
  if (!annotation) return null;
  Object.assign(annotation, updates);
  eventBus.emit("annotation.agent_updated", annotation.sessionId, annotation);
  return annotation;
}

export function deleteAnnotation(id: string): boolean {
  const annotation = annotations.get(id);
  if (!annotation) return false;
  annotations.delete(id);
  eventBus.emit("annotation.deleted", annotation.sessionId, { id });
  return true;
}

export function addThreadMessage(
  annotationId: string,
  role: ThreadMessage["role"],
  content: string
): ServerAnnotation | null {
  const annotation = annotations.get(annotationId);
  if (!annotation) return null;
  if (!annotation.thread) annotation.thread = [];
  const message: ThreadMessage = { role, content, timestamp: Date.now() };
  annotation.thread.push(message);
  eventBus.emit("thread.message", annotation.sessionId, { annotationId, message });
  return annotation;
}

export function getPendingAnnotations(sessionId: string): ServerAnnotation[] {
  return Array.from(annotations.values()).filter(
    (a) => a.sessionId === sessionId && a.status !== "resolved" && a.status !== "dismissed"
  );
}

export function getAllPending(): ServerAnnotation[] {
  return Array.from(annotations.values()).filter(
    (a) => a.status !== "resolved" && a.status !== "dismissed"
  );
}

export function getSessionAnnotations(sessionId: string): ServerAnnotation[] {
  return Array.from(annotations.values()).filter((a) => a.sessionId === sessionId);
}

export function clearAll(): void {
  sessions.clear();
  annotations.clear();
}
