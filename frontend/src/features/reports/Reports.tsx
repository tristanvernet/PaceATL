import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiRequest, errorMessage } from "../../api/client";
import {
  BackButton,
  Button,
  Card,
  Field,
  Heading,
  Label,
  Notice,
  Screen,
  useLeave,
} from "../../components/ui";
import { useTheme } from "../../theme";
import { useSession } from "../auth/SessionProvider";
import type { LatLng } from "../routes/geometry";
import { HAZARD_CATEGORIES, HAZARD_CATEGORY_KEYS, type HazardCategory } from "./categories";

type Submit =
  { status: "editing" | "submitting" | "submitted" } | { status: "error"; message: string };

export function ReportScreen({ location, routeId }: { location: LatLng; routeId: number | null }) {
  const c = useTheme();
  const router = useRouter();
  const { user, ready } = useSession();
  const [category, setCategory] = useState<HazardCategory>("hazard");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submit, setSubmit] = useState<Submit>({ status: "editing" });
  const done = useLeave("/routes");

  async function send() {
    setSubmit({ status: "submitting" });
    try {
      await apiRequest("/api/reports/report", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          category,
          description: description.trim(),
          latitude: location.latitude,
          longitude: location.longitude,
          ...(routeId === null ? {} : { routeId }),
        }),
      });
      setSubmit({ status: "submitted" });
    } catch (e) {
      setSubmit({
        status: "error",
        message: errorMessage(e, "Could not submit the report. Try again."),
      });
    }
  }

  if (submit.status === "submitted")
    return (
      <Screen>
        <BackButton />
        <View style={{ alignItems: "center", gap: 14, paddingVertical: 28 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: c.soft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="checkmark" size={32} color={c.primary} />
          </View>
          <Heading
            title="Report sent"
            subtitle="Thanks for looking out for other runners. An admin reviews every report before it appears on the map."
          />
        </View>
        <Button title="Done" onPress={done} />
      </Screen>
    );

  return (
    <Screen>
      <BackButton />
      <Heading
        eyebrow="Safety"
        title="Report a hazard"
        subtitle="Tell other runners what to watch for. An admin reviews each report before it shows on the map."
      />
      {!ready ? null : !user ? (
        <Card>
          <Label>Sign in to report a hazard</Label>
          <Label secondary>Reports are tied to your account so admins can follow up.</Label>
          <Button title="Sign in" onPress={() => router.push("/welcome")} />
        </Card>
      ) : (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}>
            <Ionicons name="location-outline" size={15} color={c.muted} />
            <Text style={{ color: c.muted, fontSize: 13 }}>
              {routeId === null ? "Map location" : "On your route"} · {location.latitude.toFixed(4)}
              , {location.longitude.toFixed(4)}
            </Text>
          </View>
          <Text
            style={{
              color: c.muted,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            CATEGORY
          </Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Category"
            style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 }}
          >
            {HAZARD_CATEGORY_KEYS.map((key) => {
              const on = key === category;
              const color = on ? c.onPrimary : c.text;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="radio"
                  aria-checked={on}
                  onPress={() => setCategory(key)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 13,
                    paddingVertical: 9,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: on ? c.primary : c.border,
                    backgroundColor: on ? c.primary : c.panel,
                  }}
                >
                  <Ionicons name={HAZARD_CATEGORIES[key].icon} size={15} color={color} />
                  <Text style={{ color, fontSize: 13, fontWeight: "700" }}>
                    {HAZARD_CATEGORIES[key].label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Field
            label="Title"
            placeholder="Broken pavement near Irwin St"
            maxLength={255}
            value={title}
            onChangeText={setTitle}
          />
          <Field
            label="Details (optional)"
            placeholder="What should people look out for?"
            multiline
            numberOfLines={4}
            maxLength={1000}
            style={{ minHeight: 104, textAlignVertical: "top" }}
            value={description}
            onChangeText={setDescription}
          />
          {submit.status === "error" ? <Notice text={submit.message} error /> : null}
          <Button
            title="Submit report"
            loading={submit.status === "submitting"}
            disabled={!title.trim()}
            onPress={send}
          />
        </>
      )}
    </Screen>
  );
}
