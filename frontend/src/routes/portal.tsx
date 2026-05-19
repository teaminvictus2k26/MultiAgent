import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useEmergencyStore } from "@/store/useEmergencyStore";
import { startAmbulanceSimulation } from "@/lib/emergencyDispatch";
import { Heart, Activity, CheckCircle, LogOut, User, Lock, Ambulance, Building2, MapPin, Clock, AlertTriangle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import type { EmergencyCase } from "@/lib/emergencyTypes";

export const Route = createFileRoute("/portal")({
  component: PortalLogin,
});

// ─── Hardcoded credentials ─────────────────────────────────────────────────
const CREDENTIALS = {
  hospital: [
    { username: "hospital1", password: "hosp123", name: "Dr. Sarah Khan", dept: "Emergency Medicine" },
    { username: "hospital2", password: "hosp456", name: "Dr. Arjun Mehta", dept: "Cardiology" },
  ],
  ambulance: [
    { username: "ambulance1", password: "amb123", name: "Rahul Sharma", callsign: "AMB-01", vehicleId: "MH01-1234" },
    { username: "ambulance2", password: "amb456", name: "Priya Patel", callsign: "AMB-02", vehicleId: "MH01-5678" },
  ],
};

type Role = "none" | "ambulance" | "hospital";

interface LoggedInUser {
  role: "ambulance" | "hospital";
  name: string;
  extra: string;
  username: string;
}

// ─── Login Form ─────────────────────────────────────────────────────────────
function LoginForm({
  role,
  onSuccess,
  onBack,
}: {
  role: "ambulance" | "hospital";
  onSuccess: (user: LoggedInUser) => void;
  onBack: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");
    const list = role === "hospital" ? CREDENTIALS.hospital : CREDENTIALS.ambulance;
    const match = list.find(u => u.username === username && u.password === password);
    if (!match) { setError("Invalid username or password."); return; }
    onSuccess({
      role,
      username: match.username,
      name: match.name,
      extra: role === "hospital"
        ? (match as typeof CREDENTIALS.hospital[0]).dept
        : `${(match as typeof CREDENTIALS.ambulance[0]).callsign} · ${(match as typeof CREDENTIALS.ambulance[0]).vehicleId}`,
    });
  };

  const hints = role === "hospital"
    ? CREDENTIALS.hospital.map(u => `${u.username} / ${u.password}`)
    : CREDENTIALS.ambulance.map(u => `${u.username} / ${u.password}`);

  return (
    <div className="aurora-bg min-h-screen text-foreground flex flex-col items-center justify-center p-4">
      <div className="glass max-w-md w-full p-8 rounded-2xl">
        <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1">
          ← Back
        </button>
        <div className="flex items-center gap-3 mb-6">
          {role === "hospital"
            ? <Building2 className="h-8 w-8 text-primary" />
            : <Ambulance className="h-8 w-8 text-warning" />}
          <div>
            <h1 className="text-xl font-bold font-display">
              {role === "hospital" ? "Hospital Login" : "Ambulance Driver Login"}
            </h1>
            <p className="text-xs text-muted-foreground">MediRelay Staff Portal</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text" placeholder="Username" value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-secondary/50 border border-border/60 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary/60 transition-colors"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              className="w-full bg-secondary/50 border border-border/60 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary/60 transition-colors"
            />
          </div>
          {error && <p className="text-emergency text-xs font-medium">{error}</p>}
          <button
            onClick={handleLogin}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90 ${role === "hospital" ? "bg-primary text-primary-foreground" : "bg-warning text-warning-foreground"}`}
          >
            Sign In
          </button>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-6 p-3 rounded-xl bg-secondary/30 border border-border/40">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Demo Credentials</p>
          {hints.map(h => (
            <p key={h} className="font-mono text-xs text-foreground/70">{h}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Portal Root ─────────────────────────────────────────────────────────────
function PortalLogin() {
  const [step, setStep] = useState<"select" | "login">("select");
  const [pendingRole, setPendingRole] = useState<"ambulance" | "hospital">("hospital");
  const [loggedIn, setLoggedIn] = useState<LoggedInUser | null>(null);

  if (loggedIn) {
    return loggedIn.role === "hospital"
      ? <HospitalDashboard user={loggedIn} onLogout={() => { setLoggedIn(null); setStep("select"); }} />
      : <AmbulanceDashboard user={loggedIn} onLogout={() => { setLoggedIn(null); setStep("select"); }} />;
  }

  if (step === "login") {
    return (
      <LoginForm
        role={pendingRole}
        onSuccess={setLoggedIn}
        onBack={() => setStep("select")}
      />
    );
  }

  return (
    <div className="aurora-bg min-h-screen text-foreground flex flex-col items-center justify-center p-4">
      <div className="glass max-w-md w-full p-8 rounded-2xl text-center">
        <Heart className="h-12 w-12 text-emergency mx-auto mb-4" />
        <h1 className="text-2xl font-bold font-display">MediRelay Staff Portal</h1>
        <p className="text-muted-foreground text-sm mt-2 mb-8">Select your role to access the emergency dispatch queue.</p>

        <div className="space-y-4">
          <button
            onClick={() => { setPendingRole("ambulance"); setStep("login"); }}
            className="w-full flex items-center justify-center gap-2 bg-warning text-warning-foreground py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            🚑 Ambulance Driver Login
          </button>
          <button
            onClick={() => { setPendingRole("hospital"); setStep("login"); }}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            🏥 Hospital Login
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Hospital Dashboard ───────────────────────────────────────────────────────
function HospitalDashboard({ user, onLogout }: { user: LoggedInUser; onLogout: () => void }) {
  const store = useEmergencyStore();
  const pendingCases = Object.values(store.cases).filter(c => c.status === "PENDING_ACCEPTANCE");
  const activeCases = Object.values(store.cases).filter(c =>
    !["PENDING_ACCEPTANCE", "CASE_CREATED", "TRIAGE_COMPLETED", "HOSPITAL_ASSIGNED"].includes(c.status)
  );
  const [dispatchModal, setDispatchModal] = useState<string | null>(null); // caseId
  const [selectedAmbulance, setSelectedAmbulance] = useState(CREDENTIALS.ambulance[0].username);

  const handleAccept = (caseId: string) => {
    // Open dispatch modal to select ambulance driver
    setDispatchModal(caseId);
  };

  const handleDispatch = (caseId: string) => {
    const driver = CREDENTIALS.ambulance.find(a => a.username === selectedAmbulance)!;

    store.updateCase(caseId, { status: "AMBULANCE_ASSIGNED" });
    store.pushLog(caseId, {
      ts: Date.now(), agent: "DOCTOR", level: "success",
      message: `Hospital accepted. Dispatching ${driver.callsign} (${driver.name}) to patient location.`
    });

    setTimeout(() => {
      store.setStatus(caseId, "DOCTOR_ALERTED");
      store.pushLog(caseId, {
        ts: Date.now(), agent: "DOCTOR", level: "success",
        message: `ER bay prepared. Awaiting patient arrival.`
      });
      setTimeout(() => {
        store.setStatus(caseId, "PATIENT_EN_ROUTE");
        startAmbulanceSimulation(caseId);
      }, 500);
    }, 1000);

    setDispatchModal(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto p-6 pt-24">
        {/* Header */}
        <div className="flex justify-between items-end border-b border-border/40 pb-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary font-mono">Hospital Dashboard</p>
            <h1 className="text-3xl font-display font-bold mt-1">{user.name}</h1>
            <p className="text-muted-foreground text-sm">{user.extra} · Live Emergency Queue</p>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        {/* Dispatch Modal */}
        {dispatchModal && (() => {
          const c = store.cases[dispatchModal];
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4">
              <div className="glass max-w-lg w-full p-6 rounded-2xl border border-emergency/40 shadow-2xl">
                <h2 className="text-xl font-bold font-display mb-1">Dispatch Ambulance</h2>
                <p className="text-sm text-muted-foreground mb-4">Patient: <span className="text-foreground font-semibold">{c?.patient.name}</span> · {c?.triage?.severity}</p>

                {/* Patient summary */}
                {c && <PatientInfoCard c={c} compact />}

                {/* Ambulance selection */}
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Select Ambulance Driver</p>
                  <div className="space-y-2">
                    {CREDENTIALS.ambulance.map(driver => (
                      <label key={driver.username} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedAmbulance === driver.username ? "border-warning/60 bg-warning/10" : "border-border/40 bg-secondary/20"}`}>
                        <input type="radio" name="driver" value={driver.username} checked={selectedAmbulance === driver.username} onChange={() => setSelectedAmbulance(driver.username)} className="accent-warning" />
                        <div>
                          <p className="font-bold text-sm">{driver.callsign} — {driver.name}</p>
                          <p className="text-xs text-muted-foreground">{driver.vehicleId}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button onClick={() => setDispatchModal(null)} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary/40">Cancel</button>
                  <button onClick={() => handleDispatch(dispatchModal)} className="flex-1 py-2 rounded-xl bg-emergency text-white font-bold text-sm hover:opacity-90 glow-emergency">
                    🚑 Dispatch Now
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="space-y-6">
          {/* Pending */}
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
              <Activity className="h-5 w-5 text-warning animate-pulse" /> Pending Requests ({pendingCases.length})
            </h2>
            {pendingCases.length === 0 ? (
              <div className="glass p-8 rounded-xl text-center text-muted-foreground">No pending emergencies.</div>
            ) : (
              <div className="space-y-4">
                {pendingCases.map(c => (
                  <div key={c.id} className="glass p-6 rounded-xl border border-warning/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5"><Heart className="h-32 w-32" /></div>
                    <div className="flex flex-col md:flex-row justify-between gap-4 relative z-10">
                      <PatientInfoCard c={c} />
                      <div className="flex flex-col justify-center">
                        <button
                          onClick={() => handleAccept(c.id)}
                          className="bg-emergency text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity glow-emergency shadow-lg whitespace-nowrap"
                        >
                          Accept & Dispatch
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active */}
          {activeCases.length > 0 && (
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-medical" /> Active Cases ({activeCases.length})
              </h2>
              <div className="space-y-2">
                {activeCases.map(c => (
                  <div key={c.id} className="glass p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">{c.patient.name} · <span className="text-xs font-mono">{c.status}</span></h4>
                      <p className="text-xs text-muted-foreground">{c.triage?.condition}</p>
                    </div>
                    <div className="text-xs font-mono text-right">
                      {c.ambulance && <div className="text-warning font-bold">ETA: {c.ambulance.etaMin} min</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Ambulance Dashboard ──────────────────────────────────────────────────────
function AmbulanceDashboard({ user, onLogout }: { user: LoggedInUser; onLogout: () => void }) {
  const store = useEmergencyStore();
  // Show cases dispatched / en-route (any status after PENDING)
  const myCases = Object.values(store.cases).filter(c =>
    ["AMBULANCE_ASSIGNED", "DOCTOR_ALERTED", "PATIENT_EN_ROUTE", "PATIENT_ARRIVED"].includes(c.status)
  ).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto p-6 pt-24">
        {/* Header */}
        <div className="flex justify-between items-end border-b border-border/40 pb-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-warning font-mono">Ambulance Dashboard</p>
            <h1 className="text-3xl font-display font-bold mt-1">{user.name}</h1>
            <p className="text-muted-foreground text-sm">{user.extra} · Dispatched Missions</p>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        {myCases.length === 0 ? (
          <div className="glass p-12 rounded-2xl text-center text-muted-foreground">
            <Ambulance className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No active dispatch. Standby.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myCases.map(c => (
              <div key={c.id} className="glass p-6 rounded-2xl border border-warning/40">
                {/* Status badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-mono uppercase font-bold px-3 py-1 rounded-full ${c.status === "PATIENT_EN_ROUTE" ? "bg-warning/20 text-warning border border-warning/40" : "bg-medical/20 text-medical border border-medical/40"}`}>
                    {c.status.replace(/_/g, " ")}
                  </span>
                  {c.ambulance && (
                    <span className="text-3xl font-display font-bold text-warning tabular-nums">
                      {c.ambulance.etaMin}<span className="text-base text-muted-foreground ml-1">min ETA</span>
                    </span>
                  )}
                </div>

                {/* Full patient info */}
                <PatientInfoCard c={c} full />

                {/* Navigation info */}
                <div className="mt-4 p-3 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-warning uppercase tracking-wider">Pickup Location</p>
                    <p className="text-sm font-medium mt-0.5">{c.location.label}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">
                      {c.location.lat.toFixed(6)}, {c.location.lng.toFixed(6)}
                    </p>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${c.location.lat},${c.location.lng}&travelmode=driving`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-2 text-xs bg-warning text-warning-foreground px-3 py-1 rounded-lg font-bold hover:opacity-90"
                    >
                      Open in Google Maps →
                    </a>
                  </div>
                </div>

                {/* Hospital destination */}
                {c.hospital && (
                  <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/30 flex items-start gap-3">
                    <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider">Destination Hospital</p>
                      <p className="text-sm font-medium mt-0.5">{c.hospital.name}</p>
                      <p className="text-xs text-muted-foreground">ICU Beds: {c.hospital.icuBeds} · ER Beds: {c.hospital.emergencyBeds}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Shared Patient Info Card ─────────────────────────────────────────────────
function PatientInfoCard({ c, compact, full }: { c: EmergencyCase; compact?: boolean; full?: boolean }) {
  const sevColor = c.triage?.severity === "CRITICAL" ? "text-emergency" : c.triage?.severity === "URGENT" ? "text-warning" : "text-medical";
  return (
    <div className={compact ? "" : "flex-1"}>
      <div className="flex items-center gap-2 mb-2">
        {c.triage?.severity === "CRITICAL" && <AlertTriangle className="h-4 w-4 text-emergency animate-pulse" />}
        <h3 className="font-bold text-lg">{c.patient.name}</h3>
        <span className="text-sm text-muted-foreground">· {c.patient.age} yrs · {c.patient.gender}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <InfoRow label="Severity" value={<span className={`font-bold ${sevColor}`}>{c.triage?.severity ?? "—"}</span>} />
        <InfoRow label="Condition" value={c.triage?.condition ?? "—"} />
        <InfoRow label="Specialist" value={c.triage?.specialist ?? "—"} />
        <InfoRow label="Time Window" value={c.triage ? `< ${c.triage.timeSensitivityMin} min` : "—"} />
        {!compact && <InfoRow label="History" value={c.patient.medicalHistory || "None"} />}
        {(full || !compact) && <InfoRow label="Symptoms" value={c.symptoms} />}
      </div>

      {!compact && (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>{c.location.label}</span>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}: </span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}
