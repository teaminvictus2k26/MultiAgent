import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { TopNav } from "@/components/TopNav";
import { StoreHydrator } from "@/components/StoreHydrator";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/control")({
  component: ControlCenter,
});

const AGENTS = ["TRIAGE", "HOSPITAL", "AMBULANCE", "DOCTOR", "SYSTEM"] as const;
const COLORS: Record<string, string> = {
  TRIAGE: "text-emergency border-emergency/40 bg-emergency/10",
  HOSPITAL: "text-medical border-medical/40 bg-medical/10",
  AMBULANCE: "text-warning border-warning/40 bg-warning/10",
  DOCTOR: "text-primary border-primary/40 bg-primary/10",
  SYSTEM: "text-muted-foreground border-border bg-surface",
};

function ControlCenter() {
  const cases = useStore((s) => s.cases);
  const list = Object.values(cases).sort((a, b) => b.createdAt - a.createdAt);

  // Flatten logs across all cases
  const allLogs = list
    .flatMap((c) => (Array.isArray(c.agentLog) ? c.agentLog : []).map((l) => ({ ...l, caseId: c.id, patient: c.patient.name })))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 80);

  // Agent activity counts (last 60s)
  const now = Date.now();
  const activity: Record<string, number> = {};
  allLogs.forEach((l) => {
    if (now - l.ts < 60_000) activity[l.agent] = (activity[l.agent] ?? 0) + 1;
  });

  return (
    <div className="min-h-screen">
      <StoreHydrator />
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">AI Control Center</div>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Agent orchestration</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> {list.length} active cases
          </div>
        </div>

        {/* Agent grid */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-3">
          {AGENTS.map((a) => {
            const count = activity[a] ?? 0;
            const isHot = count > 0;
            return (
              <motion.div
                key={a}
                layout
                className={`relative overflow-hidden rounded-2xl border p-4 ${COLORS[a]}`}
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-80">{a}_AGENT</div>
                <div className="mt-2 font-display text-3xl font-bold tabular-nums">{count}</div>
                <div className="text-[10px] uppercase tracking-wider opacity-70">events / 60s</div>
                {isHot && (
                  <div className="absolute top-3 right-3 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
          {/* Decision timeline */}
          <div className="glass rounded-2xl p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Decision timeline
            </div>
            <div className="mt-3 font-mono text-xs space-y-1 max-h-[600px] overflow-auto">
              <AnimatePresence initial={false}>
                {allLogs.length === 0 && (
                  <div className="text-muted-foreground py-8 text-center">Awaiting first dispatch…</div>
                )}
                {allLogs.map((l) => (
                  <motion.div
                    key={l.ts + l.message + l.caseId}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3 py-1 border-b border-border/30 last:border-0"
                  >
                    <span className="text-muted-foreground tabular-nums">
                      {new Date(l.ts).toLocaleTimeString([], { hour12: false })}
                    </span>
                    <span className={`uppercase tracking-wider min-w-[80px] ${
                      l.level === "critical" ? "text-emergency"
                      : l.level === "success" ? "text-success"
                      : l.level === "warn" ? "text-warning"
                      : "text-medical"
                    }`}>{l.agent}</span>
                    <span className="text-foreground/90 flex-1">{l.message}</span>
                    <span className="text-muted-foreground opacity-60">#{l.caseId.slice(0, 6)}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Active cases */}
          <div className="space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Active cases ({list.length})
            </div>
            {list.length === 0 && (
              <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
                No cases yet.
              </div>
            )}
            {list.map((c) => (
              <div key={c.id} className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">#{c.id.slice(0, 6)}</span>
                  <span className={`font-mono text-[10px] uppercase tracking-wider ${
                    c.triage?.severity === "CRITICAL" ? "text-emergency"
                    : c.triage?.severity === "URGENT" ? "text-warning" : "text-medical"
                  }`}>{c.triage?.severity ?? "…"}</span>
                </div>
                <div className="mt-1 font-semibold">{c.patient.name}</div>
                <div className="text-xs text-muted-foreground">{c.triage?.condition ?? "Triage in progress…"}</div>
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
                  <span className="text-muted-foreground">{c.status.replace(/_/g, " ")}</span>
                  {c.ambulance && <span className="text-warning">ETA {c.ambulance.etaMin}m</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
