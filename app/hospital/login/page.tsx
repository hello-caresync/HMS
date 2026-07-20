'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, User, Activity, ArrowRight, Activity as PulseIcon } from 'lucide-react';

export default function Layer1AuthGateway() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('Hospital Administrator');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const systemRoles = [
    { name: 'Hospital Administrator', desc: 'Full System Ops & ERP Telemetry Control', code: 'ADMIN' },
    { name: 'Receptionist', desc: 'Patient Intake, Registration & Tokens', code: 'RECP' },
    { name: 'Doctor', desc: 'OPD Consultation, EMR Logs & Clinical Orders', code: 'DOC' },
    { name: 'Nurse', desc: 'IPD Vitals Management, Wards & Triage Load', code: 'NURSE' },
    { name: 'Lab Technician', desc: 'Laboratory Diagnostics Matrix & Orders', code: 'LAB' },
    { name: 'Radiology Technician', desc: 'Radiology Modality Hub & Imaging Logs', code: 'RAD' },
    { name: 'Pharmacist', desc: 'Pharmacy Formulary & Dispatches', code: 'PHARM' },
    { name: 'Billing Executive', desc: 'Integrated Ledger, Insurance & Invoicing', code: 'BILL' },
  ];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate localized secure JWT generation/session management based on specified HLD Layer 1 constraints
    setTimeout(() => {
      setIsLoading(false);
      // Pushes authenticated role configuration safely to the cockpit dashboard route
      router.push('/hospital/dashboard');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col justify-center items-center p-4 font-sans antialiased text-slate-900">
      
      {/* ================= MASTER AUTHENTICATION CARD ================= */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 lg:p-8 shadow-xl max-w-4xl w-full border-t-8 border-t-[#00758C] grid grid-cols-1 md:grid-cols-12 gap-6 transition-all">
        
        {/* LEFT COLUMN: ROLE CHOICE MATRIX (7 Cols) */}
        <div className="md:col-span-7 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#00758C]/10 text-[#00758C] border border-[#00758C]/20 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded">
                Layer 1 Control
              </span>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                RBAC Access Gateway
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">Select System Profile Role</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Choose your authorized profile assignment below to initialize modules.</p>
          </div>

          {/* Grid Allocation for the 8 Roles specified in the application structure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
            {systemRoles.map((role) => {
              const isSelected = selectedRole === role.name;
              return (
                <button
                  key={role.code}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role.name);
                    setUsername(role.name.toLowerCase().replace(/\s+/g, '.'));
                  }}
                  className={`text-left p-3 rounded-xl border text-xs transition-all flex flex-col justify-between group cursor-pointer ${
                    isSelected
                      ? 'border-[#00758C] bg-[#00758C]/5 shadow-sm font-bold'
                      : 'border-slate-200 bg-white hover:border-[#008588] hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`font-bold text-xs ${isSelected ? 'text-[#00758C]' : 'text-slate-800'}`}>
                      {role.name}
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-[#00758C] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {role.code}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 leading-snug">
                    {role.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: CREDENTIAL SECURITY FORM (5 Cols) */}
        <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-slate-200/80 pt-6 md:pt-0 md:pl-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="text-center md:text-left">
              <h2 className="text-base font-black text-[#00758C] tracking-tight uppercase">Nexora ERP</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Secure Operator Login</p>
            </div>

            {/* Active Highlight Status Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-3">
              <div className="bg-white border border-slate-200 p-2 rounded-lg text-[#008588] shrink-0 shadow-sm">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-black text-[#00A481] block uppercase tracking-wide">TARGET TARGET BOUND:</span>
                <span className="text-xs font-bold text-slate-800 block truncate">{selectedRole}</span>
              </div>
            </div>

            {/* Form Inputs Container */}
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username or Operator ID"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#008588] transition-all shadow-inner"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Security Access Pin / Code"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#008588] transition-all shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#00758C] hover:bg-[#008588] text-white font-black py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all text-center text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer border border-transparent disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              >
                {isLoading ? (
                  <>
                    <PulseIcon className="h-3.5 w-3.5 animate-spin" />
                    <span>SYNCHRONIZING SECURE NODE...</span>
                  </>
                ) : (
                  <>
                    <span>INITIALIZE SYSTEM SESSION</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Telemetry Gateway Badge Status */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>TLS Gateway Online</span>
            </div>
            <span className="font-mono text-slate-300">v1.62-RBAC</span>
          </div>
        </div>

      </div>
    </div>
  );
}