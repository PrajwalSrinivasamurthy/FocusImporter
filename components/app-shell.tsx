"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { BASE_PATH } from "@/lib/base-path";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname === "/login";

  // Client-side auth guard (localStorage).
  useEffect(() => {
    if (isAuth) return;
    const email = localStorage.getItem("fi_user");
    if (!email) {
      window.location.href = `${BASE_PATH}/login`;
    }
  }, [isAuth]);

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <>
      <AppSidebar />
      <main className="ml-60 min-h-screen">
        <div className="mx-auto max-w-4xl px-8 py-10">{children}</div>
      </main>
    </>
  );
}
