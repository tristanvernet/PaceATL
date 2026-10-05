import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Head from "expo-router/head";
import { useTheme } from "../theme";
import { SessionProvider } from "../features/auth/SessionProvider";

export default function RootLayout() {
  const c = useTheme();
  return (
    <SessionProvider>
      <Head>
        <title>PaceATL</title>
      </Head>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.background },
        }}
      />
    </SessionProvider>
  );
}
