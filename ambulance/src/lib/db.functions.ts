import { createServerFn } from "@tanstack/react-start";
import { db } from "../db";
import { cases } from "../db/schema";
import { eq } from "drizzle-orm";
import type { EmergencyCase, AgentLogEntry, CaseStatus, TriageResult, Hospital } from "./types";

export const getCasesFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const allCases = await db.select().from(cases);
    const parsed: Record<string, EmergencyCase> = {};
    for (const c of allCases) {
      parsed[c.id] = {
        id: c.id,
        createdAt: c.createdAt,
        patient: {
          name: c.patientName,
          age: c.patientAge,
          gender: c.patientGender,
          medicalHistory: c.patientHistory,
        },
        symptoms: c.symptoms,
        location: { lat: c.locationLat, lng: c.locationLng, label: c.locationLabel },
        status: c.status as CaseStatus,
        triage: c.triageData ? (c.triageData as unknown as TriageResult) : undefined,
        hospital: c.hospitalData ? (c.hospitalData as unknown as Hospital) : undefined,
        ambulance: c.ambulanceData ? (c.ambulanceData as unknown as EmergencyCase["ambulance"]) : undefined,
        route: c.routeData ? (c.routeData as unknown as Array<[number, number]>) : undefined,
        routeProgress: c.routeProgress ?? undefined,
        vitals: c.vitalsData ? (c.vitalsData as unknown as EmergencyCase["vitals"]) : undefined,
        agentLog: c.agentLogData ? (c.agentLogData as unknown as AgentLogEntry[]) : [],
      };
    }
    return parsed;
  });

export const saveCaseFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input as EmergencyCase)
  .handler(async ({ data }: { data: EmergencyCase }) => {
    await db.insert(cases).values({
      id: data.id,
      createdAt: data.createdAt,
      patientName: data.patient.name,
      patientAge: data.patient.age,
      patientGender: data.patient.gender,
      patientHistory: data.patient.medicalHistory,
      symptoms: data.symptoms,
      locationLat: data.location.lat,
      locationLng: data.location.lng,
      locationLabel: data.location.label,
      status: data.status,
      triageData: data.triage ? JSON.stringify(data.triage) : null,
      hospitalData: data.hospital ? JSON.stringify(data.hospital) : null,
      ambulanceData: data.ambulance ? JSON.stringify(data.ambulance) : null,
      routeData: data.route ? JSON.stringify(data.route) : null,
      routeProgress: data.routeProgress,
      vitalsData: data.vitals ? JSON.stringify(data.vitals) : null,
      agentLogData: JSON.stringify(data.agentLog || []),
    }).onConflictDoUpdate({
      target: cases.id,
      set: {
        patientName: data.patient.name,
        patientAge: data.patient.age,
        patientGender: data.patient.gender,
        patientHistory: data.patient.medicalHistory,
        symptoms: data.symptoms,
        locationLat: data.location.lat,
        locationLng: data.location.lng,
        locationLabel: data.location.label,
        status: data.status,
        triageData: data.triage ? JSON.stringify(data.triage) : null,
        hospitalData: data.hospital ? JSON.stringify(data.hospital) : null,
        ambulanceData: data.ambulance ? JSON.stringify(data.ambulance) : null,
        routeData: data.route ? JSON.stringify(data.route) : null,
        routeProgress: data.routeProgress,
        vitalsData: data.vitals ? JSON.stringify(data.vitals) : null,
        agentLogData: JSON.stringify(data.agentLog || []),
      }
    });
    return { success: true };
  });
