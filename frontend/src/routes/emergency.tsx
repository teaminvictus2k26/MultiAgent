import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, Shield, MapPin, Activity, Flame, 
  ChevronRight, Compass, Users, Phone, Zap,
  Loader2, Play, RefreshCw, Star, Info, AlertTriangle, ArrowLeft
} from "lucide-react";
import { useEmergencyStore } from "@/store/useEmergencyStore";
import { dispatchPipeline, startAmbulanceSimulation } from "@/lib/emergencyDispatch";
import type { EmergencyCase, Severity, CaseStatus } from "@/lib/emergencyTypes";

// Dynamically fetch Leaflet instance to prevent SSR errors
import type L from "leaflet";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Nexus MediRelay — Live AI Emergency Coordination Hub" },
      { name: "description", content: "Real-time AI-powered emergency routing system optimizing medical dispatch." },
    ],
  }),
  component: EmergencyDashboard,
});

const SCENARIOS = [
  {
    label: "Cardiac Event",
    name: "Lakshmi Rao",
    age: 58,
    gender: "Female",
    history: "Hypertension, mild diabetes",
    symptoms: "Severe crushing chest pain radiating down left arm, cold sweats, and acute shortness of breath for 15 minutes.",
  },
  {
    label: "Acute Stroke",
    name: "Arun Mehta",
    age: 67,
    gender: "Male",
    history: "Atrial fibrillation on blood thinners",
    symptoms: "Sudden onset facial drooping on the right side, slurred incoherent speech, and profound weakness in right arm.",
  },
  {
    label: "Major Trauma",
    name: "Priya Singh",
    age: 24,
    gender: "Female",
    history: "None",
    symptoms: "High-speed two-wheeler crash. Conscious but in shock. Severe compound fracture in left leg, heavy bleeding.",
  },
  {
    label: "Anaphylaxis",
    name: "Karan Iyer",
    age: 9,
    gender: "Male",
    history: "Severe peanut allergy",
    symptoms: "Systemic hives, swelling of lips and throat, wheezing sound, and struggling for oxygen after school lunch.",
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function EmergencyDashboard() {
  const store = useEmergencyStore();
  const casesList = Object.values(store.cases).sort((a, b) => b.createdAt - a.createdAt);
  const activeCase = store.activeCaseId ? store.cases[store.activeCaseId] : casesList[0];

  const [activeTab, setActiveTab] = useState<"intake" | "relay">(activeCase ? "relay" : "intake");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: "Lakshmi Rao",
    age: "58",
    gender: "Female",
    history: "Hypertension, mild diabetes",
    symptoms: "",
  });

  const [userLocation, setUserLocation] = useState({
    lat: 19.0760,
    lng: 72.8777,
    label: "Mumbai, Maharashtra, India",
  });

  // Track map container
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const layersRef = useRef<L.Layer[]>([]);

  // Keep simulations active on mount/reload
  useEffect(() => {
    casesList.forEach(c => {
      if (c.status === "PATIENT_EN_ROUTE") {
        startAmbulanceSimulation(c.id);
      }
    });
  }, []);

  const fetchGPS = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng, label: "Detecting exact address…" });

          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`, {
            headers: { "User-Agent": "NexusMediRelay/1.0" }
          })
            .then(res => res.json())
            .then(data => {
              const label = data.display_name ? data.display_name.split(",").slice(0, 3).join(",") : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              setUserLocation({ lat, lng, label });
            })
            .catch(() => {
              setUserLocation({ lat, lng, label: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}` });
            });
        },
        (error) => console.warn("Geolocation permission not granted:", error)
      );
    }
  };

  // Fetch current geolocation on mount
  useEffect(() => {
    fetchGPS();
  }, []);

  // Initialize and update leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let cancelled = false;

    // Load leaflet dynamically
    if (!mapRef.current) {
      import("leaflet").then((Leaf) => {
        if (cancelled || !mapContainerRef.current) return;
        leafletRef.current = Leaf.default;

        const map = Leaf.default.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView([userLocation.lat, userLocation.lng], 13);

        Leaf.default.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;
        updateMapElements();
      });
    } else {
      updateMapElements();
    }

    return () => {
      cancelled = true;
    };
  }, [activeCase, activeTab]);

  const updateMapElements = () => {
    const map = mapRef.current;
    const Leaf = leafletRef.current;
    if (!map || !Leaf) return;

    // Clear old markers/routes
    layersRef.current.forEach((layer) => map.removeLayer(layer));
    layersRef.current = [];

    // Draw static hospital markers
    const HOSPITALS_MOCK = [
      { name: "City Medical Care", lat: 19.0700, lng: 72.8850, rating: 4.8 },
      { name: "Apollo Med Center", lat: 19.0820, lng: 72.8650, rating: 4.7 },
      { name: "Seven Hills ER", lat: 19.1020, lng: 72.8750, rating: 4.9 },
    ];

    HOSPITALS_MOCK.forEach(h => {
      const isMatched = activeCase?.hospital?.name.includes(h.name) || activeCase?.hospital?.id === h.name;
      const hospColor = isMatched ? "oklch(0.65 0.26 25)" : "oklch(0.78 0.16 200)";
      const glow = isMatched ? `box-shadow: 0 0 12px ${hospColor};` : "";
      
      const icon = Leaf.divIcon({
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        html: `<div style="width:28px;height:28px;border-radius:6px;background:${hospColor};display:grid;place-items:center;border:2px solid oklch(0.16 0.04 270);${glow}"><span style="color:white;font-weight:bold;font-size:14px;">+</span></div>`
      });

      const marker = Leaf.marker([h.lat, h.lng], { icon })
        .addTo(map)
        .bindTooltip(`<b>${h.name}</b><br/>Rating: ${h.rating} ★`, { direction: "top" });
      
      layersRef.current.push(marker);
    });

    if (!activeCase) {
      map.setView([userLocation.lat, userLocation.lng], 13);
      return;
    }

    // Patient Position
    const patientIcon = Leaf.divIcon({
      className: "",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      html: `<div style="width:24px;height:24px;border-radius:999px;background:oklch(0.82 0.18 165);border:3px solid oklch(0.16 0.04 270);box-shadow: 0 0 10px oklch(0.82 0.18 165);"></div>`
    });

    const patientMarker = Leaf.marker([activeCase.location.lat, activeCase.location.lng], { icon: patientIcon })
      .addTo(map)
      .bindTooltip(`Patient: ${activeCase.patient.name}`, { direction: "top" });
    layersRef.current.push(patientMarker);

    // Route
    if (activeCase.route) {
      const poly = Leaf.polyline(activeCase.route, {
        color: "oklch(0.65 0.26 25)",
        weight: 4,
        opacity: 0.85,
      }).addTo(map);
      layersRef.current.push(poly);
    }

    // Ambulance Position
    if (activeCase.ambulance) {
      const ambIcon = Leaf.divIcon({
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        html: `<div style="position:relative;width:36px;height:36px;">
          <div style="position:absolute;inset:0;border-radius:999px;background:oklch(0.65 0.26 25 / 0.4);animation:pulse-ring 1.6s infinite;"></div>
          <div style="position:absolute;inset:6px;border-radius:999px;background:oklch(0.65 0.26 25);display:grid;place-items:center;box-shadow:0 0 10px oklch(0.65 0.26 25);">
            <span style="font-size:14px;">🚑</span>
          </div>
        </div>`
      });

      const ambMarker = Leaf.marker([activeCase.ambulance.lat, activeCase.ambulance.lng], { icon: ambIcon })
        .addTo(map)
        .bindTooltip(`${activeCase.ambulance.callsign} · ETA ${activeCase.ambulance.etaMin}m`, {
          direction: "top",
          permanent: true,
          offset: [0, -16],
        });
      layersRef.current.push(ambMarker);
    }

    // Auto fit bounds
    const coordinates: L.LatLngExpression[] = [
      [activeCase.location.lat, activeCase.location.lng]
    ];
    if (activeCase.ambulance) coordinates.push([activeCase.ambulance.lat, activeCase.ambulance.lng]);
    if (activeCase.hospital) coordinates.push([activeCase.hospital.lat, activeCase.hospital.lng]);

    if (coordinates.length > 1) {
      map.fitBounds(Leaf.latLngBounds(coordinates), { padding: [50, 50], maxZoom: 15 });
    } else {
      map.setView([activeCase.location.lat, activeCase.location.lng], 13);
    }
  };

  const handleScenarioLoad = (sc: typeof SCENARIOS[0]) => {
    setForm({
      name: sc.name,
      age: String(sc.age),
      gender: sc.gender,
      history: sc.history,
      symptoms: sc.symptoms,
    });
  };

  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.symptoms.trim()) return;

    setBusy(true);
    setErr(null);

    const caseId = uid();
    const newCase: EmergencyCase = {
      id: caseId,
      createdAt: Date.now(),
      patient: {
        name: form.name,
        age: Number(form.age) || 30,
        gender: form.gender,
        medicalHistory: form.history,
      },
      symptoms: form.symptoms,
      location: {
        lat: userLocation.lat,
        lng: userLocation.lng,
        label: userLocation.label,
      },
      status: "CASE_CREATED",
      agentLog: [
        { ts: Date.now(), agent: "SYSTEM", message: `Emergency report registered. Spawning triage agents…`, level: "info" }
      ]
    };

    store.setCase(newCase);
    setActiveTab("relay");

    try {
      const response = await fetch("http://localhost:8000/api/v1/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_symptoms: `${form.symptoms}. Patient is a ${form.age}-year-old ${form.gender} with a history of ${form.history}.`,
          patient_lat: userLocation.lat,
          patient_lng: userLocation.lng,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned code ${response.status}`);
      }

      const resData = await response.json();
      
      // Coordinate dispatch workflow client-side simulation based on LLM outputs
      dispatchPipeline(caseId, resData);
    } catch (error: any) {
      console.error(error);
      setErr(error.message || "Triage pipeline execution failed.");
      store.pushLog(caseId, {
        ts: Date.now(),
        agent: "SYSTEM",
        message: `Pipeline error: ${error.message || "Execution failed"}.`,
        level: "critical",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="aurora-bg min-h-screen pb-16 pt-24 text-foreground selection:bg-primary/30">
      
      {/* Top Floating Navbar */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto mt-4 max-w-7xl px-4">
          <div className="glass-strong flex items-center justify-between rounded-2xl px-6 py-3.5">
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emergency text-white text-xs font-bold animate-pulse">!</span>
              <span className="font-display text-lg font-bold tracking-tight text-gradient">Nexus MediRelay</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/workspace" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-4">
                Workspace
              </Link>
              <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-secondary/80 px-4 py-2 text-xs font-semibold hover:bg-secondary transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> Back Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Title & Tabs Bar */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-border/40 pb-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-emergency font-semibold">MediRelay Autonomous System</div>
            <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">
              AI Emergency Dispatch
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Classify severity, optimize routing, track active ambulances, and alert trauma surgeons in real time.
            </p>
          </div>
          
          <div className="flex gap-2 rounded-xl bg-secondary/40 p-1.5 border border-border/20 self-start">
            <button
              onClick={() => setActiveTab("intake")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === "intake" ? "bg-emergency text-white glow-emergency" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Flame className="h-4 w-4" /> Report Emergency
            </button>
            <button
              onClick={() => setActiveTab("relay")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === "relay" ? "bg-medical text-primary-foreground glow-medical" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Activity className="h-4 w-4" /> Live Relay Hub
            </button>
          </div>
        </div>

        {activeTab === "intake" ? (
          /* ====================================================
             TAB: EMERGENCY REPORT PORTAL
             ==================================================== */
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Presets Scenario Selector */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-warning" />
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Rapid-Fill Simulation Presets</span>
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SCENARIOS.map((sc) => (
                    <button
                      key={sc.label}
                      type="button"
                      onClick={() => handleScenarioLoad(sc)}
                      className="flex flex-col items-start gap-1 rounded-xl border border-border/60 bg-surface/50 p-3.5 text-left hover:border-emergency/60 hover:bg-surface/80 transition-all group"
                    >
                      <span className="text-xs font-bold text-foreground group-hover:text-emergency transition-colors">{sc.label}</span>
                      <span className="text-[10px] text-muted-foreground">{sc.name}, {sc.age}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient intake form */}
              <form onSubmit={handleIntakeSubmit} className="glass rounded-2xl p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-mono uppercase text-muted-foreground">Patient Name</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-sm text-foreground focus:border-emergency focus:outline-none transition-colors"
                      placeholder="e.g. Lakshmi Rao"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-mono uppercase text-muted-foreground">Age</span>
                    <input
                      type="text"
                      value={form.age}
                      onChange={e => setForm({ ...form, age: e.target.value })}
                      className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-sm text-foreground focus:border-emergency focus:outline-none transition-colors"
                      placeholder="e.g. 58"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-mono uppercase text-muted-foreground">Gender</span>
                    <select
                      value={form.gender}
                      onChange={e => setForm({ ...form, gender: e.target.value })}
                      className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-sm text-foreground focus:border-emergency focus:outline-none transition-colors"
                    >
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-mono uppercase text-muted-foreground">Medical History</span>
                  <input
                    type="text"
                    value={form.history}
                    onChange={e => setForm({ ...form, history: e.target.value })}
                    className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-sm text-foreground focus:border-emergency focus:outline-none transition-colors"
                    placeholder="Allergies, conditions, medications"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-muted-foreground">Current Active Symptoms</span>
                    <span className="text-[10px] text-muted-foreground/60">Detailing symptoms boosts AI triage accuracy</span>
                  </div>
                  <textarea
                    rows={4}
                    value={form.symptoms}
                    onChange={e => setForm({ ...form, symptoms: e.target.value })}
                    className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-sm text-foreground focus:border-emergency focus:outline-none resize-none transition-colors"
                    placeholder="e.g. Sudden severe crushing chest pain, sweating, short of breath..."
                    required
                  />
                </div>

                {err && (
                  <div className="rounded-lg border border-emergency/40 bg-emergency/10 p-3 text-xs text-emergency flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{err}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full flex items-center justify-center gap-3 rounded-xl bg-emergency py-4 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 glow-emergency"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Agents Orchestrating Response...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Spawn Multi-Agent Dispatch Pipeline
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Sidebar GPS details */}
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Compass className="h-24 w-24" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Patient Coordinates</div>
                    <h3 className="mt-2 font-display text-lg font-bold">Active Geolocation</h3>
                  </div>
                  <button 
                    onClick={fetchGPS}
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg bg-secondary/80 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" /> Refresh GPS
                  </button>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-3 rounded-xl bg-secondary/30 p-3 border border-border/40">
                    <MapPin className="h-5 w-5 text-emergency shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground font-mono">Location Grid Address</p>
                      <p className="text-sm font-semibold truncate mt-0.5">{userLocation.label}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-xl bg-secondary/20 p-2.5">
                      <p className="text-[10px] font-mono text-muted-foreground uppercase">Latitude</p>
                      <p className="font-mono text-xs font-bold mt-1 text-foreground">{userLocation.lat.toFixed(6)}</p>
                    </div>
                    <div className="rounded-xl bg-secondary/20 p-2.5">
                      <p className="text-[10px] font-mono text-muted-foreground uppercase">Longitude</p>
                      <p className="font-mono text-xs font-bold mt-1 text-foreground">{userLocation.lng.toFixed(6)}</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    By default, your current browser coordinates are captured to target nearest medical hubs.
                  </p>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">MediRelay Protocol</div>
                <h3 className="mt-2 font-display text-lg font-bold">Golden Hour Target</h3>
                <div className="mt-3 space-y-3 text-xs leading-relaxed text-muted-foreground">
                  <div className="flex gap-2">
                    <span className="text-emergency font-bold">1.</span>
                    <span><b>Triage Officer</b> classifies patient severity tier automatically.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emergency font-bold">2.</span>
                    <span><b>Hospital Finder</b> queries active bed database in Pune/Mumbai.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emergency font-bold">3.</span>
                    <span><b>Ambulance Coordinator</b> plots optimized green corridor route.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emergency font-bold">4.</span>
                    <span><b>ER Surgeon Alerter</b> drafts incoming physiological heads-up.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ====================================================
             TAB: RELAY TRACKING DASHBOARD
             ==================================================== */
          <div className="mt-8">
            {!activeCase ? (
              <div className="glass rounded-3xl p-16 text-center max-w-2xl mx-auto mt-12">
                <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto" />
                <h3 className="mt-4 font-display text-xl font-bold">No Active Emergency Relay</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  There are no current emergency coordinates in the system. Head to the intake form to start a routing simulation.
                </p>
                <button
                  onClick={() => setActiveTab("intake")}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emergency px-5 py-2.5 text-xs font-bold text-white glow-emergency hover:opacity-90"
                >
                  Report Emergency Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 2-Columns Map & Status Timeline */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Status Timeline */}
                  <div className="glass rounded-2xl p-5">
                    <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-4">
                      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Relay Lifecycle Status</span>
                      <span className="rounded-full bg-secondary/80 border border-border/40 px-2.5 py-0.5 text-[10px] font-mono text-muted-foreground uppercase">{activeCase.status}</span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center text-[10px] font-mono font-semibold uppercase">
                      {[
                        { label: "Created", key: "CASE_CREATED" },
                        { label: "Triaged", key: "TRIAGE_COMPLETED" },
                        { label: "Hospital", key: "HOSPITAL_ASSIGNED" },
                        { label: "Ambulance", key: "AMBULANCE_ASSIGNED" },
                        { label: "Surgeon Alert", key: "DOCTOR_ALERTED" },
                        { label: "En Route", key: "PATIENT_EN_ROUTE" },
                        { label: "Arrived", key: "PATIENT_ARRIVED" }
                      ].map((step, idx) => {
                        const isCurrent = activeCase.status === step.key;
                        const isDone = isStepCompleted(activeCase.status, step.key as CaseStatus);
                        
                        return (
                          <div
                            key={step.key}
                            className={`rounded-lg border p-2 flex flex-col justify-between h-14 ${
                              isCurrent ? "border-emergency bg-emergency/15 text-white glow-emergency" 
                              : isDone ? "border-medical/60 bg-medical/10 text-medical"
                              : "border-border/30 bg-secondary/10 text-muted-foreground/60"
                            }`}
                          >
                            <span>0{idx+1}</span>
                            <span className="truncate">{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Leaflet Live Map Card */}
                  <div className="glass rounded-2xl overflow-hidden relative border border-border/60">
                    <div className="absolute top-4 left-4 z-[999] glass rounded-lg px-3 py-1.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emergency animate-ping" />
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold">OSRM Green Corridor Stream</span>
                    </div>
                    <div ref={mapContainerRef} className="h-[480px] w-full" />
                  </div>
                </div>

                {/* Sidebar details (ETA, Vitals, Triage, Doctor Brief, Logs) */}
                <div className="space-y-6">
                  
                  {/* ETA Progress Card */}
                  <div className="glass rounded-2xl p-5 relative overflow-hidden scanline border border-border/85">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Dispatched Ambulance Unit</span>
                      {activeCase.ambulance && (
                        <span className="text-[10px] font-mono text-emerald-400 font-bold animate-pulse">LIVE TRACKING</span>
                      )}
                    </div>
                    
                    {activeCase.ambulance ? (
                      <div className="mt-3">
                        <div className="flex items-baseline gap-2">
                          <span className="font-display text-5xl font-black text-white tabular-nums tracking-tight">
                            {activeCase.ambulance.etaMin}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">min remaining</span>
                        </div>
                        <p className="text-xs font-mono text-muted-foreground mt-1.5">
                          Callsign: <span className="text-foreground font-bold">{activeCase.ambulance.callsign}</span> · Speed: <span className="text-foreground font-bold">{activeCase.ambulance.speedKmh} km/h</span>
                        </p>
                        
                        {/* Progress Bar */}
                        <div className="mt-4 h-1.5 w-full bg-secondary/60 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-emergency to-medical"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round((activeCase.routeProgress ?? 0) * 100)}%` }}
                            transition={{ ease: "linear" }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center gap-2 text-xs font-mono text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-emergency" />
                        <span>Finding nearest optimal first-responder depot…</span>
                      </div>
                    )}
                  </div>

                  {/* Vitals Live Monitor */}
                  {activeCase.vitals && (
                    <div className="glass rounded-2xl p-5 border border-border/60">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5 text-emergency animate-pulse" /> Live Physiological Stream
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3 font-mono">
                        <div className="rounded-xl bg-secondary/35 p-3 text-center border border-border/20">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold">BP (sys/dia)</p>
                          <p className="mt-1 text-base font-black text-foreground tabular-nums">{activeCase.vitals.bp}</p>
                        </div>
                        <div className="rounded-xl bg-secondary/35 p-3 text-center border border-border/20">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold">HR (bpm)</p>
                          <p className="mt-1 text-base font-black text-emergency tabular-nums animate-pulse">{activeCase.vitals.hr}</p>
                        </div>
                        <div className="rounded-xl bg-secondary/35 p-3 text-center border border-border/20">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold">SpO₂ (%)</p>
                          <p className="mt-1 text-base font-black text-emerald-400 tabular-nums">{activeCase.vitals.spo2}%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Triage & Specialist Match */}
                  {activeCase.triage && (
                    <div className="glass rounded-2xl p-5 border border-border/60">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Triage Diagnostic Report</span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${
                          activeCase.triage.severity === "CRITICAL" ? "border-emergency/60 bg-emergency/15 text-emergency"
                          : activeCase.triage.severity === "URGENT" ? "border-warning/60 bg-warning/15 text-warning"
                          : "border-success/60 bg-success/15 text-success"
                        }`}>
                          {activeCase.triage.severity}
                        </span>
                      </div>
                      <h4 className="mt-3 font-display text-lg font-bold">{activeCase.triage.condition}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{activeCase.triage.reasoning}</p>
                      
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="rounded-xl bg-secondary/30 p-2.5">
                          <span className="text-[9px] text-muted-foreground block uppercase">Specialist Alerted</span>
                          <span className="font-bold block mt-1 truncate">{activeCase.triage.specialist}</span>
                        </div>
                        <div className="rounded-xl bg-secondary/30 p-2.5">
                          <span className="text-[9px] text-muted-foreground block uppercase">Time-to-Stabilize</span>
                          <span className="font-bold block mt-1 text-emergency">&lt; 30 mins</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Matched Hospital Card */}
                  {activeCase.hospital && (
                    <div className="glass rounded-2xl p-5 border border-border/60">
                      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        <span>Optimal Hospital Node</span>
                        <span className="text-emerald-400 font-bold">MATCH FOUND</span>
                      </div>
                      <h4 className="mt-3 font-display text-lg font-bold">{activeCase.hospital.name}</h4>
                      
                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-mono text-center">
                        <div className="rounded-xl bg-secondary/30 p-2 border border-border/20">
                          <span className="text-[8px] text-muted-foreground uppercase">ICU Beds</span>
                          <span className="font-bold block mt-0.5">{activeCase.hospital.icuBeds}</span>
                        </div>
                        <div className="rounded-xl bg-secondary/30 p-2 border border-border/20">
                          <span className="text-[8px] text-muted-foreground uppercase">ER Beds</span>
                          <span className="font-bold block mt-0.5">{activeCase.hospital.emergencyBeds}</span>
                        </div>
                        <div className="rounded-xl bg-secondary/30 p-2 border border-border/20">
                          <span className="text-[8px] text-muted-foreground uppercase font-bold text-warning">Rating</span>
                          <span className="font-bold block mt-0.5 text-warning">{activeCase.hospital.rating} ★</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Multi-Agent Live Execution Logs */}
                  <div className="glass rounded-2xl p-5 border border-border/60">
                    <div className="flex items-center justify-between border-b border-border/20 pb-2 mb-3">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Live Agent Execution logs</span>
                      <button
                        onClick={store.clearAll}
                        className="text-[9px] font-mono text-muted-foreground/60 hover:text-emergency transition-colors uppercase font-bold flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" /> Clear Hub
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-56 overflow-auto pr-1">
                      <AnimatePresence initial={false}>
                        {(Array.isArray(activeCase.agentLog) ? activeCase.agentLog : []).slice().reverse().map((log, index) => (
                          <motion.div
                            key={index + log.message}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-2 text-[11px] leading-relaxed border-b border-border/10 pb-1.5 last:border-0"
                          >
                            <span className={`font-mono font-bold uppercase tracking-wider shrink-0 ${
                              log.agent === "TRIAGE" ? "text-emergency"
                              : log.agent === "HOSPITAL" ? "text-medical"
                              : log.agent === "AMBULANCE" ? "text-warning"
                              : log.agent === "DOCTOR" ? "text-primary"
                              : "text-muted-foreground"
                            }`}>
                              [{log.agent}]
                            </span>
                            <span className="text-foreground/90 font-sans">{log.message}</span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                  
                </div>

              </div>
            )}
          </div>
        )}

      </main>

    </div>
  );
}

// Helpers
function isStepCompleted(currentStatus: CaseStatus, stepKey: CaseStatus): boolean {
  const ORDER: CaseStatus[] = [
    "CASE_CREATED",
    "TRIAGE_COMPLETED",
    "HOSPITAL_ASSIGNED",
    "AMBULANCE_ASSIGNED",
    "DOCTOR_ALERTED",
    "PATIENT_EN_ROUTE",
    "PATIENT_ARRIVED"
  ];
  return ORDER.indexOf(currentStatus) >= ORDER.indexOf(stepKey);
}
