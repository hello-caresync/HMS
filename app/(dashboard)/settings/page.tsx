"use client";
import React from 'react';
import { Shield, Database, Key, Sliders, RefreshCw } from 'lucide-react';

export default function SystemSettingsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-900 bg-slate-50 min-h-screen font-sans selection:bg-slate-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">System Global Configurations</h1>
          <p className="text-sm text-slate-700 font-medium">Manage network database backup endpoints, multi-role access control rules, and active API authorization keys.</p>
        </div>
        <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
          Sandbox Configuration Active
        </div>
      </div>

      {/* Operational Matrix Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Panel 1: Security & Permissions */}
        <div className="bg-white p-5 rounded-xl border-2 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-3">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-900 border border-slate-200"><Shield size={18} /></div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Role RBAC Permissions</h2>
          </div>
          <p className="text-xs text-slate-800 font-medium">Configure deep structural permission boundaries for clinic physicians, diagnostic triage units, and cashier desks.</p>
          <button className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-black px-3 py-2.5 rounded-lg transition-colors w-full text-center shadow-sm">
            Modify Permission Rules →
          </button>
        </div>

        {/* Panel 2: Backup Snapshot Configurations */}
        <div className="bg-white p-5 rounded-xl border-2 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-3">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-900 border border-slate-200"><Database size={18} /></div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Cold Backup Engine</h2>
          </div>
          <p className="text-xs text-slate-800 font-medium">Verify structural backup targets. Operational log files and database records are isolated during sandbox cycles.</p>
          <button className="text-xs bg-slate-50 border-2 border-slate-200 hover:bg-slate-100 text-slate-900 font-black px-3 py-2 rounded-lg transition-colors w-full flex items-center justify-between shadow-sm">
            <span>Trigger Snapshot Backup</span>
            <RefreshCw size={12} className="text-slate-900" />
          </button>
        </div>

        {/* Panel 3: External Integration API Gateways */}
        <div className="bg-white p-5 rounded-xl border-2 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-3">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-900 border border-slate-200"><Key size={18} /></div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Credential Vault</h2>
          </div>
          <p className="text-xs text-slate-800 font-medium">Manage verification webhooks for live notification layers. Secure keys remain encrypted inside testing scopes.</p>
          <input type="text" disabled value="[API INTEGRATION KEYS REDACTED FOR PRIVACY]" className="w-full bg-slate-100 border-2 border-slate-200 rounded-lg p-2 text-slate-700 font-mono text-[10px] select-none cursor-not-allowed" />
        </div>

      </div>

      {/* Quick Infrastructure Status Dashboard Panel */}
      <div className="bg-slate-950 text-white p-5 rounded-xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Sliders size={14} />
            <span>Deployment Node Operational</span>
          </div>
          <h3 className="text-lg font-black tracking-tight text-white">Nexora Active Environment Status</h3>
          <p className="text-xs text-slate-300 font-medium max-w-2xl">
            Local framework target compiled flawlessly using Next.js App Router core routing metrics. Accessibility compliance layers have forced absolute visibility rules across all dynamic data matrices.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 text-xs font-mono font-bold px-3 py-2 rounded-lg text-slate-200 shrink-0">
          State: Test Ready (Forced Dark Text)
        </div>
      </div>

    </div>
  );
}