"use client";

import React, { useState, useTransition } from 'react';
import { 
  Shield, Key, Users, History, Laptop, AlertOctagon, CheckCircle, XCircle, Loader2
} from 'lucide-react';

import { HospitalToastBanner, useHospitalToast } from '../_components/HospitalFeedback';

type DeviceRow = {
  id: number;
  type: string;
  os: string;
  browser: string;
  ip: string;
  active: string;
  trusted: boolean;
};

type MatrixRow = {
  name: string;
  admin: boolean;
  doc: boolean;
  nurse: boolean;
  recep: boolean;
};

const INITIAL_DEVICES: DeviceRow[] = [
  { id: 1, type: "Desktop workstation", os: "Windows 11", browser: "Chrome 124", ip: "192.168.1.42", active: "Current Session", trusted: true },
  { id: 2, type: "Mobile Clinician Tablet", os: "iPadOS 17", browser: "Safari Mobile", ip: "10.0.4.110", active: "4 mins ago", trusted: true },
  { id: 3, type: "External Connection Attempt", os: "Linux x86_64", browser: "Unknown Browser", ip: "185.220.101.5", active: "Yesterday", trusted: false }
];

export default function SecurityAuthenticationWorkspace() {
  const { toast, showSuccess } = useHospitalToast();
  const [isPending, startTransition] = useTransition();
  const [activeSubTab, setActiveSubTab] = useState<'sessions' | 'matrix' | 'logs'>('sessions');
  const [devices, setDevices] = useState<DeviceRow[]>(INITIAL_DEVICES);
  const [functionalModules, setFunctionalModules] = useState<MatrixRow[]>([
    { name: 'Core Infrastructure Setup', admin: true, doc: false, nurse: false, recep: false },
    { name: 'Clinical Charting / Records', admin: true, doc: true, nurse: true, recep: false },
    { name: 'Laboratory Logs', admin: true, doc: true, nurse: false, recep: false },
    { name: 'Radiology Imaging Logs', admin: true, doc: true, nurse: false, recep: false },
    { name: 'Pharmacy Dispensing Logs', admin: true, doc: false, nurse: false, recep: false },
    { name: 'Financial Billing / Invoices', admin: true, doc: false, nurse: false, recep: true }
  ]);

  const mockSecurityLogs = [
    { time: "12:45 PM", event: "MFA Token Verification Succeeded", user: "Dr. A. Sharma", severity: "INFO" },
    { time: "11:02 AM", event: "Password Reset Link Triggered", user: "P. Patel (Billing)", severity: "WARN" },
    { time: "09:14 AM", event: "Brute Force Warning: Suspicious Login Intercepted", user: "Unknown", severity: "CRITICAL" }
  ];

  const revokeDevice = (id: number) => {
    startTransition(() => {
      setDevices((prev) => prev.filter((d) => d.id !== id));
      showSuccess('Device session revoked.');
    });
  };

  const toggleMatrix = (rowIndex: number, role: keyof Omit<MatrixRow, 'name'>) => {
    setFunctionalModules((prev) =>
      prev.map((row, i) => (i === rowIndex ? { ...row, [role]: !row[role] } : row)),
    );
    showSuccess('RBAC matrix updated (local draft).');
  };

  return (
    <div className="space-y-8">
      <HospitalToastBanner toast={toast} />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Authentication & Security Command</h1>
          <p className="text-sm font-medium text-slate-500">Enforce enterprise password policies, monitor devices, and map role access control permissions matrix layout.</p>
        </div>
        {isPending ? (
          <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Applying…
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        <button onClick={() => setActiveSubTab('sessions')} className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider border-b-2 transition-all -mb-px ${activeSubTab === 'sessions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
          <span className="flex items-center gap-1.5"><Laptop className="h-3.5 w-3.5" /> Device & Session Controls</span>
        </button>
        <button onClick={() => setActiveSubTab('matrix')} className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider border-b-2 transition-all -mb-px ${activeSubTab === 'matrix' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Role-Based Access Matrix</span>
        </button>
        <button onClick={() => setActiveSubTab('logs')} className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider border-b-2 transition-all -mb-px ${activeSubTab === 'logs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
          <span className="flex items-center gap-1.5"><History className="h-3.5 w-3.5" /> Security Audit Logs</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {activeSubTab === 'sessions' && (
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-semibold text-slate-800">Monitored Device Fingerprints</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {devices.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500">All monitored sessions revoked.</p>
                ) : (
                  devices.map(dev => (
                    <div key={dev.id} className="p-4 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                      <div className="flex items-center gap-3.5">
                        <div className={`p-2 rounded-lg ${dev.trusted ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-600'}`}>
                          <Laptop className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            {dev.type} ({dev.os})
                            {!dev.trusted && <span className="text-xs font-semibold tracking-wider uppercase bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">Untrusted Device</span>}
                          </div>
                          <p className="text-sm text-slate-400 font-medium mt-0.5">IP Address: {dev.ip} | Client: {dev.browser}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 mr-2">{dev.active}</span>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => revokeDevice(dev.id)}
                          className="px-2.5 py-1 text-sm font-semibold uppercase tracking-wider border border-slate-200 rounded-md hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'matrix' && (
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-semibold text-slate-800">Functional Resource RBAC Matrix</h2>
                <p className="text-base text-slate-500 mt-1">Click a cell to toggle permission (demo).</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/30 border-b border-slate-200/60 text-sm font-semibold uppercase tracking-wider text-slate-400">
                      <th className="p-3 pl-4">Protected Module Resource</th>
                      <th className="p-3 text-center">Hosp Admin</th>
                      <th className="p-3 text-center">Doctor</th>
                      <th className="p-3 text-center">Nurse</th>
                      <th className="p-3 text-center">Receptionist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-base font-medium text-slate-700">
                    {functionalModules.map((mod, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-3 pl-4 font-semibold text-slate-800">{mod.name}</td>
                        {(['admin', 'doc', 'nurse', 'recep'] as const).map((role) => (
                          <td key={role} className="p-3 text-center">
                            <button type="button" onClick={() => toggleMatrix(idx, role)} className="mx-auto block">
                              {mod[role] ? <CheckCircle className="h-4 w-4 mx-auto text-emerald-600" /> : <XCircle className="h-4 w-4 mx-auto text-slate-300" />}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'logs' && (
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800">Immutable Security Audit Stream</h2>
                <button
                  type="button"
                  onClick={() => showSuccess('Audit log export queued (mock).')}
                  className="text-sm font-semibold uppercase text-indigo-600"
                >
                  Export
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {mockSecurityLogs.map((log, idx) => (
                  <div key={idx} className="p-4 flex items-start gap-3 hover:bg-slate-50/30">
                    <div className={`mt-0.5 p-1 rounded ${log.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-600' : log.severity === 'WARN' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                      {log.severity === 'CRITICAL' ? <AlertOctagon className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{log.event}</p>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">{log.time} · {log.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-900 text-white rounded-xl p-5 shadow-lg relative overflow-hidden">
            <Key className="absolute -right-4 -bottom-4 h-24 w-24 text-indigo-800 opacity-50" />
            <h3 className="text-lg font-semibold uppercase tracking-wider relative z-10">Password Policy Engine</h3>
            <ul className="mt-4 space-y-2 relative z-10 text-xs font-semibold text-indigo-100">
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Min 12 characters enforced</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> MFA required for clinical roles</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> 90-day rotation cycle</li>
            </ul>
            <button
              type="button"
              onClick={() => showSuccess('Password policy draft saved.')}
              className="mt-4 w-full rounded-lg bg-white/10 py-2 text-sm font-semibold uppercase hover:bg-white/20"
            >
              Update policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
