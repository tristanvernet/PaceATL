import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest, errorMessage } from "../../api/client";
import { RouteMap } from "../../components/RouteMap";
import { EMPTY_SCENE, type MapMessage } from "../../components/routeMapBridge";
import { Button, Field, Notice, useLeave } from "../../components/ui";
import { fonts, useTheme } from "../../theme";
import { SignInPrompt } from "../../components/SignInPrompt";
import { useSession } from "../auth/SessionProvider";
import { RoundButton, Sheet, passThrough } from "./controls";
import { ROUTE_NAME_MAX, routeDistanceMeters, validateRoute, type LatLng } from "./geometry";
import { miles, type SavedRoute } from "./types";

type Save = { status: "idle" | "saving" } | { status: "error"; message: string };

export default function BuildRouteScreen() {
  const c = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, ready } = useSession();
  const leave = useLeave("/routes");
  const [points, setPoints] = useState<LatLng[]>([]);
  const [name, setName] = useState("");
  const [save, setSave] = useState<Save>({ status: "idle" });
  const scene = useMemo(() => ({ ...EMPTY_SCENE, draft: points }), [points]);

  const onMessage = (message: MapMessage) => {
    if (message.type === "tap") setPoints((current) => [...current, message.point]);
  };
  const problem = Object.values(validateRoute({ name, points }))[0];

  async function saveRoute() {
    setSave({ status: "saving" });
    try {
      const route = await apiRequest<SavedRoute>("/api/routes", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), points }),
      });
      router.replace(`/routes/${route.routeId}`);
    } catch (e) {
      setSave({
        status: "error",
        message: errorMessage(e, "Could not save the route."),
      });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <RouteMap
        label="Route builder map"
        scene={scene}
        onMessage={onMessage}
        style={{ flex: 1 }}
      />
      <View
        style={[
          passThrough,
          {
            position: "absolute",
            top: insets.top + 12,
            left: 14,
            right: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          },
        ]}
      >
        <RoundButton icon="chevron-back" label="Back" onPress={leave} />
        <View
          style={{
            backgroundColor: c.panel,
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: c.text, fontSize: 13, fontWeight: "700" }}>
            Tap the map to add points
          </Text>
        </View>
      </View>
      <Sheet>
        <View
          style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}
        >
          <View>
            <Text
              accessibilityRole="header"
              style={{ color: c.text, fontFamily: fonts.heading, fontSize: 19 }}
            >
              Build a route
            </Text>
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>
              {points.length} {points.length === 1 ? "point" : "points"}
            </Text>
          </View>
          <Text
            accessibilityLabel="Route distance"
            style={{ color: c.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 }}
          >
            {miles(routeDistanceMeters(points))}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginVertical: 12 }}>
          <View style={{ flex: 1 }}>
            <Button
              title="Undo last point"
              secondary
              disabled={points.length === 0}
              onPress={() => setPoints((current) => current.slice(0, -1))}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Clear"
              secondary
              disabled={points.length === 0}
              onPress={() => setPoints([])}
            />
          </View>
        </View>
        {!ready ? null : !user ? (
          <SignInPrompt compact text="Sign in to save this route. Your drawing stays here while you do." />
        ) : (
          <>
            <Field
              label="Route name"
              placeholder="Piedmont loop"
              maxLength={ROUTE_NAME_MAX}
              value={name}
              onChangeText={setName}
            />
            {save.status === "error" ? <Notice text={save.message} error /> : null}
            <Button
              title="Save route"
              loading={save.status === "saving"}
              disabled={!!problem}
              onPress={saveRoute}
            />
            {problem ? (
              <Text style={{ color: c.muted, fontSize: 12, marginTop: 8, textAlign: "center" }}>
                {problem}
              </Text>
            ) : null}
          </>
        )}
        <View style={{ height: insets.bottom }} />
      </Sheet>
    </View>
  );
}
