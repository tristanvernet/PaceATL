import { useEffect, useRef } from "react";
import { View } from "react-native";
import { hotspotMapHtml } from "./mapHtml";
import type { Hotspot } from "./HotspotMapScreen";
export function HotspotMap({ hotspots, onSelect }: { hotspots: Hotspot[]; onSelect: (id: string) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(hotspots); latest.current = hotspots;
  useEffect(() => { frame.current?.contentWindow?.postMessage({ type: "hotspots", hotspots }, "*"); }, [hotspots]);
  useEffect(() => { const handler = (event: MessageEvent) => {
    if (event.source === frame.current?.contentWindow && event.data?.type === "select" && typeof event.data.id === "string") onSelect(event.data.id);
  }; window.addEventListener("message", handler); return () => window.removeEventListener("message", handler); }, [onSelect]);
  return <View style={{ height: 340, marginBottom: 16, overflow: "hidden", borderRadius: 16 }}><iframe ref={frame} title="Atlanta activity hotspots" srcDoc={hotspotMapHtml} onLoad={() => frame.current?.contentWindow?.postMessage({ type: "hotspots", hotspots: latest.current }, "*")} style={{ width: "100%", height: "100%", border: 0 }}/></View>;
}
