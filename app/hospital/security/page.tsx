"use client";

import React, { useState } from 'react';
import { 
  Shield, Key, Users, History, Laptop, AlertOctagon, CheckCircle, XCircle 
} from 'lucide-react';

export default function SecurityAuthenticationWorkspace() {
  const [activeSubTab, setActiveSubTab] = useState<'sessions' | 'matrix' | 'logs'>('sessions');

  const functionalModules = [
    { name: 'Core Infrastructure Setup', admin: true, doc: false, nurse: false, recep: false },
    { name: 'Clinical Charting / Records', admin: true, doc: true, nurse: true, recep: false },
    { name: 'Laboratory Logs', admin: true, doc: true, nurse: false, recep: false },
    { name: 'Radiology Imaging Logs', admin: true, doc: true, nurse: false, recep: false },
    { name: 'Pharmacy Dispensing Logs', admin: true, doc: false, nurse: false, recep: false },
    { name: 'Financial Billing / Invoices', admin: true, doc: false, nurse: false, recep: true }
  ];

  const mockDevices = [
    { id: 1, type: "Desktop workstation", os: "Windows 11", browser: "Chrome 124", ip: "192.168.1.42", active: "Current Session", trusted: true },
    { id: 2, type: "Mobile Clinician Tablet", os: "iPadOS 17", browser: "Safari Mobile", ip: "10.0.4.110", active: "4 mins ago", trusted: true },
    { id: 3, type: "External Connection Attempt", os: "Linux x86_64", browser: "Unknown Browser", ip: "185.220.101.5", active: "Yesterday", trusted: false }
  ];

  const mockSecurityLogs = [
    { time: "12:45 PM", event: "MFA Token Verification Succeeded", user: "Dr. A. Sharma", severity: "INFO" },
    { time: "11:02 AM", event: "Password Reset Link Triggered", user: "P. Patel (Billing)", severity: "WARN" },
    { time: "09:14 AM", event: "Brute Force Warning: Suspicious Login Intercepted", user: "Unknown", severity: "CRITICAL" }
  ];

  return (
    <div className="space-y-8">
      {/* Module Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">Authentication & Security Command</h1>
          <p className="text-sm font-medium text-slate-500">Enforce enterprise password policies, monitor devices, and map role access control permissions matrix layout.</p>
        </div>
      </div>

      {/* Primary Sub Tabs Filter Operations */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        <button onClick={() => setActiveSubTab('sessions')} className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all -mb-px ${activeSubTab === 'sessions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
          <span className="flex items-center gap-1.5"><Laptop className="h-3.5 w-3.5" /> Device & Session Controls</span>
        </button>
        <button onClick={() => setActiveSubTab('matrix')} className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all -mb-px ${activeSubTab === 'matrix' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Role-Based Access Matrix</span>
        </button>
        <button onClick={() => setActiveSubTab('logs')} className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all -mb-px ${activeSubTab === 'logs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
          <span className="flex items-center gap-1.5"><History className="h-3.5 w-3.5" /> Security Audit Logs</span>
        </button>
      </div>

      {/* Split Workspace Dynamic Section Displays */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Side: Layout Data Panels */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* TAB 1: DEVICE MANAGEMENT VIEW */}
          {activeSubTab === 'sessions' && (
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Monitored Device Fingerprints</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {mockDevices.map(dev => (
                  <div key={dev.id} className="p-4 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2 rounded-lg ${dev.trusted ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-600'}`}>
                        <Laptop className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          {dev.type} ({dev.os})
                          {!dev.trusted && <span className="text-[9px] font-black tracking-wider uppercase bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">Untrusted Device</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">IP Address: {dev.ip} | Client: {dev.browser}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 mr-2">{dev.active}</span>
                      <button className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-slate-200 rounded-md hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition">Revoke</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PRIVILEGE PERMISSION MATRIX VIEW */}
          {activeSubTab === 'matrix' && (
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Functional Resource RBAC Matrix</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/30 border-b border-slate-200/60 text-[9px] font-black uppercase tracking-wider text-slate-400">
                      <th className="p-3 pl-4">Protected Module Resource</th>
                      <th className="p-3 text-center">Hosp Admin</th>
                      <th className="p-3 text-center">Doctor</th>
                      <th className="p-3 text-center">Nurse</th>
                      <th className="p-3 text-center">Receptionist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                    {functionalModules.map((mod, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-3 pl-4 font-semibold text-slate-800">{mod.name}</td>
                        <td className="p-3 text-center text-emerald-600">{mod.admin ? <CheckCircle className="h-4 w-4 mx-auto" /> : <XCircle className="h-4 w-4 mx-auto text-slate-300" />}</td>
                        <td className="p-3 text-center text-emerald-600">{mod.doc ? <CheckCircle className="h-4 w-4 mx-auto" /> : <XCircle className="h-4 w-4 mx-auto text-slate-300" />}</td>
                        <td className="p-3 text-center text-emerald-600">{mod.nurse ? <CheckCircle className="h-4 w-4 mx-auto" /> : <XCircle className="h-4 w-4 mx-auto text-slate-300" />}</td>
                        <td className="p-3 text-center text-emerald-600">{mod.recep ? <CheckCircle className="h-4 w-4 mx-auto" /> : <XCircle className="h-4 w-4 mx-auto text-slate-300" />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT HISTORY RECORDS LOGS */}
          {activeSubTab === 'logs' && (
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Real-Time Security Event Streaming</h2>
              </div>
              <div className="p-4 space-y-3">
                {mockSecurityLogs.map((log, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border text-xs font-semibold flex items-start gap-3 ${
                    log.severity === 'CRITICAL' ? 'bg-rose-50/40 border-rose-100 text-rose-900' :
                    log.severity === 'WARN' ? 'bg-amber-50/40 border-amber-100 text-amber-900' : 'bg-slate-50/50 border-slate-200/60 text-slate-700'
                  }`}>
                    <AlertOctagon className={`h-4 w-4 shrink-0 mt-0.5 ${log.severity === 'CRITICAL' ? 'text-rose-500' : log.severity === 'WARN' ? 'text-amber-500' : 'text-slate-400'}`} />
                    <div className="w-full flex justify-between gap-4">
                      <div>
                        <p className="font-bold text-slate-800">{log.event}</p>
                        <span className="text-[10px] text-slate-400 font-medium">Operator Context: {log.user}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold shrink-0">{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Global Enforced Policies */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Key className="h-4 w-4 text-indigo-500" /> Active System Password Policies
            </h3>
            <div className="space-y-3.5 text-xs font-semibold text-slate-600">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span>Minimum Character Length</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-800">12 Characters</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span>MFA Enforcement Mode</span>
                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-extrabold uppercase text-[10px] tracking-wide">Strict TOTP Needed</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span>Session Expiry Lifecycle</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-800">8 Hours Rolling</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Maximum Login Tries Allowed</span>
                <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold">5 Attempts Lockout</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}