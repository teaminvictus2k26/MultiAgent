import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import { StoreHydrator } from "@/components/StoreHydrator";
import { HOSPITALS } from "@/lib/hospitals";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/hospital")({
  component: HospitalAdmin,
});

function HospitalAdmin() {
  const cases = useStore((s) => s.cases);
  const incomingByHospital: Record<string, number> = {};
  Object.values(cases).forEach((c) => {
    if (c.hospital && c.status !== "PATIENT_ARRIVED") {
      incomingByHospital[c.hospital.id] = (incomingByHospital[c.hospital.id] ?? 0) + 1;
    }
  });

  return (
    <div className="min-h-screen">
      <StoreHydrator />
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-medical">Hospital Network</div>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Live capacity dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          The Hospital Finder Agent reads these numbers in real time to route every incoming case.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {HOSPITALS.map((h) => {
            const incoming = incomingByHospital[h.id] ?? 0;
            const icuPct = Math.max(0, Math.min(100, (h.icuBeds / 6) * 100));
            const erPct = Math.max(0, Math.min(100, (h.emergencyBeds / 15) * 100));
            return (
              <div key={h.id} className="glass rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-xl font-semibold">{h.name}</div>
                     <div className="mt-1 text-xs text-muted-foreground">{h.rating} ★ · ID {(h.id || "").toUpperCase()}</div>
                  </div>
                  <div className={`rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${
                    incoming > 0 ? "border-emergency/50 bg-emergency/10 text-emergency" : "border-success/40 bg-success/10 text-success"
                  }`}>
                    {incoming > 0 ? `${incoming} incoming` : "ready"}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <Bar label="ICU beds" value={h.icuBeds} pct={icuPct} accent="emergency" />
                  <Bar label="Emergency beds" value={h.emergencyBeds} pct={erPct} accent="medical" />
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {h.specialists.map((s) => (
                    <span key={s} className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-mono">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value, pct, accent }: { label: string; value: number; pct: number; accent: "emergency" | "medical" }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold">{value} free</span>
      </div>
      <div className="mt-1.5 h-2 w-full bg-surface rounded-full overflow-hidden">
        <div
          className={`h-full ${accent === "emergency" ? "bg-emergency" : "bg-medical"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
