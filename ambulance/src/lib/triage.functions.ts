import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { BackendEmergencyResponse } from "./types";

const InputSchema = z.object({
  symptoms: z.string().min(3).max(2000),
  age: z.number().int().min(0).max(120),
  gender: z.string().min(1).max(20),
  medicalHistory: z.string().max(1000),
  patient_lat: z.number(),
  patient_lng: z.number(),
});

export const triagePatient = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<BackendEmergencyResponse> => {
    try {
      // Append age, gender, and medical history to symptoms for the backend model
      const raw_symptoms = `Patient: ${data.age}-year-old ${data.gender}. History: ${data.medicalHistory || "none"}. Symptoms: ${data.symptoms}`;

      const response = await fetch("http://127.0.0.1:8000/api/v1/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_symptoms,
          patient_lat: data.patient_lat,
          patient_lng: data.patient_lng,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Backend error: ${response.status} ${errText}`);
      }

      const result = await response.json();
      return result as BackendEmergencyResponse;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Triage failed: ${msg}`);
    }
  });
