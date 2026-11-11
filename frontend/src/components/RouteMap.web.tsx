import { useEffect, useRef } from "react";
import { View } from "react-native";
import { mapHtml, useMapBridge, type RouteMapProps } from "./routeMapBridge";

export function RouteMap({ scene, onMessage, style, label }: RouteMapProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const bridge = useMapBridge(scene, onMessage, (message) =>
    frame.current?.contentWindow?.postMessage(message, "*"),
  );
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow) bridge.onMessage(event.data);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [bridge]);
  return (
    <View style={[{ overflow: "hidden" }, style]}>
      <iframe
        ref={frame}
        title={label}
        srcDoc={mapHtml}
        onLoad={bridge.onLoad}
        style={{ border: 0, width: "100%", height: "100%" }}
      />
    </View>
  );
}
