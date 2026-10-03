import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Head from "expo-router/head";
import { useTheme } from "../theme";

export default function RootLayout() {
  const c = useTheme();
  return (
    <>
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
    </>
  );
}
