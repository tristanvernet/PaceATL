import { useEffect, useRef } from "react";
import { View } from "react-native";
import { routeMapHtml, useRouteMapBridge, type RouteMapProps } from "./routeMapBridge";

export function RouteMap(props: RouteMapProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const bridge = useRouteMapBridge(props, (message) =>
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
    <View style={{ height: 320, borderRadius: 18, overflow: "hidden" }}>
      <iframe
        ref={frame}
        title="Route map"
        srcDoc={routeMapHtml}
        onLoad={bridge.onLoad}
        style={{ border: 0, width: "100%", height: "100%" }}
      />
    </View>
  );
}
