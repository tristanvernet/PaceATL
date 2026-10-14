import { useEffect, useRef } from "react";
import type { LatLng } from "../features/routes/geometry";
import { light } from "../theme";

export type RouteMapProps = {
  points: LatLng[];
  onAddPoint?: (point: LatLng) => void;
};
export type MapMessage = { type: "tap"; point: LatLng };
export type HostMessage = { type: "points"; points: LatLng[] };

const isCoordinate = (value: unknown, limit: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit;

export function parseMapMessage(data: unknown): MapMessage | null {
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (typeof data !== "object" || data === null) return null;
  const message = data as { type?: unknown; point?: { latitude?: unknown; longitude?: unknown } };
  const point = message.point;
  if (
    message.type === "tap" &&
    isCoordinate(point?.latitude, 90) &&
    isCoordinate(point?.longitude, 180)
  )
    return { type: "tap", point: { latitude: point.latitude, longitude: point.longitude } };
  return null;
}

export function useRouteMapBridge(
  { points, onAddPoint }: RouteMapProps,
  post: (message: HostMessage) => void,
) {
  const latest = useRef({ points, onAddPoint, post });
  latest.current = { points, onAddPoint, post };
  useEffect(() => {
    post({ type: "points", points });
  }, [points]);
  return useRef({
    onLoad() {
      latest.current.post({ type: "points", points: latest.current.points });
    },
    onMessage(data: unknown) {
      const message = parseMapMessage(data);
      if (message) latest.current.onAddPoint?.(message.point);
    },
  }).current;
}

export const routeMapHtml = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<style>html, body, #map { height: 100%; margin: 0; }</style>
</head>
<body>
<div id="map"></div>
<script>
  const send = (message) =>
    window.ReactNativeWebView
      ? window.ReactNativeWebView.postMessage(JSON.stringify(message))
      : window.parent.postMessage(message, "*");
  const map = L.map("map").setView([33.749, -84.388], 14);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  const line = L.polyline([], { color: "${light.primary}", weight: 5 }).addTo(map);
  const ends = L.layerGroup().addTo(map);
  let shown = 0;
  map.on("click", (event) => {
    const { lat, lng } = event.latlng.wrap();
    send({ type: "tap", point: { latitude: lat, longitude: lng } });
  });
  window.receive = (message) => {
    if (message?.type !== "points") return;
    const latLngs = message.points.map((p) => [p.latitude, p.longitude]);
    line.setLatLngs(latLngs);
    ends.clearLayers();
    latLngs.forEach((latLng, i) => {
      if (i === 0 || i === latLngs.length - 1)
        L.circleMarker(latLng, {
          radius: 7,
          color: "#ffffff",
          weight: 2,
          fillOpacity: 1,
          fillColor: i === 0 ? "${light.primary}" : "${light.error}",
        }).addTo(ends);
    });
    if (shown === 0 && latLngs.length > 1) map.fitBounds(line.getBounds(), { padding: [24, 24] });
    shown = latLngs.length;
  };
  window.addEventListener("message", (event) => window.receive(event.data));
</script>
</body>
</html>`;
