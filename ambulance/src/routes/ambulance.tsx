import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { StoreHydrator } from "@/components/StoreHydrator";
import { LiveMap } from "@/components/LiveMap";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/ambulance")({
  component: AmbulanceDashboard,
});

function AmbulanceDashboard() {
  const cases = useStore((s) => s.cases);
  const list = Object.values(cases).filter((c) => c.ambulance).sort((a, b) => b.createdAt - a.createdAt);
  const active = list[0];
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen">
      <StoreHydrator />
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-warning">Ambulance Unit</div>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              {active?.ambulance?.callsign ?? "Standby"}
            </h1>
          </div>
          {active?.ambulance && (
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">ETA</div>
              <div className="font-display text-5xl font-bold tabular-nums text-warning">
                {active.ambulance.etaMin}<span className="text-base ml-1 text-muted-foreground">min</span>
              </div>
            </div>
          )}
        </div>

        {!active ? (
          <div className="mt-8 glass rounded-2xl p-12 text-center text-muted-foreground">
            No active dispatch. Waiting for the next call.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
            <div className="glass rounded-2xl overflow-hidden">
              {mounted && <LiveMap caseData={active} className="h-[600px] w-full" />}
            </div>
            <div className="space-y-4">
              <Section label="Pickup">
                <div className="font-semibold">{active.patient.name}, {active.patient.age}</div>
                <div className="text-xs text-muted-foreground">{active.location.label}</div>
              </Section>
              <Section label="Destination">
                <div className="font-semibold">{active.hospital?.name}</div>
                <div className="text-xs text-muted-foreground">ICU beds: {active.hospital?.icuBeds}</div>
              </Section>
              <Section label="Patient brief">
                <div className="text-sm text-foreground/90">{active.triage?.condition}</div>
                <div className="mt-1 text-xs text-muted-foreground">{active.triage?.reasoning}</div>
              </Section>
              <Section label="Vitals (auto-stream)">
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <Mini label="BP" v={active.vitals?.bp ?? "—"} />
                  <Mini label="HR" v={active.vitals?.hr ? String(active.vitals.hr) : "—"} />
                  <Mini label="SpO₂" v={active.vitals?.spo2 ? `${active.vitals.spo2}%` : "—"} />
                </div>
              </Section>
              <div className="glass rounded-2xl p-4">
                <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-warning via-emergency to-medical transition-all duration-500"
                    style={{ width: `${Math.round((active.routeProgress ?? 0) * 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>Depot</span>
                  <span>{Math.round((active.routeProgress ?? 0) * 100)}%</span>
                  <span>{active.hospital?.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
function Mini({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded-lg bg-surface p-2.5 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-bold tabular-nums">{v}</div>
    </div>
  );
}
