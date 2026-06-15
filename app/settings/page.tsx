"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, KeyRound, Palette } from "lucide-react";
import { toast } from "sonner";
import { useAccentStore, ACCENT_OPTIONS, type AccentColor } from "@/lib/accent-store";
import { AuthGuard } from "@/components/auth-guard";
import { SESSION_KEY } from "@/lib/auth";

export default function SettingsPage() {
  const router = useRouter();
  const accent = useAccentStore((s) => s.accent);
  const setAccent = useAccentStore((s) => s.setAccent);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next.length < 5) {
      toast.error("New password must be at least 5 characters.");
      return;
    }
    if (next !== confirm) {
      toast.error("New passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/focusimporter/api/settings/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(SESSION_KEY)}`,
        },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Password update failed.");
        return;
      }
      toast.success("Password updated — please sign in again.");
      localStorage.removeItem(SESSION_KEY);
      router.replace("/login");
    } catch {
      toast.error("Unable to reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
    <div className="space-y-12">

      {/* ── Theme colours ── */}
      <section className="space-y-4">
        <header>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-scarlet-600 dark:text-scarlet-400">
            Settings
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-strong">
            Theme colours.
          </h1>
        </header>

        <Card className="max-w-md p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-scarlet-600/10 text-scarlet-700 dark:text-scarlet-400">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-strong">
                Accent colour
              </p>
              <p className="text-xs text-muted">
                Changes the highlight colour used across the app.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {ACCENT_OPTIONS.map(({ id, label, hex }) => {
              const selected = accent === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAccent(id as AccentColor)}
                  className="flex flex-col items-center gap-1.5 outline-none"
                  aria-label={`${label} accent`}
                  aria-pressed={selected}
                >
                  <div
                    className="relative grid h-9 w-9 place-items-center rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: hex,
                      boxShadow: selected
                        ? `0 0 0 2px white, 0 0 0 4px ${hex}`
                        : undefined,
                    }}
                  >
                    {selected && (
                      <Check className="h-4 w-4 text-white" strokeWidth={3} />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-muted">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      </section>

      {/* ── Account security ── */}
      <section className="space-y-4">
        <header>
          <h2 className="font-display text-3xl font-bold tracking-tight text-strong">
            Account security.
          </h2>
        </header>

        <Card className="max-w-md p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-scarlet-600/10 text-scarlet-700 dark:text-scarlet-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-strong">
                Update password
              </p>
              <p className="text-xs text-muted">
                Minimum 5 characters. Requires re-login.
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="current" className="text-xs font-medium text-strong">
                Current password
              </label>
              <Input
                id="current"
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="next" className="text-xs font-medium text-strong">
                New password
              </label>
              <Input
                id="next"
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirm" className="text-xs font-medium text-strong">
                Confirm new password
              </label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" loading={saving} className="w-full">
              Save new password
            </Button>
          </form>
        </Card>
      </section>

    </div>
    </AuthGuard>
  );
}
