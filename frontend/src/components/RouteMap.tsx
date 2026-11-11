import { useRef } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import { mapHtml, useMapBridge, type RouteMapProps } from "./routeMapBridge";

export function RouteMap({ scene, onMessage, style }: RouteMapProps) {
  const webView = useRef<WebView>(null);
  const bridge = useMapBridge(scene, onMessage, (message) =>
    webView.current?.injectJavaScript(`window.receive(${JSON.stringify(message)}); true;`),
  );
  return (
    <View style={[{ overflow: "hidden" }, style]}>
      <WebView
        ref={webView}
        originWhitelist={["*"]}
        // Tile servers reject requests that arrive without a Referer.
        source={{ html: mapHtml, baseUrl: "https://github.com/tristanvernet/PaceATL" }}
        onLoadEnd={bridge.onLoad}
        onMessage={(event) => bridge.onMessage(event.nativeEvent.data)}
      />
    </View>
  );
}
