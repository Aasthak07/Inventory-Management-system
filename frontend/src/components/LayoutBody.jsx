"use client";

import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function LayoutBody({ children }) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on path changes (highly responsive on mobile click actions)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile Top Header */}
      {!isLandingPage && (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-5 z-40 md:hidden shadow-xs">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-950 hover:bg-slate-50 rounded-xl transition cursor-pointer flex items-center justify-center w-10 h-10"
            aria-label="Open Sidebar"
          >
            <span className="text-xl select-none leading-none">☰</span>
          </button>
          <span className="font-extrabold text-slate-900 tracking-tight text-sm select-none">
            Inventory Console
          </span>
          <div className="w-10"></div> {/* Balance spacer */}
        </header>
      )}

      {/* Render sidebar & overlay only if we are not on the landing page */}
      {!isLandingPage && (
        <>
          {/* Backdrop Blur Overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </>
      )}
      
      {/* Content pane with dynamic offset */}
      <main className={`${isLandingPage ? "w-full" : "pl-0 md:pl-64 pt-16 md:pt-0"} w-full flex-1 transition-all duration-300`}>
        <div className={`${isLandingPage ? "max-w-4xl px-6 py-10 md:py-16" : "p-6 md:p-10 max-w-6xl"} mx-auto w-full transition-all duration-300`}>
          {children}
        </div>
      </main>
    </div>
  );
}
