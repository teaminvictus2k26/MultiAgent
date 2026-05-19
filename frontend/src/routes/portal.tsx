import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useEmergencyStore } from "@/store/useEmergencyStore";
import { startAmbulanceSimulation } from "@/lib/emergencyDispatch";
import { Heart, Activity, CheckCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

export const Route = createFileRoute("/portal")({
  component: PortalLogin,
});

function PortalLogin() {
  const [role, setRole] = useState<"none" | "ambulance" | "doctor">("none");

  if (role === "none") {
    return (
      <div className="aurora-bg min-h-screen text-foreground flex flex-col items-center justify-center p-4">
        <div className="glass max-w-md w-full p-8 rounded-2xl text-center">
          <Heart className="h-12 w-12 text-emergency mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-display">Staff Portal Login</h1>
          <p className="text-muted-foreground text-sm mt-2 mb-8">Select your role to access the emergency dispatch queue.</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => setRole("ambulance")}
              className="w-full flex items-center justify-center gap-2 bg-warning text-warning-foreground py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              🚑 Ambulance Driver Login
            </button>
            <button 
              onClick={() => setRole("doctor")}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              ⚕️ ER Doctor Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard role={role} onLogout={() => setRole("none")} />;
}

function Dashboard({ role, onLogout }: { role: "ambulance" | "doctor", onLogout: () => void }) {
  const store = useEmergencyStore();
  const pendingCases = Object.values(store.cases).filter(c => c.status === "PENDING_ACCEPTANCE");
  const activeCases = Object.values(store.cases).filter(c => c.status !== "PENDING_ACCEPTANCE" && c.status !== "CASE_CREATED" && c.status !== "TRIAGE_COMPLETED" && c.status !== "HOSPITAL_ASSIGNED");

  const handleAccept = (caseId: string) => {
    // Both accept at the same time for this simplified demo
    store.updateCase(caseId, {
      status: "AMBULANCE_ASSIGNED"
    });
    store.pushLog(caseId, {
      ts: Date.now(),
      agent: role === "ambulance" ? "AMBULANCE" : "DOCTOR",
      level: "success",
      message: `${role.toUpperCase()} accepted the case. Units deploying.`
    });
    
    setTimeout(() => {
      store.setStatus(caseId, "DOCTOR_ALERTED");
      store.pushLog(caseId, {
        ts: Date.now(),
        agent: "DOCTOR",
        level: "success",
        message: `ER is prepped and awaiting arrival.`
      });
      setTimeout(() => {
        store.setStatus(caseId, "PATIENT_EN_ROUTE");
        startAmbulanceSimulation(caseId);
      }, 500);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto p-6 pt-24">
        <div className="flex justify-between items-end border-b border-border/40 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold capitalize">{role} Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Live Emergency Dispatch Queue</p>
          </div>
          <button onClick={onLogout} className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Logout
          </button>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-warning animate-pulse" /> Pending Requests ({pendingCases.length})
          </h2>
          {pendingCases.length === 0 ? (
            <div className="glass p-8 rounded-xl text-center text-muted-foreground">No pending emergencies.</div>
          ) : (
            pendingCases.map(c => (
              <div key={c.id} className="glass p-6 rounded-xl border border-warning/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Heart className="h-24 w-24" />
                </div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h3 className="font-bold text-xl">{c.patient.name}, {c.patient.age} ({c.patient.gender})</h3>
                    <p className="text-sm text-muted-foreground mt-1">Location: {c.location.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">GPS: {c.location.lat.toFixed(4)}, {c.location.lng.toFixed(4)}</p>
                    <p className="text-sm text-muted-foreground mt-2">History: {c.patient.medicalHistory || "None"}</p>
                    <div className="mt-3">
                      <span className="bg-emergency/20 text-emergency text-xs font-bold px-2 py-1 rounded border border-emergency/30">
                        {c.triage?.severity}
                      </span>
                      <span className="ml-2 font-medium">{c.triage?.condition}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAccept(c.id)}
                    className="bg-emergency text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity glow-emergency shadow-lg"
                  >
                    Accept Case
                  </button>
                </div>
              </div>
            ))
          )}

          <h2 className="text-lg font-bold flex items-center gap-2 mt-8">
            <CheckCircle className="h-5 w-5 text-medical" /> Active Handled Cases
          </h2>
          {activeCases.map(c => (
            <div key={c.id} className="glass p-4 rounded-xl flex justify-between items-center opacity-70">
              <div>
                <h4 className="font-bold">{c.patient.name} - {c.status}</h4>
                <p className="text-xs text-muted-foreground">{c.triage?.condition}</p>
              </div>
              <div className="text-xs font-mono text-right">
                {c.ambulance && <div>ETA: {c.ambulance.etaMin} min</div>}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
