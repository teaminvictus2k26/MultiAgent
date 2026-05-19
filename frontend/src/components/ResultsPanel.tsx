import type { AnalyzeResponse } from "@/lib/api";
import { AlertTriangle, Activity, FlaskConical, FileText, ListChecks, Database } from "lucide-react";
import { cn } from "@/lib/utils";

const severityTone: Record<string, string> = {
  low: "bg-[oklch(0.65_0.16_155/0.12)] text-[oklch(0.4_0.16_155)] border-[oklch(0.65_0.16_155/0.3)]",
  moderate: "bg-[oklch(0.75_0.15_75/0.15)] text-[oklch(0.45_0.15_75)] border-[oklch(0.75_0.15_75/0.3)]",
  high: "bg-destructive/10 text-destructive border-destructive/30",
  critical: "bg-destructive/15 text-destructive border-destructive/40",
};

export function ResultsPanel({ result }: { result: AnalyzeResponse }) {
  const { classification, medical, research, task_team, startup, automated_research, pipeline } = result;

  return (
    <div className="space-y-6">
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5"
        style={{ boxShadow: "var(--shadow-soft)" }}
      >
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Classification
          </p>
          <h2 className="mt-1 text-2xl font-semibold capitalize text-foreground">
            {classification.category}
          </h2>
          {classification.reasoning && (
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              {classification.reasoning}
            </p>
          )}
        </div>
        <div className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary uppercase">
          {pipeline} Pipeline
        </div>
      </div>

      {pipeline === "medical" && medical && (
        <div className="grid gap-4 md:grid-cols-2">
          {medical.triage && (
            <Card icon={<AlertTriangle className="h-4 w-4" />} title="Triage">
              <span
                className={cn(
                  "inline-flex rounded-md border px-2.5 py-1 text-xs font-medium capitalize",
                  severityTone[medical.severity ?? "low"],
                )}
              >
                {medical.severity ?? "low"} · {medical.triage}
              </span>
            </Card>
          )}
          {medical.symptoms?.length ? (
            <Card icon={<Activity className="h-4 w-4" />} title="Symptoms">
              <Tags items={medical.symptoms} />
            </Card>
          ) : null}
          {medical.diseases?.length ? (
            <Card icon={<FlaskConical className="h-4 w-4" />} title="Conditions">
              <Tags items={medical.diseases} />
            </Card>
          ) : null}
          {medical.abnormal_values?.length ? (
            <Card icon={<ListChecks className="h-4 w-4" />} title="Abnormal Values" wide>
              <ul className="divide-y divide-border text-sm">
                {medical.abnormal_values.map((v, i) => (
                  <li key={i} className="flex items-center justify-between py-2">
                    <span className="font-medium text-foreground">{v.name}</span>
                    <span className="text-muted-foreground">
                      {v.value}
                      {v.reference ? ` (ref ${v.reference})` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          {medical.summary && (
            <Card icon={<FileText className="h-4 w-4" />} title="Doctor Summary" wide>
              <p className="text-sm leading-relaxed text-foreground/90">{medical.summary}</p>
            </Card>
          )}
        </div>
      )}

      {pipeline === "rag" && research && (
        <div className="space-y-4">
          {research.summary && (
            <Card icon={<FileText className="h-4 w-4" />} title="Summary" wide>
              <p className="text-sm leading-relaxed text-foreground/90">{research.summary}</p>
            </Card>
          )}
          {research.key_points?.length ? (
            <Card icon={<ListChecks className="h-4 w-4" />} title="Key Points" wide>
              <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/90">
                {research.key_points.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            </Card>
          ) : null}
          {research.citations?.length ? (
            <Card icon={<Database className="h-4 w-4" />} title="Retrieved Chunks" wide>
              <div className="space-y-2 text-sm">
                {research.citations.map((c, i) => (
                  <div key={i} className="rounded-lg border bg-secondary/40 p-3">
                    <div className="mb-1 text-xs text-muted-foreground">
                      score {c.score?.toFixed(3) ?? "—"}
                    </div>
                    <p className="text-foreground/90">{c.chunk}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      )}

      {pipeline === "task" && task_team && (
        <div className="space-y-4">
          <Card icon={<ListChecks className="h-4 w-4" />} title="Plan" wide>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{task_team.plan}</p>
          </Card>
          <Card icon={<Activity className="h-4 w-4" />} title="Execution" wide>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{task_team.execution}</p>
          </Card>
          <Card icon={<FileText className="h-4 w-4" />} title="Review" wide>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{task_team.review}</p>
          </Card>
        </div>
      )}

      {pipeline === "startup" && startup && (
        <div className="space-y-4">
          <Card icon={<Activity className="h-4 w-4" />} title="CEO Vision" wide>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{startup.vision}</p>
          </Card>
          <Card icon={<Database className="h-4 w-4" />} title="CTO Architecture" wide>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{startup.architecture}</p>
          </Card>
          <Card icon={<ListChecks className="h-4 w-4" />} title="PM Scoping" wide>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{startup.scoping}</p>
          </Card>
        </div>
      )}

      {pipeline === "research" && automated_research && (
        <div className="space-y-4">
          <Card icon={<ListChecks className="h-4 w-4" />} title="Search Queries" wide>
            <Tags items={automated_research.search_queries ?? []} />
          </Card>
          <Card icon={<FileText className="h-4 w-4" />} title="Summary" wide>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{automated_research.summary}</p>
          </Card>
          <Card icon={<FlaskConical className="h-4 w-4" />} title="Presentation" wide>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{automated_research.presentation}</p>
          </Card>
        </div>
      )}
    </div>
  );
}

function Card({
  icon,
  title,
  children,
  wide,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-5",
        wide && "md:col-span-2",
      )}
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

function Tags({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t, i) => (
        <span
          key={i}
          className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground"
        >
          {t}
        </span>
      ))}
    </div>
  );
}