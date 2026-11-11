import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Head from "expo-router/head";
import { useFonts } from "expo-font";
import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces/600SemiBold";
import { AppearanceProvider, useAppearance } from "../theme";
import { SessionProvider } from "../features/auth/SessionProvider";

function RootStack() {
  const { palette, dark } = useAppearance();
  return (
    <>
      <StatusBar style={dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
        }}
      >
        <Stack.Screen name="log" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Fraunces_600SemiBold });
  // A font failure falls back to the system font rather than blocking the app.
  if (!fontsLoaded && !fontError) return null;
  return (
    <AppearanceProvider>
      <SessionProvider>
        <Head>
          <title>PaceATL</title>
        </Head>
        <RootStack />
      </SessionProvider>
    </AppearanceProvider>
  );
}
