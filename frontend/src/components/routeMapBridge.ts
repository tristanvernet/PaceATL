import { useEffect, useMemo, useRef } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type { LatLng } from "../features/routes/geometry";
import { useAppearance, type Palette } from "../theme";

export type Layer = "routes" | "hotspots" | "hazards";
export type Selection =
  { kind: "route"; id: number } | { kind: "hotspot"; id: string } | { kind: "hazard"; id: number };

/** What a screen wants drawn. The map component adds the theme before posting it. */
export type MapScene = {
  routes: { id: number; points: LatLng[] }[];
  hotspots: ({ id: string } & LatLng)[];
  hazards: ({ id: number } & LatLng)[];
  draft: LatLng[];
  layers: Record<Layer, boolean>;
  selection: Selection | null;
  /**
   * The map fits to `bounds` (from `boundsOf`) each time `key` changes, keeping `inset` pixels
   * clear for overlays.
   */
  fit: { key: string; bounds: LatLng[]; inset: { top: number; bottom: number } };
};
export type HostMessage = MapScene & {
  type: "scene";
  dark: boolean;
  colors: Pick<Palette, "primary" | "error" | "panel" | "background">;
};
export type MapMessage =
  | { type: "tap"; point: LatLng }
  | { type: "select"; target: Selection }
  | { type: "moved"; center: LatLng };

export const EMPTY_SCENE: MapScene = {
  routes: [],
  hotspots: [],
  hazards: [],
  draft: [],
  layers: { routes: true, hotspots: true, hazards: true },
  selection: null,
  fit: { key: "", bounds: [], inset: { top: 0, bottom: 0 } },
};

/** The south-west and north-east corners around `points`, or the lone point itself. */
export function boundsOf(points: LatLng[]): LatLng[] {
  if (points.length < 2) return points;
  const latitudes = points.map((p) => p.latitude);
  const longitudes = points.map((p) => p.longitude);
  return [
    { latitude: Math.min(...latitudes), longitude: Math.min(...longitudes) },
    { latitude: Math.max(...latitudes), longitude: Math.max(...longitudes) },
  ];
}

const isCoordinate = (value: unknown, limit: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit;
function latLng(value: unknown): LatLng | null {
  const p = value as { latitude?: unknown; longitude?: unknown } | null;
  return p && isCoordinate(p.latitude, 90) && isCoordinate(p.longitude, 180)
    ? { latitude: p.latitude, longitude: p.longitude }
    : null;
}
function selection(value: unknown): Selection | null {
  const t = value as { kind?: unknown; id?: unknown } | null;
  if (t?.kind === "hotspot" && typeof t.id === "string") return { kind: "hotspot", id: t.id };
  if ((t?.kind === "route" || t?.kind === "hazard") && Number.isInteger(t.id))
    return { kind: t.kind, id: t.id as number };
  return null;
}

export function parseMapMessage(data: unknown): MapMessage | null {
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (typeof data !== "object" || data === null) return null;
  const message = data as { type?: unknown; point?: unknown; target?: unknown; center?: unknown };
  if (message.type === "tap") {
    const point = latLng(message.point);
    return point && { type: "tap", point };
  }
  if (message.type === "moved") {
    const center = latLng(message.center);
    return center && { type: "moved", center };
  }
  if (message.type === "select") {
    const target = selection(message.target);
    return target && { type: "select", target };
  }
  return null;
}

export type RouteMapProps = {
  scene: MapScene;
  onMessage?: (message: MapMessage) => void;
  style?: StyleProp<ViewStyle>;
  /** Accessible name for the map frame. */
  label: string;
};

/** Posts the scene to the map page whenever it changes, so callers memoize `scene`. */
export function useMapBridge(
  scene: MapScene,
  onMessage: ((message: MapMessage) => void) | undefined,
  post: (message: HostMessage) => void,
) {
  const { palette, dark } = useAppearance();
  const { primary, error, panel, background } = palette;
  const message = useMemo<HostMessage>(
    () => ({ type: "scene", dark, colors: { primary, error, panel, background }, ...scene }),
    [scene, dark, primary, error, panel, background],
  );
  const latest = useRef({ message, onMessage, post });
  latest.current = { message, onMessage, post };
  useEffect(() => {
    latest.current.post(message);
  }, [message]);
  return useRef({
    onLoad() {
      latest.current.post(latest.current.message);
    },
    onMessage(data: unknown) {
      const parsed = parseMapMessage(data);
      if (parsed) latest.current.onMessage?.(parsed);
    },
  }).current;
}

// Colors arrive from the host, so this page is the one place hex values are validated
// before they reach markup.
export const mapHtml = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<style>
  html, body, #map { height: 100%; margin: 0; }
  .hazard { display: grid; place-items: center; border-radius: 50%; font: 800 13px system-ui, sans-serif; box-shadow: 0 1px 4px rgba(0,0,0,.35); }
  .leaflet-control-attribution { font-size: 9px; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  const send = (message) =>
    window.ReactNativeWebView
      ? window.ReactNativeWebView.postMessage(JSON.stringify(message))
      : window.parent.postMessage(message, "*");
  const map = L.map("map", { zoomControl: false, zoomSnap: 0.5 }).setView([33.765, -84.37], 13);
  const groups = { routes: L.layerGroup(), hotspots: L.layerGroup(), hazards: L.layerGroup() };
  const draft = L.layerGroup().addTo(map);
  let tiles = null, tilesDark = null, fitted = null;

  map.on("click", (event) => {
    const { lat, lng } = event.latlng.wrap();
    send({ type: "tap", point: { latitude: lat, longitude: lng } });
  });
  map.on("moveend", () => {
    const { lat, lng } = map.getCenter().wrap();
    send({ type: "moved", center: { latitude: lat, longitude: lng } });
  });

  const hex = (value, fallback) => (typeof value === "string" && /^#[0-9a-f]{3,8}$/i.test(value) ? value : fallback);
  const valid = (p) => p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude);
  const ll = (points) => (Array.isArray(points) ? points.filter(valid).map((p) => [p.latitude, p.longitude]) : []);
  const list = (value) => (Array.isArray(value) ? value : []);
  const pick = (target) => () => send({ type: "select", target });
  const same = (selection, kind, id) => !!selection && selection.kind === kind && selection.id === id;

  function ends(latLngs, group, c) {
    latLngs.forEach((latLng, i) => {
      if (i === 0 || i === latLngs.length - 1)
        L.circleMarker(latLng, {
          radius: 7, weight: 3, fillOpacity: 1, interactive: false,
          color: c.primary, fillColor: i === 0 ? c.panel : c.primary,
        }).addTo(group);
    });
  }

  function render(scene) {
    if (!scene || scene.type !== "scene") return;
    const c = {
      primary: hex(scene.colors?.primary, "#d0532b"),
      error: hex(scene.colors?.error, "#a52c31"),
      panel: hex(scene.colors?.panel, "#ffffff"),
      background: hex(scene.colors?.background, "#ffffff"),
    };
    document.body.style.background = c.background;
    const dark = scene.dark === true;
    if (tilesDark !== dark) {
      if (tiles) tiles.remove();
      const canvas = (layer) =>
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_" + (dark ? "Dark" : "Light") + "_Gray_" + layer + "/MapServer/tile/{z}/{y}/{x}", {
          maxNativeZoom: 16,
          maxZoom: 19,
          className: "tiles-" + (dark ? "dark" : "light"),
          attribution: layer === "Base" ? "Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors" : "",
        });
      tiles = L.layerGroup([canvas("Base"), canvas("Reference")]).addTo(map);
      tilesDark = dark;
    }
    Object.values(groups).forEach((group) => group.clearLayers());
    draft.clearLayers();
    const selection = scene.selection;

    for (const route of list(scene.routes)) {
      const latLngs = ll(route.points);
      const chosen = same(selection, "route", route.id);
      L.polyline(latLngs, {
        color: c.primary, weight: chosen ? 7 : 5, lineCap: "round",
        opacity: !selection || chosen ? 0.95 : 0.45,
        className: "route", bubblingMouseEvents: false,
      }).on("click", pick({ kind: "route", id: route.id })).addTo(groups.routes);
      if (chosen) ends(latLngs, groups.routes, c);
    }
    for (const spot of list(scene.hotspots)) {
      if (!valid(spot)) continue;
      const position = [spot.latitude, spot.longitude];
      const chosen = same(selection, "hotspot", spot.id);
      L.circleMarker(position, { radius: chosen ? 30 : 22, stroke: false, fillColor: c.primary, fillOpacity: 0.16, interactive: false, className: "halo" }).addTo(groups.hotspots);
      L.circleMarker(position, {
        radius: chosen ? 10 : 8, weight: 2, color: c.panel, fillColor: c.primary, fillOpacity: 0.9,
        className: "hotspot", bubblingMouseEvents: false,
      }).on("click", pick({ kind: "hotspot", id: spot.id })).addTo(groups.hotspots);
    }
    for (const hazard of list(scene.hazards)) {
      if (!valid(hazard)) continue;
      const size = same(selection, "hazard", hazard.id) ? 28 : 22;
      L.marker([hazard.latitude, hazard.longitude], {
        icon: L.divIcon({
          className: "",
          iconSize: [size, size],
          html: '<div class="hazard" style="width:' + size + 'px;height:' + size + 'px;background:' + c.error + ';color:' + c.panel + '">!</div>',
        }),
      }).on("click", pick({ kind: "hazard", id: hazard.id })).addTo(groups.hazards);
    }
    const draftLatLngs = ll(scene.draft);
    if (draftLatLngs.length) {
      L.polyline(draftLatLngs, { color: c.primary, weight: 5, lineCap: "round", interactive: false, className: "draft" }).addTo(draft);
      ends(draftLatLngs, draft, c);
    }
    for (const [name, group] of Object.entries(groups)) {
      if (scene.layers && scene.layers[name]) group.addTo(map);
      else group.remove();
    }

    const fit = scene.fit || {};
    const fitPoints = ll(fit.bounds);
    if (fit.key && fit.key !== fitted && fitPoints.length) {
      const inset = fit.inset || {};
      if (fitPoints.length === 1) map.setView(fitPoints[0], 15);
      else map.fitBounds(fitPoints, {
        paddingTopLeft: [28, 28 + (inset.top || 0)],
        paddingBottomRight: [28, 28 + (inset.bottom || 0)],
        maxZoom: 16,
      });
      fitted = fit.key;
    }
  }
  window.receive = render;
  window.addEventListener("message", (event) => render(event.data));
</script>
</body>
</html>`;
