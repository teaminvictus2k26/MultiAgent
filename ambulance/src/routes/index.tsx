import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { TopNav } from "@/components/TopNav";
import { StoreHydrator } from "@/components/StoreHydrator";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <StoreHydrator />
      <TopNav />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[900px] rounded-full bg-emergency/20 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emergency/40 bg-emergency/10 px-3 py-1 text-xs font-mono uppercase tracking-[0.2em] text-emergency">
              <span className="h-1.5 w-1.5 rounded-full bg-emergency animate-pulse" />
              Live AI Coordination
            </div>
            <h1 className="mt-6 font-display text-5xl sm:text-7xl font-semibold leading-[1.02] tracking-tight">
              When seconds decide,
              <br />
              <span className="bg-gradient-to-r from-emergency via-medical to-primary bg-clip-text text-transparent">
                MediRelay coordinates
              </span>{" "}
              the rescue.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              A multi-agent AI control plane that connects patients, ambulances, hospitals and doctors
              in real time — turning chaotic emergencies into a synchronized, life-saving sequence.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/emergency"
                className="group relative inline-flex items-center gap-3 rounded-lg bg-emergency px-6 py-4 text-base font-semibold text-emergency-foreground glow-emergency transition hover:scale-[1.02]"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-white/80 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                </span>
                Report Emergency
                <span className="opacity-60 group-hover:translate-x-1 transition">→</span>
              </Link>
              <Link
                to="/control"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-6 py-4 text-base font-medium hover:bg-surface-elevated transition"
              >
                Open AI Control Center
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { k: "20–40 min", v: "Coordination time lost today" },
              { k: "< 10 min", v: "MediRelay dispatch window" },
              { k: "4 AI", v: "Agents working in parallel" },
              { k: "Realtime", v: "WebSocket-style sync" },
            ].map((s) => (
              <div key={s.k} className="glass rounded-xl p-4">
                <div className="font-mono text-2xl font-bold text-foreground">{s.k}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agents */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
          Four AI agents. One mission.
        </h2>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Each agent owns a domain and they hand off in milliseconds — not minutes.
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { tag: "TRIAGE", title: "Severity & specialist", desc: "Reads symptoms, ages, history. Classifies critical / urgent / moderate.", color: "emergency" },
            { tag: "HOSPITAL", title: "Bed & ETA matcher", desc: "Scans live ICU & ER capacity, specialist availability, traffic-aware distance.", color: "medical" },
            { tag: "AMBULANCE", title: "Route optimizer", desc: "Picks nearest unit, draws live route, streams vitals during transit.", color: "warning" },
            { tag: "DOCTOR", title: "Briefing & prep", desc: "Generates structured handover so the cath lab / OR is ready on arrival.", color: "primary" },
          ].map((a, i) => (
            <motion.div
              key={a.tag}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              className="glass relative overflow-hidden rounded-xl p-5 hover:border-primary/40 transition"
            >
              <div className={`font-mono text-[10px] uppercase tracking-[0.2em] text-${a.color}`}>
                {a.tag}_AGENT
              </div>
              <div className="mt-2 font-display text-lg font-semibold">{a.title}</div>
              <div className="mt-2 text-sm text-muted-foreground">{a.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
        MediRelay · Built for the Golden Hour
      </footer>
    </div>
  );
}
