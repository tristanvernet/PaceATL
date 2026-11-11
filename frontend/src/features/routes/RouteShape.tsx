import { View } from "react-native";
import { useTheme } from "../../theme";
import type { LatLng } from "./geometry";

const STROKE = 3;

/** The route's outline drawn from rotated line segments, so it needs no SVG library. */
export function RouteShape({ points, size = 46 }: { points: LatLng[]; size?: number }) {
  const c = useTheme();
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats),
    maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs),
    maxLng = Math.max(...lngs);
  const squash = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const pad = size * 0.2;
  const scale = (size - 2 * pad) / Math.max((maxLng - minLng) * squash, maxLat - minLat, 1e-9);
  const xy = points.map((p) => ({
    x: size / 2 + (p.longitude - (minLng + maxLng) / 2) * squash * scale,
    y: size / 2 - (p.latitude - (minLat + maxLat) / 2) * scale,
  }));
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        backgroundColor: c.soft,
        overflow: "hidden",
      }}
    >
      {xy.slice(1).map((b, i) => {
        const a = xy[i];
        const length = Math.hypot(b.x - a.x, b.y - a.y) + STROKE;
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: (a.x + b.x) / 2 - length / 2,
              top: (a.y + b.y) / 2 - STROKE / 2,
              width: length,
              height: STROKE,
              borderRadius: STROKE,
              backgroundColor: c.primary,
              transform: [{ rotate: `${Math.atan2(b.y - a.y, b.x - a.x)}rad` }],
            }}
          />
        );
      })}
    </View>
  );
}
