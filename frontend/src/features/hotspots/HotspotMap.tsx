import { useEffect, useRef } from "react";
import { View } from "react-native";
import WebView from "react-native-webview";
import { hotspotMapHtml } from "./mapHtml";
import type { Hotspot } from "./HotspotMapScreen";
export function HotspotMap({ hotspots, onSelect }: { hotspots: Hotspot[]; onSelect: (id: string) => void }) {
  const ref = useRef<WebView>(null);
  const latest = useRef(hotspots); latest.current = hotspots;
  const send = (items: Hotspot[]) => ref.current?.injectJavaScript(`window.receiveHotspots(${JSON.stringify({ type: "hotspots", hotspots: items })});true;`);
  useEffect(() => { send(hotspots); }, [hotspots]);
  return <View style={{ height: 340, marginBottom: 16, borderRadius: 16, overflow: "hidden" }}><WebView ref={ref} originWhitelist={["*"]} source={{ html: hotspotMapHtml }} javaScriptEnabled onLoadEnd={() => send(latest.current)} onMessage={event => { try { const message = JSON.parse(event.nativeEvent.data); if (message.type === "select" && typeof message.id === "string") onSelect(message.id); } catch { /* ignore invalid map message */ } }}/></View>;
}
