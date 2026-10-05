import { Platform } from "react-native";
import { getSessionToken } from "../features/auth/session-storage";

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!path.startsWith("/api/"))
    throw new ApiError("Use a path beginning with /api/.", "INVALID_PATH");
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  const base =
    configured || (Platform.OS === "web" ? "http://localhost:3001" : "");
  if (!base)
    throw new ApiError(
      "Set EXPO_PUBLIC_API_URL to your computer’s LAN address before checking the backend on a phone.",
      "NOT_CONFIGURED",
    );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const external = options.signal;
  const abort = () => controller.abort();
  if (external?.aborted) controller.abort();
  external?.addEventListener("abort", abort, { once: true });
  try {
    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");
    const token = getSessionToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (
      options.body &&
      !headers.has("Content-Type") &&
      typeof options.body === "string"
    )
      headers.set("Content-Type", "application/json");
    const response = await fetch(`${base.replace(/\/$/, "")}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    let result: { data?: T; error?: { code?: string; message?: string } };
    try {
      result = await response.json();
    } catch {
      throw new ApiError(
        "The server returned an unreadable response.",
        "INVALID_RESPONSE",
        response.status,
      );
    }
    if (!response.ok)
      throw new ApiError(
        result.error?.message || "The request failed.",
        result.error?.code || "REQUEST_FAILED",
        response.status,
      );
    if (!Object.prototype.hasOwnProperty.call(result, "data"))
      throw new ApiError(
        "The server response is missing data.",
        "INVALID_RESPONSE",
        response.status,
      );
    return result.data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      controller.signal.aborted
        ? "The request was cancelled or timed out. Try again."
        : "Cannot reach the backend. Check the server address and network connection.",
      controller.signal.aborted ? "CANCELLED" : "NETWORK_ERROR",
    );
  } finally {
    clearTimeout(timeout);
    external?.removeEventListener("abort", abort);
  }
}
