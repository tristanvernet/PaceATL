import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { apiRequest, ApiError } from "../../api/client";
import { restoreSessionToken, saveSessionToken } from "./session-storage";

export type User = { id: number; name: string; email: string };
export type SignInResult = { user: User; token: string };
const Context = createContext<{
  user: User | null; ready: boolean; error: string;
  signIn: (result: SignInResult) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
} | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  async function refresh() {
    setError("");
    try {
      if (await restoreSessionToken()) setUser(await apiRequest<User>("/api/auth/me"));
      else setUser(null);
    } catch (e) {
      setUser(null);
      if (e instanceof ApiError && e.status === 401) {
        await saveSessionToken(null);
      } else setError(e instanceof Error ? e.message : "Could not restore your session.");
    } finally { setReady(true); }
  }
  useEffect(() => { void refresh(); }, []);
  async function signIn(result: SignInResult) {
    await saveSessionToken(result.token);
    setUser(result.user); setError("");
  }
  async function signOut() {
    // Keep the session available for retry if server-side revocation fails.
    try { await apiRequest("/api/auth/logout", { method: "POST" }); }
    catch (e) { if (!(e instanceof ApiError && e.status === 401)) throw e; }
    await saveSessionToken(null); setUser(null); setError("");
  }
  return <Context.Provider value={{ user, ready, error, signIn, signOut, refresh }}>{children}</Context.Provider>;
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error("SessionProvider is required.");
  return value;
}
