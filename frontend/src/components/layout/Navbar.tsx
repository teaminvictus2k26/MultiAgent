import { Link } from "@tanstack/react-router";
import { Hexagon, Github, ArrowRight } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div className="glass-strong flex items-center justify-between rounded-2xl px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--gradient-hero)" }}>
              <Hexagon className="h-4 w-4 text-background" />
            </div>
            <span className="font-display text-base font-semibold tracking-tight">Nexus</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link to="/emergency" className="hover:text-foreground transition-colors">Emergency</Link>
            <Link to="/portal" className="hover:text-emergency transition-colors font-medium text-emergency/70">🚑 Staff Portal</Link>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#architecture" className="hover:text-foreground transition-colors">Architecture</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
          </nav>
          <Link
            to="/workspace"
            className="group inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
            style={{ background: "var(--gradient-hero)" }}
          >
            Launch app
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
