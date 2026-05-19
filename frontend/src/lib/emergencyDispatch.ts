import { useEmergencyStore } from "@/store/useEmergencyStore";
import { distanceKm } from "./hospitals";
import type { Hospital, TriageResult, Severity, BackendEmergencyResponse } from "./emergencyTypes";

async function buildRoute(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<{ route: Array<[number, number]>; durationSec: number }> {
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`);
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        const durationSec = data.routes[0].duration || 0;
        return { route, durationSec };
      }
    }
  } catch (err) {
    console.error("OSRM routing failed, falling back to straight line", err);
  }

  // Fallback: Simple multi-waypoint path with slight jitter
  const steps = 40;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = from.lat + (to.lat - from.lat) * t;
    const lng = from.lng + (to.lng - from.lng) * t;
    const jitter = Math.sin(t * Math.PI * 3) * 0.0015;
    pts.push([lat + jitter, lng - jitter * 0.7]);
  }
  
  const distance = distanceKm(from, to);
  const durationSec = Math.round((distance / 58) * 3600);
  
  return { route: pts, durationSec };
}

export async function dispatchPipeline(caseId: string, backendRes: BackendEmergencyResponse) {
  const store = useEmergencyStore.getState();
  const c = store.cases[caseId];
  if (!c) return;

  // 1. Triage completed
  const triage: TriageResult = {
    severity: (backendRes.severity_level || "URGENT") as Severity,
    condition: backendRes.suspected_condition,
    specialist: backendRes.required_specialist,
    timeSensitivityMin: 30,
    requiredEquipment: [],
    preparationSteps: [],
    reasoning: "Triage via Backend LangGraph",
  };

  store.updateCase(caseId, { triage, status: "TRIAGE_COMPLETED" });
  store.pushLog(caseId, {
    ts: Date.now(),
    agent: "TRIAGE",
    level: triage.severity === "CRITICAL" ? "critical" : "info",
    message: `Severity ${triage.severity} — ${triage.condition}. Needs ${triage.specialist}.`,
  });

  await wait(700);

  // 2. Hospital finder
  const hospital: Hospital = {
    id: backendRes.selected_hospital.id || "h1",
    name: backendRes.selected_hospital.name,
    lat: backendRes.selected_hospital.lat,
    lng: backendRes.selected_hospital.lng,
    icuBeds: 5,
    emergencyBeds: 10,
    specialists: [backendRes.required_specialist],
    rating: Number(backendRes.selected_hospital.rating) || 4.0,
  };

  store.pushLog(caseId, {
    ts: Date.now(),
    agent: "HOSPITAL",
    level: "success",
    message: `Matched ${hospital.name} — Rating: ${hospital.rating}.`,
  });
  store.updateCase(caseId, { hospital, status: "HOSPITAL_ASSIGNED" });

  await wait(700);

  // 3. Ambulance assignment
  const depot = {
    id: `dynamic-${Math.floor(Math.random() * 1000)}`,
    callsign: `RELAY-${Math.floor(Math.random() * 90) + 10}`,
    lat: c.location.lat + (Math.random() - 0.5) * 0.05,
    lng: c.location.lng + (Math.random() - 0.5) * 0.05,
  };

  const { route, durationSec } = await buildRoute({ lat: depot.lat, lng: depot.lng }, c.location);
  const etaMin = Math.round(durationSec / 60) || Math.round(backendRes.eta_minutes) || Math.max(4, Math.round(distanceKm(depot, c.location) * 2.4));
  
  // 4. Doctor briefing
  store.updateCase(caseId, {
    ambulance: {
      id: depot.id,
      callsign: depot.callsign,
      lat: depot.lat,
      lng: depot.lng,
      etaMin,
      initialEtaMin: etaMin,
      speedKmh: 58,
    },
    route,
    routeProgress: 0,
    status: "PENDING_ACCEPTANCE", // Waiting for manual accept from portal
    vitals: { bp: simulateBP(triage.severity), hr: simulateHR(triage.severity), spo2: simulateSpO2(triage.severity) },
  });
  
  store.pushLog(caseId, {
    ts: Date.now(),
    agent: "SYSTEM",
    level: "warning",
    message: `Dispatch ready. Notification sent to ${depot.callsign} and ER Doctor. Awaiting manual acceptance.`,
  });
}

function simulateBP(sev: string) {
  if (sev === "CRITICAL") return "160/100";
  if (sev === "URGENT") return "145/92";
  return "128/82";
}
function simulateHR(sev: string) {
  if (sev === "CRITICAL") return 118;
  if (sev === "URGENT") return 102;
  return 88;
}
function simulateSpO2(sev: string) {
  if (sev === "CRITICAL") return 89;
  if (sev === "URGENT") return 94;
  return 97;
}

const TICKERS = new Map<string, ReturnType<typeof setInterval>>();

export function startAmbulanceSimulation(caseId: string) {
  if (TICKERS.has(caseId)) return;
  const tick = setInterval(() => {
    const c = useEmergencyStore.getState().cases[caseId];
    if (!c || !c.route || !c.ambulance) {
      clearInterval(tick);
      TICKERS.delete(caseId);
      return;
    }
    const progress = Math.min(1, (c.routeProgress ?? 0) + 0.018);
    const idx = Math.floor(progress * (c.route.length - 1));
    const [lat, lng] = c.route[idx];
    
    const initialEta = c.ambulance.initialEtaMin ?? c.ambulance.etaMin;
    const remaining = Math.max(0, Math.round(initialEta * (1 - progress)));
    
    useEmergencyStore.getState().updateCase(caseId, {
      routeProgress: progress,
      ambulance: { ...c.ambulance, lat, lng, etaMin: remaining },
    });

    if (progress >= 1) {
      useEmergencyStore.getState().setStatus(caseId, "PATIENT_ARRIVED");
      useEmergencyStore.getState().pushLog(caseId, {
        ts: Date.now(),
        agent: "SYSTEM",
        level: "success",
        message: `Patient arrived at ${c.hospital?.name}. Handover to ${c.triage?.specialist}.`,
      });
      clearInterval(tick);
      TICKERS.delete(caseId);
    }
  }, 600);
  TICKERS.set(caseId, tick);
}

function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
