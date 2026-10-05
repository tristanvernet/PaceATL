import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const key = "paceatl-session";
let token: string | null = null;
export const getSessionToken = () => token;
export async function restoreSessionToken() {
  token = Platform.OS === "web"
    ? window.sessionStorage.getItem(key)
    : await SecureStore.getItemAsync(key);
  return token;
}
export async function saveSessionToken(value: string | null) {
  if (Platform.OS === "web") {
    if (value) window.sessionStorage.setItem(key, value);
    else window.sessionStorage.removeItem(key);
  } else if (value) await SecureStore.setItemAsync(key, value);
  else await SecureStore.deleteItemAsync(key);
  token = value;
}
