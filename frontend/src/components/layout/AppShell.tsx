import { Link, useRouterState } from "@tanstack/react-router";
import {
  Hexagon, MessageSquare, LayoutDashboard, FileText, Plus,
  Bot, Activity, Ambulance
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { AgentBadge } from "@/components/agents/AgentBadge";

const nav = [
  { to: "/workspace", label: "Workspace", icon: MessageSquare },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/travel", label: "Travel Planner", icon: Hexagon },
  { to: "/emergency", label: "Emergency Dispatch", icon: Ambulance },
] as const;

export function AppShell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const agents = useAppStore((s) => s.agents);
  const reset = useAppStore((s) => s.reset);

  return (
    <div className="aurora-bg min-h-screen">
      <div className="grid min-h-screen grid-cols-[260px_1fr] lg:grid-cols-[260px_1fr_340px]">
        {/* LEFT SIDEBAR */}
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-border/60 bg-background/40 backdrop-blur-xl md:flex">
          <Link to="/" className="flex h-16 items-center gap-2 border-b border-border/60 px-5 hover:bg-secondary/40 transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--gradient-hero)" }}>
              <Hexagon className="h-4 w-4 text-background" />
            </div>
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold">Nexus</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Agent OS</p>
            </div>
          </Link>

          <div className="px-3 py-4">
            <button
              onClick={() => {
                reset();
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-primary-foreground"
              style={{ background: "var(--gradient-hero)" }}
            >
              <Plus className="h-4 w-4" /> New session
            </button>
          </div>

          <nav className="px-2">
            {nav.map((n) => {
              const active = pathname === n.to;
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 px-4 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <div className="flex items-center gap-1.5"><Bot className="h-3 w-3" /> Agents</div>
          </div>
          <div className="mt-2 flex-1 overflow-y-auto space-y-1 px-2 pb-4">
            {agents.map((a) => <AgentBadge key={a.id} agent={a} />)}
          </div>

          <div className="mt-auto p-4">
            <div className="glass rounded-xl p-3">
              <div className="flex items-center gap-2 text-xs">
                <Activity className="h-3.5 w-3.5 text-accent" />
                <span className="font-medium">Pipeline status</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Backend</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent pulse-glow" /> Online
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="min-w-0">{children}</main>

        {/* RIGHT */}
        {right && (
          <aside className="sticky top-0 hidden h-screen border-l border-border/60 bg-background/40 backdrop-blur-xl lg:block">
            {right}
          </aside>
        )}
      </div>
    </div>
  );
}
