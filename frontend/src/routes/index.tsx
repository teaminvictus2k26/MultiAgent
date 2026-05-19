import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, Stethoscope, Database, Brain, ShieldCheck,
  Zap, Workflow, Bot, FileSearch, Activity, Github,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { AgentNetwork } from "@/components/animations/AgentNetwork";
import { Particles } from "@/components/animations/Particles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexus — Multi-Agent AI Intelligence" },
      { name: "description", content: "Upload, classify, and analyze medical & research documents with collaborative AI agents." },
      { property: "og:title", content: "Nexus — Multi-Agent AI Intelligence" },
      { property: "og:description", content: "Futuristic agent OS for medical and research document intelligence." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="aurora-bg min-h-screen overflow-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-32 pb-20">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <Particles count={40} />
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="glass mx-auto inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent pulse-glow" />
            Multi-agent orchestration · live preview
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-display mx-auto mt-6 max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            The intelligence layer for <span className="text-gradient">every document</span> you handle.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Medical reports route through a full-context diagnosis pipeline. Everything else flows into a RAG knowledge engine.
            All in realtime, orchestrated by collaborative AI agents.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/workspace" className="group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground hover:scale-[1.02] transition-transform"
              style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-glow)" }}>
              Launch intelligence system <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/portal" className="glass inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium hover:bg-secondary/60 text-emergency">
              <ShieldCheck className="h-4 w-4" /> Staff Portal Login
            </Link>
            <a href="#architecture" className="glass inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium hover:bg-secondary/60">
              <Github className="h-4 w-4" /> View architecture
            </a>
          </motion.div>

          {/* Dashboard preview */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-16">
            <AgentNetwork />
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-wider text-accent">Capabilities</p>
          <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for serious intelligence work.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="glass-strong rounded-2xl p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section id="architecture" className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-accent">Architecture</p>
            <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Classify first. Route smart. Reason deeply.
            </h2>
            <p className="mt-4 text-muted-foreground">
              A lightweight classifier inspects every upload. Medical documents stream through diagnosis + triage agents that retain full context.
              Everything else is chunked into a vector store and answered with citations.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                ["Classifier", "Filename + keywords + LLM verification"],
                ["Medical pipeline", "Full-context reasoning, no chunk loss"],
                ["RAG pipeline", "Vector search with semantic citations"],
                ["Memory agent", "Long-term recall across sessions"],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span><span className="font-medium">{t}.</span> <span className="text-muted-foreground">{d}</span></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-strong relative overflow-hidden rounded-2xl p-6">
            <div className="absolute inset-0 grid-bg opacity-30" />
            <div className="relative space-y-4">
              {pipelineSteps.map((s, i) => (
                <div key={s.label} className="glass flex items-center gap-3 rounded-xl p-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg text-background text-xs font-semibold" style={{ background: "var(--gradient-hero)" }}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.body}</p>
                  </div>
                  <s.icon className="h-4 w-4 text-accent" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="glass-strong relative overflow-hidden rounded-3xl p-10 text-center">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <Particles count={20} />
          <div className="relative">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Ready to see it think?</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Open the workspace and watch agents collaborate live as they analyze your documents.
            </p>
            <Link to="/workspace" className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground hover:scale-[1.02] transition-transform"
              style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-glow)" }}>
              Launch workspace <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Nexus Intelligence · Built for the agentic era.</p>
          <p>Backend: <code className="rounded bg-secondary px-1.5 py-0.5">http://localhost:8000</code></p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  { title: "Realtime agent collaboration", body: "Watch classifier, diagnosis, triage and summary agents trade context live.", icon: Bot },
  { title: "Context-preserving medical pipeline", body: "Reports are reasoned over in full — no critical detail lost to chunking.", icon: Stethoscope },
  { title: "Vector knowledge engine", body: "Non-medical documents flow into a RAG store with semantic retrieval.", icon: Database },
  { title: "Smart routing", body: "Filename heuristics + keyword extraction + LLM verification on every upload.", icon: Workflow },
  { title: "Streaming responses", body: "Token-level streaming with typing animation and agent attribution.", icon: Zap },
  { title: "Memory across sessions", body: "A dedicated memory agent recalls patient and project context over time.", icon: Brain },
];

const pipelineSteps = [
  { label: "Upload", body: "PDF, image, text — drag and drop.", icon: FileSearch },
  { label: "Classify", body: "Detects medical, research, legal, academic, general.", icon: Workflow },
  { label: "Route", body: "Medical → diagnosis · Other → RAG retrieval.", icon: ArrowRight },
  { label: "Reason", body: "Triage, summarize, cite, recommend.", icon: Activity },
  { label: "Deliver", body: "Beautiful structured insights, streamed live.", icon: Sparkles },
];
