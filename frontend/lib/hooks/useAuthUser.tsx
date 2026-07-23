"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
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

interface AuthUserState {
  firebaseUser: FirebaseUser | null;
  profile: AppUserProfile | null;
  loading: boolean;
  /** Convenience fetch wrapper that attaches the current Firebase ID token. */
  authedFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

const AuthUserContext = createContext<AuthUserState | null>(null);

/**
 * Single source of truth for "who's logged in and what can they do",
 * shared by the whole app via context.
 *
 * Previously every component called a standalone useAuthUser() hook that
 * ran its OWN Firebase onAuthStateChanged listener and its OWN
 * POST /api/auth/sync call. Firebase can fire that listener once with a
 * null user before it resolves the real signed-in session on page load —
 * harmless for a component that mounted early enough to already have the
 * resolved profile, but any component that mounted its own separate
 * listener later (e.g. a RequireRole check nested a level deeper than the
 * sidebar) could catch that transient null, set loading=false with
 * profile=null, and never re-check — showing "Not authorized" for an
 * Admin who very much is authorized. Making this a single provider
 * mounted once at the root fixes that: there's exactly one listener and
 * one profile, so every consumer sees the same state at the same time.
 */
export function AuthUserProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        const idToken = await fbUser.getIdToken();
        const res = await fetch(apiUrl("/api/auth/sync"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            name: fbUser.displayName || undefined,
            avatarUrl: fbUser.photoURL || undefined,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const authedFetch = useCallback(async (input: string, init: RequestInit = {}) => {
    const idToken = await auth.currentUser?.getIdToken();
    const headers = new Headers(init.headers);
    if (idToken) headers.set("Authorization", `Bearer ${idToken}`);
    // Every call site in this app that sends a body passes a raw JSON
    // string without setting Content-Type — without it, the backend's
    // express.json() middleware won't parse the body at all, so PATCH/POST
    // requests would silently arrive as an empty req.body. Default it here
    // once instead of patching every call site.
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(apiUrl(input), { ...init, headers });
  }, []);

  return (
    <AuthUserContext.Provider value={{ firebaseUser, profile, loading, authedFetch }}>
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
