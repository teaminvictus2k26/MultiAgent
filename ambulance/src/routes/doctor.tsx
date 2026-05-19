import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopNav } from "@/components/TopNav";
import { StoreHydrator } from "@/components/StoreHydrator";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/doctor")({
  component: DoctorDashboard,
});

function DoctorDashboard() {
  const cases = useStore((s) => s.cases);
  const updateCase = useStore((s) => s.updateCase);
  const list = Object.values(cases)
    .filter((c) => c.hospital && c.triage)
    .sort((a, b) => (severityRank(b.triage!.severity) - severityRank(a.triage!.severity)) || b.createdAt - a.createdAt);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedId && list[0]) setSelectedId(list[0].id);
  }, [list, selectedId]);
  const selected = selectedId ? cases[selectedId] : null;

  const [accepted, setAccepted] = useState<Record<string, boolean>>({});

  return (
    <div className="min-h-screen">
      <StoreHydrator />
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Doctor Console</div>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Incoming emergencies</h1>
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            {list.length} active · auto-refresh
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
          {/* Queue */}
          <div className="space-y-2 max-h-[700px] overflow-auto pr-1">
            <AnimatePresence initial={false}>
              {list.length === 0 && (
                <div className="glass rounded-xl p-6 text-center text-sm text-muted-foreground">
                  No incoming cases. All quiet.
                </div>
              )}
              {list.map((c) => {
                const sev = c.triage!.severity;
                const isSel = c.id === selectedId;
                return (
                  <motion.button
                    layout
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`w-full text-left glass rounded-xl p-4 transition border ${
                      isSel ? "border-primary/60 ring-1 ring-primary/40" : ""
                    } ${sev === "CRITICAL" ? "border-emergency/50" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-[10px] uppercase tracking-wider ${
                        sev === "CRITICAL" ? "text-emergency" : sev === "URGENT" ? "text-warning" : "text-medical"
                      }`}>
                        {sev} · {c.ambulance?.etaMin ?? "–"} min
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">#{c.id.slice(0, 6)}</span>
                    </div>
                    <div className="mt-1.5 font-semibold">{c.patient.name}, {c.patient.age} · {c.patient.gender}</div>
                    <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.triage!.condition}</div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Detail */}
          {selected ? (
            <div className="space-y-4">
              <div className="glass rounded-2xl p-6 relative overflow-hidden scanline">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emergency">Patient handover</div>
                    <h2 className="mt-2 font-display text-3xl font-semibold">{selected.patient.name}</h2>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {selected.patient.age} · {selected.patient.gender} · History: {selected.patient.medicalHistory || "none"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">ETA</div>
                    <div className="font-display text-4xl font-bold tabular-nums text-emergency">
                      {selected.ambulance?.etaMin ?? "–"}
                    </div>
                    <div className="text-xs text-muted-foreground">minutes</div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Tile label="Severity" value={selected.triage!.severity} accent="emergency" />
                  <Tile label="Suspected" value={selected.triage!.condition} />
                  <Tile label="Specialist" value={selected.triage!.specialist} />
                  <Tile label="Window" value={`< ${selected.triage!.timeSensitivityMin} min`} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vitals */}
                <div className="glass rounded-2xl p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-warning">Live vitals</div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <BigVital label="BP" value={selected.vitals?.bp ?? "—"} />
                    <BigVital label="HR" value={selected.vitals ? String(selected.vitals.hr) : "—"} />
                    <BigVital label="SpO₂" value={selected.vitals ? `${selected.vitals.spo2}%` : "—"} />
                  </div>
                </div>
                {/* Prep */}
                <div className="glass rounded-2xl p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-medical">Preparation checklist</div>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {selected.triage!.preparationSteps.map((p) => (
                      <li key={p} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-medical" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {selected.triage!.requiredEquipment.map((eq) => (
                      <span key={eq} className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-mono">
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setAccepted({ ...accepted, [selected.id]: true });
                    updateCase(selected.id, {});
                  }}
                  className={`flex-1 rounded-xl px-5 py-4 font-semibold transition ${
                    accepted[selected.id]
                      ? "bg-success/20 text-success border border-success/50"
                      : "bg-success text-background hover:opacity-90"
                  }`}
                >
                  {accepted[selected.id] ? "✓ Accepted — Bay prepared" : "Accept Patient"}
                </button>
                <button className="rounded-xl border border-border bg-surface px-5 py-4 font-semibold hover:bg-surface-elevated">
                  Reassign
                </button>
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
              Select a case to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function severityRank(s: string) {
  return ({ CRITICAL: 4, URGENT: 3, MODERATE: 2, LOW: 1 } as const)[s as "CRITICAL"] ?? 0;
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: "emergency" }) {
  return (
    <div className={`rounded-lg p-3 border ${accent === "emergency" ? "bg-emergency/10 border-emergency/40" : "bg-surface border-border"}`}>
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-semibold ${accent === "emergency" ? "text-emergency" : ""}`}>{value}</div>
    </div>
  );
}

function BigVital({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface p-4 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
