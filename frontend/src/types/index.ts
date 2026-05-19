export type DocCategory = "medical" | "research" | "legal" | "financial" | "academic" | "general";

export type AgentId =
  | "classifier"
  | "research"
  | "diagnosis"
  | "triage"
  | "memory"
  | "planner"
  | "executor"
  | "reviewer"
  | "searcher"
  | "summarizer"
  | "presenter"
  | "ceo"
  | "cto"
  | "pm";

export type AgentStatus = "idle" | "working" | "done" | "error";

export interface Agent {
  id: AgentId;
  name: string;
  description: string;
  status: AgentStatus;
  currentTask?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "agent" | "system";
  agentId?: AgentId;
  content: string;
  createdAt: number;
  streaming?: boolean;
  attachments?: { name: string; type: string }[];
}

export interface ActivityEvent {
  id: string;
  agentId: AgentId;
  title: string;
  detail?: string;
  level?: "info" | "success" | "warning" | "critical";
  at: number;
}

export interface DocumentRecord {
  id: string;
  name: string;
  category: DocCategory;
  uploadedAt: number;
  pages?: number;
  status: "processing" | "ready" | "error";
  summary?: string;
  analysis?: import("@/lib/api").AnalyzeResponse;
}
