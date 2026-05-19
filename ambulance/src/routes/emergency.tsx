import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TopNav } from "@/components/TopNav";
import { StoreHydrator } from "@/components/StoreHydrator";
import { useStore } from "@/lib/store";
import { triagePatient } from "@/lib/triage.functions";
import { dispatchPipeline } from "@/lib/dispatch";
import type { EmergencyCase } from "@/lib/types";

export const Route = createFileRoute("/emergency")({
  component: EmergencyPage,
});

const SCENARIOS = [
  {
    label: "Cardiac Event",
    name: "Lakshmi Rao",
    age: 58,
    gender: "Female",
    history: "Hypertension, mild diabetes",
    symptoms: "Severe chest pain radiating to left arm, sweating, difficulty breathing for 15 minutes.",
  },
  {
    label: "Stroke",
    name: "Arun Mehta",
    age: 67,
    gender: "Male",
    history: "Atrial fibrillation on warfarin",
    symptoms: "Sudden facial drooping on right side, slurred speech, weakness in right arm.",
  },
  {
    label: "Road Accident",
    name: "Priya Singh",
    age: 24,
    gender: "Female",
    history: "None",
    symptoms: "Two-wheeler crash. Conscious. Severe left leg pain, deep laceration on forearm, bleeding heavily.",
  },
  {
    label: "Anaphylaxis",
    name: "Karan Iyer",
    age: 9,
    gender: "Male",
    history: "Known peanut allergy",
    symptoms: "Hives all over body, swollen lips, wheezing, struggling to breathe after lunch at school.",
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function EmergencyPage() {
  const navigate = useNavigate();
  const triage = useServerFn(triagePatient);
  const setCase = useStore((s) => s.setCase);
  const pushLog = useStore((s) => s.pushLog);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "Lakshmi Rao",
    age: "58",
    gender: "Female",
    history: "Hypertension, mild diabetes",
    symptoms: "",
  });

  const [userLocation, setUserLocation] = useState({
    lat: 16.9902,
    lng: 73.3120,
    label: "Ratnagiri", // Fallback
  });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setUserLocation({
            lat,
            lng,
            label: "Fetching address…",
          });

          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`, {
            headers: {
              "User-Agent": "MediRelay/1.0"
            }
          })
            .then((res) => {
              if (res.ok) return res.json();
              throw new Error("Nominatim error");
            })
            .then((data) => {
              const label = data.display_name ? data.display_name.split(",").slice(0, 3).join(",") : "Current Location";
              setUserLocation({ lat, lng, label });
            })
            .catch(() => {
              setUserLocation({ lat, lng, label: "Current Location" });
            });
        },
        (error) => {
          console.warn("Geolocation failed:", error);
        }
      );
    }
  }, []);

  function loadScenario(s: typeof SCENARIOS[number]) {
    setForm({
      name: s.name,
      age: String(s.age),
      gender: s.gender,
      history: s.history,
      symptoms: s.symptoms,
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.symptoms.trim()) return;
    setBusy(true);
    setErr(null);
    const id = uid();
    const caseData: EmergencyCase = {
      id,
      createdAt: Date.now(),
      patient: {
        name: form.name,
        age: Number(form.age) || 30,
        gender: form.gender,
        medicalHistory: form.history,
      },
      symptoms: form.symptoms,
      location: userLocation,
      status: "CASE_CREATED",
      agentLog: [
        { ts: Date.now(), agent: "SYSTEM", message: `Case ${id} created. Dispatching triage agent…`, level: "info" },
      ],
    };
    setCase(caseData);

    try {
      const result = await triage({
        data: {
          symptoms: form.symptoms,
          age: caseData.patient.age,
          gender: form.gender,
          medicalHistory: form.history,
          patient_lat: caseData.location.lat,
          patient_lng: caseData.location.lng,
        },
      });
      // Kick off the rest of the pipeline (fire-and-forget)
      dispatchPipeline(id, result);
      navigate({ to: "/tracking" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Triage failed";
      setErr(msg);
      pushLog(id, { ts: Date.now(), agent: "TRIAGE", message: msg, level: "warn" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <StoreHydrator />
      <TopNav />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-emergency">Step 01</div>
          <div className="h-px flex-1 bg-border" />
        </div>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Report an emergency
        </h1>
        <p className="mt-2 text-muted-foreground">
          Describe what's happening. Our Triage Agent will classify severity and alert the right hospital.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.label}
              onClick={() => loadScenario(s)}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:border-primary/50 hover:text-foreground transition"
            >
              ⚡ {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 glass rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Patient name">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="Full name"
              />
            </Field>
            <Field label="Age">
              <input
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                inputMode="numeric"
                className="input"
                placeholder="e.g. 58"
              />
            </Field>
            <Field label="Gender">
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="input"
              >
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </Field>
          </div>
          <Field label="Medical history">
            <input
              value={form.history}
              onChange={(e) => setForm({ ...form, history: e.target.value })}
              className="input"
              placeholder="Conditions, allergies, medications"
            />
          </Field>
          <Field label="Symptoms (what's happening right now?)" hint="The more specific, the faster the triage.">
            <textarea
              value={form.symptoms}
              onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
              rows={5}
              className="input resize-none"
              placeholder="e.g. Sudden chest pain, sweating, struggling to breathe…"
              required
            />
          </Field>

          {err && (
            <div className="rounded-lg border border-emergency/50 bg-emergency/10 p-3 text-sm text-emergency">
              {err}
            </div>
          )}

          <motion.button
            type="submit"
            disabled={busy}
            whileTap={{ scale: 0.98 }}
            className="group relative w-full overflow-hidden rounded-xl bg-emergency px-6 py-5 text-lg font-semibold text-emergency-foreground glow-emergency disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {busy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  AI agents coordinating…
                </>
              ) : (
                <>
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-white/80 animate-ping" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
                  </span>
                  Dispatch Emergency
                </>
              )}
            </span>
          </motion.button>
        </form>
      </div>
      <style>{`
        .input {
          width: 100%;
          background: var(--color-input);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          padding: 10px 14px;
          color: var(--color-foreground);
          font-family: var(--font-display);
          font-size: 14px;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px oklch(0.72 0.18 230 / 0.2);
        }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
        {hint && <span className="text-[11px] text-muted-foreground/70">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
