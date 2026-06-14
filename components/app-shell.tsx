"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname === "/login";

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
