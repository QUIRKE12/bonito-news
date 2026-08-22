"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { apiUrl } from "@/lib/api";
import type { UserRole } from "@/lib/types";

export interface AppUserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  language: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthUserState {
  profile: AppUserProfile | null;
  isSignedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Convenience fetch wrapper that attaches the current access token and
   * transparently retries once via /api/auth/refresh on a 401. */
  authedFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

const AuthUserContext = createContext<AuthUserState | null>(null);

const REFRESH_TOKEN_STORAGE_KEY = "bonito_refresh_token";

/**
 * Single source of truth for "who's logged in and what can they do",
 * shared by the whole app via context.
 *
 * Replaces the old Firebase onAuthStateChanged-driven provider with a
 * custom JWT flow: the access token lives only in memory (this component's
 * state), the refresh token is persisted in localStorage so a page reload
 * doesn't force a re-login, and authedFetch handles refreshing an expired
 * access token transparently.
 */
export function AuthUserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Keep a ref in sync with accessToken so authedFetch (a stable useCallback)
  // always reads the latest token without needing to be recreated.
  const accessTokenRef = useRef<string | null>(null);
  accessTokenRef.current = accessToken;

  const applySession = useCallback((tokens: AuthTokens, user: AppUserProfile) => {
    setAccessToken(tokens.accessToken);
    accessTokenRef.current = tokens.accessToken;
    setProfile(user);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
    }
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    accessTokenRef.current = null;
    setProfile(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
  }, []);

  // Attempt a silent refresh using the stored refresh token. Returns the
  // new access token on success, or null if there's no valid session.
  const tryRefresh = useCallback(async (): Promise<string | null> => {
    const refreshToken =
      typeof window !== "undefined" ? window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) : null;
    if (!refreshToken) return null;

    try {
      const res = await fetch(apiUrl("/api/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        clearSession();
        return null;
      }
      const data = await res.json();
      applySession({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user);
      return data.accessToken as string;
    } catch {
      clearSession();
      return null;
    }
  }, [applySession, clearSession]);

  // On mount: try to silently restore a session from the stored refresh
  // token, so a page reload doesn't sign the user out.
  useEffect(() => {
    (async () => {
      await tryRefresh();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Sign in failed");
      }
      applySession({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user);
    },
    [applySession]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const res = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Account creation failed");
      }
      applySession({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user);
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await fetch(apiUrl("/api/auth/logout"), { method: "POST" });
    } catch {
      // Best-effort — nothing server-side to fail on since sessions are
      // stateless, but don't let a network error block clearing local state.
    }
    clearSession();
  }, [clearSession]);

  const authedFetch = useCallback(
    async (input: string, init: RequestInit = {}): Promise<Response> => {
      const buildHeaders = (token: string | null) => {
        const headers = new Headers(init.headers);
        if (token) headers.set("Authorization", `Bearer ${token}`);
        // Every call site in this app that sends a body passes a raw JSON
        // string without setting Content-Type — without it, the backend's
        // express.json() middleware won't parse the body at all.
        if (init.body && !headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }
        return headers;
      };

      let res = await fetch(apiUrl(input), { ...init, headers: buildHeaders(accessTokenRef.current) });

      // Access token likely expired — refresh once and retry.
      if (res.status === 401 && accessTokenRef.current) {
        const newToken = await tryRefresh();
        if (newToken) {
          res = await fetch(apiUrl(input), { ...init, headers: buildHeaders(newToken) });
        }
      }

      return res;
    },
    [tryRefresh]
  );

  return (
    <AuthUserContext.Provider
      value={{ profile, isSignedIn: !!profile, loading, login, register, logout, authedFetch }}
    >
      {children}
    </AuthUserContext.Provider>
  );
}

export function useAuthUser(): AuthUserState {
  const ctx = useContext(AuthUserContext);
  if (!ctx) {
    throw new Error("useAuthUser must be used within an AuthUserProvider");
  }
  return ctx;
}
