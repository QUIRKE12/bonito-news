"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";
import { apiUrl } from "@/lib/api";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void; // parent refetches session / user profile
}

async function syncUserToBackend(name?: string) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("No ID token available after sign-in");

  const res = await fetch(apiUrl("/api/auth/sync"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, name }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to sync user profile");
  }

  return res.json();
}

export default function AuthModal({ open, onClose, onAuthenticated }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(cred.user, { displayName: name });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      await syncUserToBackend(name || undefined);
      onAuthenticated();
      onClose();
    } catch (err: any) {
      setError(mapFirebaseError(err?.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await syncUserToBackend(cred.user.displayName || undefined);
      onAuthenticated();
      onClose();
    } catch (err: any) {
      setError(mapFirebaseError(err?.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/55 p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[380px] rounded-md bg-white p-8">
        <button
          className="absolute right-4 top-3.5 text-lg text-muted"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="font-display text-[22px] font-semibold text-ink">
          {isSignUp ? "Create your account" : "Sign in"}
        </h2>
        <p className="mb-5 mt-1.5 text-[13px] text-muted">
          {isSignUp
            ? "Join Amakuru to comment, bookmark stories, and get notifications in your language."
            : "Sign in to comment, bookmark, and get notifications in your language."}
        </p>

        {error && (
          <div className="mb-3 rounded bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="mb-3.5">
              <label className="mb-1.5 block text-xs font-semibold text-ink">Name</label>
              <input
                className="w-full rounded border border-line px-3 py-2.5 text-sm focus:border-teal focus:outline-none"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
          )}
          <div className="mb-3.5">
            <label className="mb-1.5 block text-xs font-semibold text-ink">Email</label>
            <input
              className="w-full rounded border border-line px-3 py-2.5 text-sm focus:border-teal focus:outline-none"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="mb-3.5">
            <label className="mb-1.5 block text-xs font-semibold text-ink">Password</label>
            <input
              className="w-full rounded border border-line px-3 py-2.5 text-sm focus:border-teal focus:outline-none"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-1.5 w-full rounded bg-teal py-3 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded border border-line py-2.5 text-[13.5px] font-semibold hover:border-ink disabled:opacity-60"
        >
          🔵 Continue with Google
        </button>

        <div className="mt-4 text-center text-xs text-muted">
          <span>{isSignUp ? "Already have an account?" : "Don't have an account?"}</span>{" "}
          <button
            className="font-semibold text-teal"
            onClick={() => setIsSignUp((v) => !v)}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}

function mapFirebaseError(code?: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already registered — try signing in instead.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled.";
    default:
      return "Something went wrong. Please try again.";
  }
}
