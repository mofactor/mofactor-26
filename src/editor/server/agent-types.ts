/**
 * Shared types for the multi-agent orchestrator.
 */

export type AgentStatus = "spawning" | "working" | "done" | "failed" | "aborted";

export interface AgentInfo {
  agentId: string;
  annotationId: string;
  sessionId: string;
  status: AgentStatus;
  branchName: string;
  worktreePath: string;
  model: string;
  startedAt: number;
  completedAt?: number;
  error?: string;
  summary?: string;
  turnsUsed: number;
  lastActivity: number;
}
