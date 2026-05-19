import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";

const links = [
  { to: "/", label: "Home" },
  { to: "/emergency", label: "New Emergency" },
  { to: "/tracking", label: "Live Tracking" },
  { to: "/doctor", label: "Doctor" },
  { to: "/ambulance", label: "Ambulance" },
  { to: "/hospital", label: "Hospital" },
  { to: "/control", label: "AI Control" },
];

export function TopNav() {
  const loc = useLocation();
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 backdrop-blur-xl bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.div
            className="relative h-8 w-8 rounded-md bg-emergency grid place-items-center glow-emergency"
            whileHover={{ rotate: 8, scale: 1.05 }}
          >
            <span className="font-mono text-sm font-bold text-emergency-foreground">+</span>
            <span className="absolute inset-0 rounded-md pulse-ring bg-emergency/60" />
          </motion.div>
          <div className="leading-tight">
            <div className="font-display text-lg font-semibold tracking-tight">MediRelay</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Golden Hour AI
            </div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = loc.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`relative rounded-md px-3 py-1.5 text-sm transition ${
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
                {active && (
                  <motion.div
                    layoutId="navactive"
                    className="absolute inset-0 -z-10 rounded-md bg-primary/15 border border-primary/30"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-success">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Live
          </span>
        </div>
      </div>
    </header>
  );
}
