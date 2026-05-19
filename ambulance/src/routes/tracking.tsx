import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopNav } from "@/components/TopNav";
import { StoreHydrator } from "@/components/StoreHydrator";
import { LiveMap } from "@/components/LiveMap";
import { StatusTimeline } from "@/components/StatusTimeline";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/tracking")({
  component: TrackingPage,
});

function TrackingPage() {
  const cases = useStore((s) => s.cases);
  const activeId = useStore((s) => s.activeCaseId);
  const setActive = useStore((s) => s.setActive);

  const list = Object.values(cases).sort((a, b) => b.createdAt - a.createdAt);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = activeId ? cases[activeId] : list[0];

  return (
    <div className="min-h-screen">
      <StoreHydrator />
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-medical">Live Tracking</div>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              Patient → Hospital relay
            </h1>
          </div>
          {list.length > 0 && (
            <select
              value={active?.id ?? ""}
              onChange={(e) => setActive(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono"
            >
              {list.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.id.slice(0, 6)} · {c.patient.name} · {c.status}
                </option>
              ))}
            </select>
          )}
        </div>

        {!active ? (
          <EmptyState />
        ) : (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="glass rounded-2xl p-4">
                <StatusTimeline status={active.status} />
              </div>
              <div className="glass rounded-2xl overflow-hidden">
                {mounted && <LiveMap caseData={active} className="h-[480px] w-full" />}
              </div>
            </div>

            <div className="space-y-4">
              {/* ETA card */}
              <motion.div layout className="glass rounded-2xl p-5 relative overflow-hidden scanline">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-medical">Ambulance</div>
                {active.ambulance ? (
                  <>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-display text-5xl font-bold tabular-nums">
                        {active.ambulance.etaMin}
                      </span>
                      <span className="text-sm text-muted-foreground">min ETA</span>
                    </div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">
                      {active.ambulance.callsign} · {active.ambulance.speedKmh} km/h
                    </div>
                    <div className="mt-3 h-1.5 w-full bg-surface rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-emergency to-medical"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round((active.routeProgress ?? 0) * 100)}%` }}
                        transition={{ ease: "linear" }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="mt-3 text-sm text-muted-foreground">Assigning unit…</div>
                )}
              </motion.div>

              {/* Triage card */}
              {active.triage && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emergency">AI Triage</div>
                    <SeverityPill sev={active.triage.severity} />
                  </div>
                  <div className="mt-2 font-display text-xl font-semibold">{active.triage.condition}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{active.triage.reasoning}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Stat label="Specialist" value={active.triage.specialist} />
                    <Stat label="Window" value={`< ${active.triage.timeSensitivityMin} min`} />
                  </div>
                </motion.div>
              )}

              {/* Hospital card */}
              {active.hospital && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-medical">Hospital Matched</div>
                  <div className="mt-2 font-display text-xl font-semibold">{active.hospital.name}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <Stat label="ICU beds" value={String(active.hospital.icuBeds)} />
                    <Stat label="ER beds" value={String(active.hospital.emergencyBeds)} />
                    <Stat label="Rating" value={`${active.hospital.rating} ★`} />
                     <Stat label="ID" value={(active.hospital.id || "").toUpperCase()} />
                  </div>
                </motion.div>
              )}

              {/* Vitals */}
              {active.vitals && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-warning">Live Vitals</div>
                  <div className="mt-2 grid grid-cols-3 gap-2 font-mono">
                    <Vital label="BP" value={active.vitals.bp} />
                    <Vital label="HR" value={String(active.vitals.hr)} />
                    <Vital label="SpO₂" value={`${active.vitals.spo2}%`} />
                  </div>
                </motion.div>
              )}

              {/* Agent log */}
              <div className="glass rounded-2xl p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Agent log</div>
                <div className="mt-3 space-y-2 max-h-72 overflow-auto pr-1">
                  <AnimatePresence initial={false}>
                    {(Array.isArray(active.agentLog) ? active.agentLog : []).slice().reverse().map((l) => (
                      <motion.div
                        key={l.ts + l.message}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-2 text-xs"
                      >
                        <span className={`font-mono uppercase tracking-wider ${
                          l.level === "critical" ? "text-emergency"
                          : l.level === "success" ? "text-success"
                          : l.level === "warn" ? "text-warning"
                          : "text-medical"
                        }`}>{l.agent}</span>
                        <span className="text-foreground/90">{l.message}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 glass rounded-2xl p-12 text-center">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">No active case</div>
      <h2 className="mt-3 font-display text-2xl font-semibold">Standing by</h2>
      <p className="mt-2 text-muted-foreground">Report an emergency to see the relay light up.</p>
      <Link
        to="/emergency"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emergency px-5 py-3 text-sm font-semibold text-emergency-foreground glow-emergency"
      >
        Report Emergency →
      </Link>
    </div>
  );
}

function SeverityPill({ sev }: { sev: string }) {
  const map: Record<string, string> = {
    CRITICAL: "border-emergency/60 bg-emergency/15 text-emergency",
    URGENT: "border-warning/60 bg-warning/15 text-warning",
    MODERATE: "border-medical/60 bg-medical/15 text-medical",
    LOW: "border-success/60 bg-success/15 text-success",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${map[sev]}`}>
      {sev}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface p-2.5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-semibold truncate">{value}</div>
    </div>
  );
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface p-3 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
