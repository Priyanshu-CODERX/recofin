"use client";

import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="ml-60 flex min-h-screen flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-6 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}