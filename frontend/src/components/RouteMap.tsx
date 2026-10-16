import { useRef } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import { routeMapHtml, useRouteMapBridge, type RouteMapProps } from "./routeMapBridge";

export function RouteMap(props: RouteMapProps) {
  const webView = useRef<WebView>(null);
  const bridge = useRouteMapBridge(props, (message) =>
    webView.current?.injectJavaScript(`window.receive(${JSON.stringify(message)}); true;`),
  );
  return (
    <View style={{ height: 320, borderRadius: 18, overflow: "hidden" }}>
      <WebView
        ref={webView}
        originWhitelist={["*"]}
        // OpenStreetMap blocks tile requests that arrive without a Referer.
        source={{ html: routeMapHtml, baseUrl: "https://github.com/tristanvernet/PaceATL" }}
        onLoadEnd={bridge.onLoad}
        onMessage={(event) => bridge.onMessage(event.nativeEvent.data)}
      />
    </View>
  );
}
