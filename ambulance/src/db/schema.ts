import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const cases = sqliteTable("cases", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at").notNull(),
  patientName: text("patient_name").notNull(),
  patientAge: integer("patient_age").notNull(),
  patientGender: text("patient_gender").notNull(),
  patientHistory: text("patient_history").notNull(),
  symptoms: text("symptoms").notNull(),
  locationLat: real("location_lat").notNull(),
  locationLng: real("location_lng").notNull(),
  locationLabel: text("location_label").notNull(),
  status: text("status").notNull(),
  triageData: text("triage_data", { mode: "json" }),
  hospitalData: text("hospital_data", { mode: "json" }),
  ambulanceData: text("ambulance_data", { mode: "json" }),
  routeData: text("route_data", { mode: "json" }),
  routeProgress: real("route_progress"),
  vitalsData: text("vitals_data", { mode: "json" }),
  agentLogData: text("agent_log_data", { mode: "json" }).notNull(),
});
