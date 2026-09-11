import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import api from "@/api/axios";
import { connectSocket, disconnectSocket } from "@/socket/socket";

/**
 * Session state for the whole app.
 *
 * Route guards used to be a `localStorage` token-presence
 * checks, which meant typing one line in the browser console opened the app,
 * and an expired token rendered the whole UI before failing request by
 * request. The session is now confirmed with the server once on boot, and
 * every guard reads the result.
 *
 * The real protection is on the API, which is where it belongs. This exists so
 * the interface behaves correctly, not to keep anybody out.
 */

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True until the first /me call settles. Guards must wait for this. */
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (accessToken: string, user: AuthUser) => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const readStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem("admin.user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    // A corrupted value used to throw at the top of App and blank the page.
    localStorage.removeItem("admin.user");
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Seed from local storage so the first paint is not a flash of the signed-out
  // interface, then confirm with the server.
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem("admin.accessToken")) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/admin/auth/me");
      const fresh = res.data.data as AuthUser;
      setUser(fresh);
      localStorage.setItem("admin.user", JSON.stringify(fresh));
      connectSocket();
    } catch {
      // The axios interceptor already tried to refresh the token. Reaching
      // here means the session is genuinely over.
      localStorage.removeItem("admin.accessToken");
      localStorage.removeItem("admin.user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // A sign-out in one tab signs out the others.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "admin.accessToken" && !event.newValue) {
        setUser(null);
        disconnectSocket();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const signIn = useCallback((accessToken: string, nextUser: AuthUser) => {
    localStorage.setItem("admin.accessToken", accessToken);
    localStorage.setItem("admin.user", JSON.stringify(nextUser));
    setUser(nextUser);
    connectSocket(accessToken);
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Clears the refresh-token cookie and removes the token hash server-side,
      // so signing out actually ends the session rather than only hiding it.
      await api.post("/admin/auth/logout");
    } catch {
      // Signing out locally matters more than the server acknowledging it.
    } finally {
      localStorage.removeItem("admin.accessToken");
      localStorage.removeItem("admin.refreshToken");
      localStorage.removeItem("admin.user");
      setUser(null);
      disconnectSocket();
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, isAuthenticated: Boolean(user), signIn, signOut, refresh }),
    [user, loading, signIn, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
};

export default useAuth;
