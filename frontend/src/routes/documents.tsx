import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAppStore } from "@/store/useAppStore";
import { FileText, Search, Stethoscope, BookOpen, Scale, GraduationCap, FileQuestion, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentRecord } from "@/types";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Nexus" },
      { name: "description", content: "Browse and analyze every uploaded document." },
    ],
  }),
  component: DocsPage,
});

const catIcon: Record<string, any> = {
  medical: Stethoscope, research: BookOpen, legal: Scale,
  academic: GraduationCap, financial: FileQuestion, general: FileText,
  task: FileText, startup: FileText
};

function DocsPage() {
  const documents = useAppStore((s) => s.documents);
  const [active, setActive] = useState<DocumentRecord | null>(null);
  const [query, setQuery] = useState("");
  const list = documents.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()));
  
  const Icon = active ? catIcon[active.category] ?? FileText : FileText;

  return (
    <AppShell>
      <div className="grid h-screen grid-cols-[320px_1fr]">
        <div className="border-r border-border/60 bg-background/40 backdrop-blur-xl">
          <div className="border-b border-border/60 p-4">
            <h2 className="font-display text-base font-semibold">Documents</h2>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </div>
          </div>
          <ul className="space-y-1 p-2">
            {list.map((d) => {
              const C = catIcon[d.category] || FileText;
              return (
                <li key={d.id}>
                  <button onClick={() => setActive(d)} className={cn("flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors", active?.id === d.id ? "bg-secondary" : "hover:bg-secondary/60")}>
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><C className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{d.category} · {d.pages}p</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="overflow-y-auto p-8">
          {active ? (
            <>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-accent">{active.category} document</p>
                  <h1 className="font-display mt-1 text-2xl font-semibold">{active.name}</h1>
                  <p className="text-xs text-muted-foreground">Uploaded {new Date(active.uploadedAt).toLocaleString()}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "var(--gradient-hero)" }}>
                  <Icon className="h-5 w-5 text-background" />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="glass-strong rounded-2xl p-6">
                  <h3 className="font-display text-sm font-semibold">Document text</h3>
                  <div className="mt-4 rounded-xl border border-border bg-background/60 p-4 max-h-[600px] overflow-auto">
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {active.analysis?.raw_text_preview ?? "No text preview available."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="glass-strong rounded-2xl p-6">
                    <h3 className="font-display text-sm font-semibold">AI insights</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{active.summary ?? active.analysis?.medical?.summary ?? active.analysis?.research?.summary ?? "Run analysis from the workspace to generate insights."}</p>
                  </div>
                  
                  {active.analysis?.medical?.symptoms && active.analysis.medical.symptoms.length > 0 && (
                    <div className="glass-strong rounded-2xl p-6">
                      <h3 className="font-display text-sm font-semibold">Extracted entities</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {active.analysis.medical.symptoms.map(t => (
                          <span key={t} className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {active.analysis?.medical?.abnormal_values && active.analysis.medical.abnormal_values.length > 0 && (
                    <div className="glass-strong rounded-2xl p-6">
                      <h3 className="font-display flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-[oklch(0.82_0.16_80)]" /> Abnormal values</h3>
                      <ul className="mt-3 divide-y divide-border text-sm">
                        {active.analysis.medical.abnormal_values.map((v, i) => (
                          <li key={i} className="flex items-center justify-between py-2">
                            <span>{v.name}</span>
                            <span className="text-muted-foreground">
                              {v.value} {v.severity === "high" || v.severity === "critical" ? <span className="text-destructive">({v.severity})</span> : null}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a document to view details
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
