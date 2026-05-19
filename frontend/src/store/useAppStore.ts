import { create } from "zustand";
import type { Agent, ActivityEvent, ChatMessage, DocumentRecord } from "@/types";
import { AGENTS } from "@/lib/constants";

interface AppState {
  agents: Agent[];
  messages: ChatMessage[];
  activity: ActivityEvent[];
  documents: DocumentRecord[];
  sidebarOpen: boolean;
  setAgentStatus: (id: Agent["id"], status: Agent["status"], task?: string) => void;
  pushMessage: (m: ChatMessage) => void;
  pushActivity: (e: ActivityEvent) => void;
  addDocument: (d: DocumentRecord) => void;
  reset: () => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  agents: AGENTS,
  messages: [],
  activity: [],
  documents: [],
  sidebarOpen: true,
  setAgentStatus: (id, status, task) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, status, currentTask: task } : a)),
    })),
  pushMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  pushActivity: (e) => set((s) => ({ activity: [e, ...s.activity].slice(0, 50) })),
  addDocument: (d) => set((s) => ({ documents: [d, ...s.documents] })),
  reset: () => set({ messages: [], activity: [], agents: AGENTS }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
