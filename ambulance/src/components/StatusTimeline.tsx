import type { CaseStatus } from "@/lib/types";

const STEPS: { key: CaseStatus; label: string }[] = [
  { key: "CASE_CREATED", label: "Case Created" },
  { key: "TRIAGE_COMPLETED", label: "AI Triage" },
  { key: "HOSPITAL_ASSIGNED", label: "Hospital Matched" },
  { key: "AMBULANCE_ASSIGNED", label: "Ambulance Dispatched" },
  { key: "DOCTOR_ALERTED", label: "Doctor Briefed" },
  { key: "PATIENT_EN_ROUTE", label: "En Route" },
  { key: "PATIENT_ARRIVED", label: "Arrived" },
];

const ORDER = STEPS.map((s) => s.key);

export function StatusTimeline({ status }: { status: CaseStatus }) {
  const idx = ORDER.indexOf(status);
  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((s, i) => {
        const done = i <= idx;
        const active = i === idx;
        return (
          <li
            key={s.key}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition ${
              active
                ? "border-emergency/60 bg-emergency/15 text-emergency"
                : done
                ? "border-success/40 bg-success/10 text-success"
                : "border-border bg-surface text-muted-foreground"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emergency animate-pulse" : done ? "bg-success" : "bg-muted-foreground"}`} />
            {s.label}
          </li>
        );
      })}
    </ol>
  );
}
