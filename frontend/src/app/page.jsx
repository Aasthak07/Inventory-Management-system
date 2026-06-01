"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-[75vh] flex flex-col justify-center items-center py-8 animate-fade-in text-slate-800">
      <div className="max-w-2xl mx-auto w-full text-center space-y-8">
        
        {/* Centered Title */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Inventory Management System
          </h1>
          <p className="text-base font-medium text-slate-500 leading-relaxed max-w-xl mx-auto">
            An administrative console designed to track product stock levels, manage customer records, and process order transactions securely in real-time.
          </p>
        </div>

        {/* Dynamic Launch Button */}
        <div className="pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-base font-black shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer select-none"
          >
            <span>Go to Dashboard</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
