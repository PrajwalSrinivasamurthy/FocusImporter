"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/focusimporter/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign in failed.");
        return;
      }
      router.replace("/focusimporter/");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 py-12 dark:bg-zinc-900">

      {/* Branding above card */}
      <div className="mb-7 flex flex-col items-center gap-3 text-center">
        <div className="grid h-12 w-12 select-none place-items-center rounded-xl bg-scarlet-600 font-display text-sm font-bold text-white">
          TTUO
        </div>
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-strong">
            Texas Tech K-12 Student Admissions Import
          </p>
          <p className="mt-0.5 text-sm text-muted">TTU Online</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-800/60">

        <div className="mb-6">
          <h1 className="font-display text-xl font-semibold tracking-tight text-strong">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-muted">
            Enter your credentials to access the portal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-strong">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@ttu.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-strong">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-strong"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="mt-1 w-full"
            loading={loading}
            disabled={!email || !password}
          >
            Sign in
          </Button>

        </form>
      </div>

      {/* Footer note */}
      <p className="mt-6 max-w-sm text-center text-[11px] text-muted">
        Access restricted to &apos;Texas Tech K-12 Student Admissions Import&apos; project members.
      </p>

    </div>
  );
}
