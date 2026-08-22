"use client";

import { useState } from "react";
import { useAuthUser } from "@/lib/hooks/useAuthUser";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void; // parent refetches session / user profile
}

export default function AuthModal({ open, onClose, onAuthenticated }: AuthModalProps) {
  const { login, register } = useAuthUser();
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
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      onAuthenticated();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
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
                required
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
            {!isSignUp && (
              <p className="mt-1.5 text-xs text-muted">
                Forgot your password? Contact an admin to have it reset.
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-1.5 w-full rounded bg-teal py-3 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

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
