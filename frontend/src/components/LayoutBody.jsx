"use client";

import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation";

export default function LayoutBody({ children }) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Render sidebar only if we are not on the landing page */}
      {!isLandingPage && <Sidebar />}
      
      {/* Content pane with dynamic offset */}
      <main className={`${isLandingPage ? "w-full" : "pl-64"} w-full flex-1 transition-all duration-300`}>
        <div className={`${isLandingPage ? "max-w-4xl px-6 py-10 md:py-16" : "p-8 md:p-10 max-w-6xl"} mx-auto w-full transition-all duration-300`}>
          {children}
        </div>
      </main>
    </div>
  );
}
