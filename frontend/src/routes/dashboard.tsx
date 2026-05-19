import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { FileText, Stethoscope, Bot, Activity } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Nexus" },
      { name: "description", content: "Analytics and system health for your agent OS." },
    ],
  }),
  component: Dashboard,
});

import { useAppStore } from "@/store/useAppStore";
import { useMemo } from "react";

function Dashboard() {
  const documents = useAppStore((s) => s.documents);
  const agents = useAppStore((s) => s.agents);

  const { total, medicalCount, nonMedicalCount, split } = useMemo(() => {
    const total = documents.length;
    let medicalCount = 0;
    const categoryCounts: Record<string, number> = {};
    
    documents.forEach(d => {
      if (d.category === "medical") medicalCount++;
      categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
    });

    const splitData = Object.entries(categoryCounts).map(([name, value], i) => {
      const colors = ["oklch(0.78 0.18 295)", "oklch(0.82 0.18 165)", "oklch(0.7 0.16 220)", "oklch(0.78 0.14 70)", "oklch(0.6 0.2 20)"];
      return { name: name.charAt(0).toUpperCase() + name.slice(1), value, color: colors[i % colors.length] };
    });

    return { total, medicalCount, nonMedicalCount: total - medicalCount, split: splitData };
  }, [documents]);

  const trend = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => ({
      day: `D${i + 1}`,
      medical: Math.round(medicalCount / 7),
      rag: Math.round(nonMedicalCount / 7),
    }));
  }, [medicalCount, nonMedicalCount]);

  return (
    <AppShell>
      <div className="px-6 py-8 lg:px-10">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Intelligence dashboard</h1>
          <p className="text-sm text-muted-foreground">System health, processing throughput, and agent metrics.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Documents processed" value={total.toString()} sub="Total uploaded" icon={<FileText className="h-4 w-4" />} />
          <StatCard label="Medical / non-medical" value={`${medicalCount} / ${nonMedicalCount}`} sub="Split" icon={<Stethoscope className="h-4 w-4" />} accent="accent" />
          <StatCard label="Active agents" value={agents.filter(a => a.status === "working").length.toString()} sub="Currently processing" icon={<Bot className="h-4 w-4" />} />
          <StatCard label="System Status" value="Online" sub="All systems nominal" icon={<Activity className="h-4 w-4" />} accent="warning" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="glass-strong rounded-2xl p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-semibold">Throughput</h3>
                <p className="text-xs text-muted-foreground">Documents routed per day</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.18 295)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.78 0.18 295)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.82 0.18 165)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.82 0.18 165)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                  <XAxis dataKey="day" stroke="oklch(0.7 0.03 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.7 0.03 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "oklch(0.21 0.05 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="medical" stroke="oklch(0.78 0.18 295)" fill="url(#g1)" strokeWidth={2} />
                  <Area type="monotone" dataKey="rag" stroke="oklch(0.82 0.18 165)" fill="url(#g2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-5">
            <h3 className="font-display text-sm font-semibold">Category split</h3>
            <p className="text-xs text-muted-foreground">By classifier output</p>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={split} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {split.map((s) => <Cell key={s.name} fill={s.color} stroke="oklch(0.13 0.04 270)" />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="glass-strong rounded-2xl p-5">
            <h3 className="font-display text-sm font-semibold">Agent health</h3>
            <div className="mt-4 space-y-3">
              {agents.map((a, i) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span>{a.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground capitalize">{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-strong rounded-2xl p-5">
            <h3 className="font-display text-sm font-semibold">System</h3>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-muted-foreground">Backend</dt><dd className="mt-1 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent pulse-glow" /> Online</dd></div>
              <div><dt className="text-xs text-muted-foreground">Vector DB</dt><dd className="mt-1">ChromaDB</dd></div>
              <div><dt className="text-xs text-muted-foreground">LLM</dt><dd className="mt-1">llama-3.3-70b-versatile</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
