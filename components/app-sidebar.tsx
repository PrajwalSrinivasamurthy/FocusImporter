"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { SESSION_KEY } from "@/lib/auth";
import {
  ArrowLeftRight,
  LogOut,
  ScrollText,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Conversion", icon: ArrowLeftRight },
  { href: "/history", label: "History", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const token = localStorage.getItem(SESSION_KEY);
    await fetch("/focusimporter/api/auth/logout", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    localStorage.removeItem(SESSION_KEY);
    router.replace("/login");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-paper-line bg-paper-raised/70 backdrop-blur dark:border-night-line dark:bg-night-raised/70">
      <div className="flex items-center gap-3 px-5 pb-6 pt-6">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-scarlet-600 font-display text-sm font-bold text-white">
          TTUO
        </div>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold tracking-tight text-strong">
            Texas Tech K-12 Student Admissions Import
          </p>
          <p className="text-[11px] text-muted">TTU Online</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Main">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-scarlet-600/10 text-scarlet-700 dark:text-scarlet-400"
                  : "text-muted hover:bg-black/5 hover:text-strong dark:hover:bg-white/5"
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-scarlet-600"
                />
              )}
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-paper-line px-3 py-3 dark:border-night-line">
        <div className="flex items-center gap-1">
          <button
            onClick={handleLogout}
            className="flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-black/5 hover:text-strong dark:hover:bg-white/5"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            <span>Sign out</span>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
