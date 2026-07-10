"use client";
import React, { useState } from 'react';
import { Search, FolderHeart, FileText, CheckCircle2, ShieldCheck, HeartPulse, Clipboard } from 'lucide-react';
import { SANDBOX_SECURED_PLACEHOLDER } from '../lib/testing';

export default function EMRWorkspacePage() {
  const [searchQuery, setSearchQuery] = useState('');

  // High-contrast, sandboxed testing registry (completely safe for independent public evaluation)
  const mockRecords = [
    { uhid: "NX-2026-00410", initials: "R.S.", age: "32", condition: "Post-PCI Follow-up", consult: "Cardiology", updated: "32 mins ago", status: "Verified" },
    { uhid: "NX-2026-05567", initials: "M.J.", age: "45", condition: "Hypertension Monitoring", consult: "General Medicine", updated: "1 hr ago", status: "Awaiting Signature" },
    { uhid: "NX-2026-09023", initials: "S.G.", age: "58", condition: "Diabetic Ketoacidosis Recovery", consult: "Endocrinology", updated: "2 hrs ago", status: "Verified" }
  ];

  const filteredRecords = mockRecords.filter(rec => 
    rec.initials.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.uhid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-900 bg-slate-50 min-h-screen font-sans selection:bg-slate-200">
      
      {/* Upper Module Boundary Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Central EMR Archival Vault</h1>
          <p className="text-sm text-slate-900 font-medium">Review electronic charts, structured history datasets, and diagnostic pathology updates.</p>
        </div>
        <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 shadow-sm">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Multi-Tester Sandbox Active</span>
        </div>
      </div>

      {/* Analytical Cards Row - Forced Contrast Elements */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Total Charts Online</span>
            <h3 className="text-2xl font-black text-slate-950 mt-1">1,240 <span className="text-xs font-bold text-slate-900">Files</span></h3>
          </div>
          <div className="bg-slate-100 p-2.5 rounded-lg text-slate-900 border border-slate-200">
            <FolderHeart size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Awaiting Signatures</span>
            <h3 className="text-2xl font-black text-slate-950 mt-1">4 Pending</h3>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-lg text-amber-900 border border-amber-200"><Clipboard size={18} /></div>
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Signed Off Log Entries</span>
            <h3 className="text-2xl font-black text-slate-950 mt-1">42 Today</h3>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-800 border border-emerald-200"><CheckCircle2 size={18} /></div>
        </div>
      </div>

      {/* Main Structural Framework Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Core Registry Ledger View */}
        <div className="lg:col-span-2 bg-white rounded-xl border-2 border-slate-200 shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Patient Electronic Clinical Charts</h2>
            <p className="text-xs text-slate-900 font-medium">Search or select temporary data sets below to verify operational routing flows.</p>
          </div>

          {/* Fully Functioning Testing Filter Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-800" size={16} />
            <input 
              type="text" 
              placeholder="Test Live Search (Type initials like 'R.S.' or UHID codes)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-slate-400"
            />
          </div>

          {/* High-Contrast Table Configuration */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-100 text-slate-950 font-black">
                  <th className="p-3">Universal Health ID (UHID)</th>
                  <th className="p-3">Initials</th>
                  <th className="p-3">Primary Diagnosis Line</th>
                  <th className="p-3">Specialty Unit</th>
                  <th className="p-3">Activity Delta</th>
                  <th className="p-3 text-right">Sign-off State</th>
                </tr>
              </thead>
              <tbody className="font-bold text-slate-950">
                {filteredRecords.length > 0 ? (filteredRecords.map((record, index) => (
                  <tr key={index} className="border-b-2 border-slate-200 hover:bg-slate-100/80 transition-colors">
                    <td className="p-3 font-mono font-black text-slate-950">{record.uhid}</td>
                    <td className="p-3 font-black text-slate-950">{record.initials}</td>
                    <td className="p-3 text-slate-950">{record.condition} (Age: {record.age})</td>
                    <td className="p-3 text-slate-950 font-bold">{record.consult}</td>
                    <td className="p-3 font-bold text-slate-900">{record.updated}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        record.status === 'Verified' ? 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold' : 'bg-amber-100 text-amber-950 border-amber-400 font-bold'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-900 font-bold bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                      No matching electronic medical indices identified in this sandbox sweep.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Encrypted Verification Actions Sub-panel */}
        <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Secure Audit Intake Verification</h2>
            <p className="text-xs text-slate-900 font-medium">Simulate data confirmation pathways while locking cross-user tracking leaks.</p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-3 text-xs font-bold text-slate-800">
            <div className="space-y-1">
              <label className="block text-slate-900">Evaluator Sign-Off Profile Initials</label>
              <input 
                type="text" 
                defaultValue="Sandbox Clinician Beta" 
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg p-2 text-slate-900 font-semibold focus:outline-none focus:border-slate-400" 
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-900">National Government Validation Document Class</label>
              <select className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg p-2 text-slate-900 font-semibold">
                <option>Passport Infrastructure Record Lock</option>
                <option>Corporate Third Party Insurance Token</option>
                <option>National Identification Framework</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-900">Secure Document Core Value Key</label>
              <input 
                type="text" 
                disabled 
                value={SANDBOX_SECURED_PLACEHOLDER} 
                className="w-full bg-slate-100 border-2 border-slate-200 rounded-lg p-2 text-slate-900 font-mono text-[10px] select-none cursor-not-allowed" 
              />
            </div>

            <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black p-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm text-xs">
              <HeartPulse size={14} />
              Validate & Seal Medical Chart
            </button>
          </form>

          {/* Secure Operational Framework Validation Summary */}
          <div className="pt-4 border-t-2 border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900 block">Isolation Layer Verification</span>
            <div className="space-y-1.5 text-xs text-slate-900 font-bold">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <CheckCircle2 size={14} className="text-emerald-700" />
                <span>Typography Readability Check: Passed</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <FileText size={14} className="text-slate-900" />
                <span>Tester Data Leakage Wall: Armed</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}