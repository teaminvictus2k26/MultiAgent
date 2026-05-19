import type { Hospital } from "./types";

// Mock hospital network (centered around Bengaluru)
export const HOSPITALS: Hospital[] = [
  {
    id: "h1",
    name: "City Care Hospital",
    lat: 12.9716,
    lng: 77.5946,
    icuBeds: 3,
    emergencyBeds: 8,
    specialists: ["Cardiologist", "Neurologist", "Trauma Surgeon", "Pulmonologist"],
    rating: 4.7,
  },
  {
    id: "h2",
    name: "Apollo Med Center",
    lat: 12.9352,
    lng: 77.6245,
    icuBeds: 1,
    emergencyBeds: 4,
    specialists: ["Cardiologist", "Orthopedic Surgeon", "Pediatrician"],
    rating: 4.8,
  },
  {
    id: "h3",
    name: "Manipal Emergency Wing",
    lat: 12.9606,
    lng: 77.6480,
    icuBeds: 5,
    emergencyBeds: 12,
    specialists: ["Trauma Surgeon", "Neurosurgeon", "Cardiologist", "Burn Specialist"],
    rating: 4.6,
  },
  {
    id: "h4",
    name: "Fortis Heart Institute",
    lat: 12.9279,
    lng: 77.6271,
    icuBeds: 2,
    emergencyBeds: 6,
    specialists: ["Cardiologist", "Cardiothoracic Surgeon", "Pulmonologist"],
    rating: 4.9,
  },
  {
    id: "h5",
    name: "St. John's Medical",
    lat: 12.9279,
    lng: 77.6101,
    icuBeds: 0,
    emergencyBeds: 3,
    specialists: ["Pediatrician", "General Surgeon"],
    rating: 4.4,
  },
];

export const AMBULANCE_DEPOTS = [
  { id: "a1", callsign: "RELAY-07", lat: 12.9550, lng: 77.6050 },
  { id: "a2", callsign: "RELAY-12", lat: 12.9650, lng: 77.6200 },
  { id: "a3", callsign: "RELAY-03", lat: 12.9450, lng: 77.5900 },
];

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}
