export type Severity = "CRITICAL" | "URGENT" | "MODERATE" | "LOW";

export type CaseStatus =
  | "CASE_CREATED"
  | "TRIAGE_COMPLETED"
  | "HOSPITAL_ASSIGNED"
  | "AMBULANCE_ASSIGNED"
  | "DOCTOR_ALERTED"
  | "PATIENT_EN_ROUTE"
  | "PATIENT_ARRIVED";

export interface TriageResult {
  severity: Severity;
  condition: string;
  specialist: string;
  timeSensitivityMin: number;
  requiredEquipment: string[];
  preparationSteps: string[];
  reasoning: string;
}

export interface Hospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  icuBeds: number;
  emergencyBeds: number;
  specialists: string[];
  rating: number;
}

export interface EmergencyCase {
  id: string;
  createdAt: number;
  patient: {
    name: string;
    age: number;
    gender: string;
    medicalHistory: string;
  };
  symptoms: string;
  location: { lat: number; lng: number; label: string };
  status: CaseStatus;
  triage?: TriageResult;
  hospital?: Hospital;
  ambulance?: {
    id: string;
    callsign: string;
    lat: number;
    lng: number;
    etaMin: number;
    initialEtaMin?: number;
    speedKmh: number;
  };
  route?: Array<[number, number]>;
  routeProgress?: number; // 0..1
  vitals?: { bp: string; hr: number; spo2: number };
  agentLog: AgentLogEntry[];
}

export interface AgentLogEntry {
  ts: number;
  agent: "TRIAGE" | "HOSPITAL" | "AMBULANCE" | "DOCTOR" | "SYSTEM";
  message: string;
  level?: "info" | "success" | "warn" | "critical";
}

export interface BackendEmergencyResponse {
  severity_level: Severity | string;
  suspected_condition: string;
  required_specialist: string;
  selected_hospital: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    rating: number | string;
  };
  eta_minutes: number;
  route_details: string;
  doctor_brief: string;
}
