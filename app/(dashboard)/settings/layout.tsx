"use client";
import React from 'react';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-slate-50">
      {/* Dynamic Sub-Navigation Header Wrapper for Settings Slice */}
      <div className="bg-white border-b-2 border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6 text-xs font-bold text-slate-900">
            <span className="border-b-2 border-slate-900 pb-3 pt-1 cursor-pointer">Global Setup</span>
            <span className="text-slate-500 hover:text-slate-900 pb-3 pt-1 cursor-pointer transition-colors">Security Gates</span>
            <span className="text-slate-500 hover:text-slate-900 pb-3 pt-1 cursor-pointer transition-colors">Backup Protocols</span>
          </div>
          <div className="text-[11px] font-mono bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 text-slate-800 font-bold">
            Config Panel v1.0
          </div>
        </div>
      </div>

      {/* Main Panel Output */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}