import { useEffect, useRef } from "react";
import type L from "leaflet";
import type { EmergencyCase } from "@/lib/types";
import { HOSPITALS } from "@/lib/hospitals";

interface Props {
  caseData?: EmergencyCase;
  className?: string;
}

function ambulanceIcon(Leaf: typeof L) {
  return Leaf.divIcon({
    className: "",
    iconSize: [36, 36] as L.PointExpression,
    iconAnchor: [18, 18] as L.PointExpression,
    html: `<div style="position:relative;width:36px;height:36px;">
      <div style="position:absolute;inset:0;border-radius:9999px;background:oklch(0.65 0.26 25 / 0.4);animation:pulse-ring 1.6s infinite;"></div>
      <div style="position:absolute;inset:6px;border-radius:9999px;background:oklch(0.65 0.26 25);display:grid;place-items:center;box-shadow:0 0 18px oklch(0.65 0.26 25 / 0.8);">
        <span style="color:white;font-weight:700;font-size:14px;font-family:'JetBrains Mono',monospace;">🚑</span>
      </div>
    </div>`,
  });
}

function hospitalIcon(Leaf: typeof L, highlight: boolean) {
  const color = highlight ? "oklch(0.78 0.16 200)" : "oklch(0.45 0.04 250)";
  const glow = highlight ? `box-shadow:0 0 18px ${color};` : "";
  return Leaf.divIcon({
    className: "",
    iconSize: [28, 28] as L.PointExpression,
    iconAnchor: [14, 14] as L.PointExpression,
    html: `<div style="width:28px;height:28px;border-radius:6px;background:${color};display:grid;place-items:center;${glow}border:2px solid oklch(0.16 0.02 250);">
      <span style="color:oklch(0.12 0.02 250);font-weight:700;font-size:14px;">+</span>
    </div>`,
  });
}

function patientIcon(Leaf: typeof L) {
  return Leaf.divIcon({
    className: "",
    iconSize: [24, 24] as L.PointExpression,
    iconAnchor: [12, 12] as L.PointExpression,
    html: `<div style="width:24px;height:24px;border-radius:9999px;background:oklch(0.80 0.18 80);border:3px solid oklch(0.16 0.02 250);box-shadow:0 0 14px oklch(0.80 0.18 80 / 0.8);"></div>`,
  });
}

export function LiveMap({ caseData, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const layersRef = useRef<L.Layer[]>([]);

  // Initialize map with dynamic Leaflet import (avoids SSR "window is not defined")
  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    let cancelled = false;

    import("leaflet").then((Leaf) => {
      if (cancelled || !ref.current) return;
      leafletRef.current = Leaf.default;
      const map = Leaf.default.map(ref.current!, {
        zoomControl: true,
        attributionControl: true,
      }).setView([12.9550, 77.6100], 12);
      Leaf.default.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const Leaf = leafletRef.current;
    if (!map || !Leaf) return;
    // Clear old layers
    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];

    // Hospitals
    HOSPITALS.forEach((h) => {
      const isMatch = caseData?.hospital?.id === h.id;
      const marker = Leaf.marker([h.lat, h.lng], { icon: hospitalIcon(Leaf, isMatch) })
        .addTo(map)
        .bindTooltip(`<b>${h.name}</b><br/>ICU: ${h.icuBeds} • ER: ${h.emergencyBeds}`, {
          direction: "top",
          className: "leaflet-tt-dark",
        });
      layersRef.current.push(marker);
    });

    if (!caseData) return;

    // Patient
    const pm = Leaf.marker([caseData.location.lat, caseData.location.lng], { icon: patientIcon(Leaf) })
      .addTo(map)
      .bindTooltip(`Patient: ${caseData.patient.name}`, { direction: "top" });
    layersRef.current.push(pm);

    // Route
    if (caseData.route) {
      const poly = Leaf.polyline(caseData.route, {
        color: "oklch(0.65 0.26 25)",
        weight: 4,
        opacity: 0.85,
      }).addTo(map);
      layersRef.current.push(poly);
    }

    // Ambulance
    if (caseData.ambulance) {
      const am = Leaf.marker([caseData.ambulance.lat, caseData.ambulance.lng], { icon: ambulanceIcon(Leaf) })
        .addTo(map)
        .bindTooltip(`${caseData.ambulance.callsign} • ETA ${caseData.ambulance.etaMin} min`, {
          direction: "top",
          permanent: true,
          offset: [0, -16],
        });
      layersRef.current.push(am);
    }

    // Fit bounds to current emergency
    const all: L.LatLngExpression[] = [
      [caseData.location.lat, caseData.location.lng],
    ];
    if (caseData.ambulance) all.push([caseData.ambulance.lat, caseData.ambulance.lng]);
    if (caseData.hospital) all.push([caseData.hospital.lat, caseData.hospital.lng]);
    if (all.length > 1) {
      map.fitBounds(Leaf.latLngBounds(all), { padding: [60, 60], maxZoom: 14 });
    }
  }, [caseData]);

  return <div ref={ref} className={className ?? "h-[420px] w-full rounded-xl overflow-hidden border border-border"} />;
}
