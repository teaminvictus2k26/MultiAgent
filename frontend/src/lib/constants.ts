import type { Agent, DocumentRecord } from "@/types";

export const AGENTS: Agent[] = [
  { id: "classifier", name: "Classifier", description: "Detects document category", status: "idle" },
  { id: "research", name: "Research", description: "RAG over non-medical corpus", status: "idle" },
  { id: "diagnosis", name: "Diagnosis", description: "Full-context medical reasoning", status: "idle" },
  { id: "triage", name: "Triage", description: "Severity & urgency", status: "idle" },
  { id: "summary", name: "Summary", description: "Patient & doctor summaries", status: "idle" },
  { id: "memory", name: "Memory", description: "Long-term context store", status: "idle" },
  // AI Task Team
  { id: "planner", name: "Planner", description: "Plans execution steps", status: "idle" },
  { id: "executor", name: "Executor", description: "Executes planned tasks", status: "idle" },
  { id: "reviewer", name: "Reviewer", description: "Reviews executed work", status: "idle" },
  // Research Team
  { id: "searcher", name: "Searcher", description: "Searches the web/corpus", status: "idle" },
  { id: "summarizer", name: "Summarizer", description: "Summarizes findings", status: "idle" },
  { id: "presenter", name: "Presenter", description: "Formats the final report", status: "idle" },
  // Startup Simulator
  { id: "ceo", name: "CEO", description: "Startup CEO - Vision", status: "idle" },
  { id: "cto", name: "CTO", description: "Startup CTO - Architecture", status: "idle" },
  { id: "pm", name: "Product Manager", description: "Startup PM - Scoping", status: "idle" },
];

export const NAV = [
  { to: "/", label: "Home" },
  { to: "/workspace", label: "Workspace" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/documents", label: "Documents" },
] as const;
