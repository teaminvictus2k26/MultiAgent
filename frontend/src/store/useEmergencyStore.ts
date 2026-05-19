import { create } from "zustand";
import type { EmergencyCase, AgentLogEntry, CaseStatus } from "@/lib/emergencyTypes";

interface EmergencyState {
  cases: Record<string, EmergencyCase>;
  activeCaseId: string | null;
  setCase: (c: EmergencyCase) => void;
  updateCase: (id: string, patch: Partial<EmergencyCase>) => void;
  pushLog: (id: string, entry: AgentLogEntry) => void;
  setStatus: (id: string, status: CaseStatus) => void;
  setActive: (id: string | null) => void;
  clearAll: () => void;
}

const STORAGE_KEY = "medirelay.cases.v1";

// Cross-tab broadcast channel (shared with ambulance app)
const CHANNEL = typeof window !== "undefined" && "BroadcastChannel" in window
  ? new BroadcastChannel("medirelay")
  : null;

function persist(cases: Record<string, EmergencyCase>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch {}
}

function broadcast(cases: Record<string, EmergencyCase>) {
  CHANNEL?.postMessage({ type: "STATE", cases });
}

function loadInitialCases(): Record<string, EmergencyCase> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const useEmergencyStore = create<EmergencyState>((set, get) => ({
  cases: loadInitialCases(),
  activeCaseId: null,
  setCase: (c) => {
    const cases = { ...get().cases, [c.id]: c };
    persist(cases);
    broadcast(cases);
    set({ cases, activeCaseId: c.id });
  },
  updateCase: (id, patch) => {
    const existing = get().cases[id];
    if (!existing) return;
    const updated = { ...existing, ...patch };
    const cases = { ...get().cases, [id]: updated };
    persist(cases);
    broadcast(cases);
    set({ cases });
  },
  pushLog: (id, entry) => {
    const existing = get().cases[id];
    if (!existing) return;
    const updated = { ...existing, agentLog: [...existing.agentLog, entry] };
    const cases = { ...get().cases, [id]: updated };
    persist(cases);
    broadcast(cases);
    set({ cases });
  },
  setStatus: (id, status) => {
    const existing = get().cases[id];
    if (!existing) return;
    const updated = { ...existing, status };
    const cases = { ...get().cases, [id]: updated };
    persist(cases);
    broadcast(cases);
    set({ cases });
  },
  setActive: (id) => set({ activeCaseId: id }),
  clearAll: () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    const cases = {} as Record<string, EmergencyCase>;
    broadcast(cases);
    set({ cases, activeCaseId: null });
  }
}));

// Listen for cross-tab state updates from ambulance app or other portal tabs
if (typeof window !== "undefined") {
  CHANNEL?.addEventListener("message", (e: MessageEvent) => {
    if (e.data?.type === "STATE") {
      useEmergencyStore.setState({ cases: e.data.cases });
    }
  });

  // Also listen for localStorage changes from other tabs (fallback)
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        useEmergencyStore.setState({ cases: JSON.parse(e.newValue) });
      } catch {}
    }
  });
}
