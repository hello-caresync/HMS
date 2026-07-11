"use client";
import React from 'react';
import { 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  Truck, 
  CheckCircle2 
} from 'lucide-react';

export default function EmergencyTriageDesk() {
  // High contrast mock telemetry data (Strict privacy isolation applied)
  const activeTriageCases = [
    { id: "TRI-2401", patient: "Unknown Male (~45y)", complaint: "Road traffic accident · head trauma", urgency: "CRITICAL", bed: "Awaiting Bed" },
    { id: "TRI-2402", patient: "K.V.", complaint: "Chest pain · radiating to arm", urgency: "URGENT", bed: "TR-BED-03" },
    { id: "TRI-2403", patient: "Walk-in Initials", complaint: "Sports injury · ankle sprain", urgency: "NON-URGENT", bed: "Awaiting Bed" }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-900 bg-slate-50 min-h-screen font-sans selection:bg-slate-200">
      
      {/* Top Critical Alert Banners */}
      <div className="space-y-2">
        <div className="bg-red-100 border-2 border-red-300 text-red-950 p-3.5 rounded-xl flex items-center gap-3 shadow-sm font-bold text-xs sm:text-sm">
          <ShieldAlert className="text-red-700 shrink-0 animate-pulse" size={18} />
          <span>CODE BLUE — RESUSCITATION BAY 2 — ACTIVATE CRASH TEAM IMMEDIATELY</span>
        </div>
        <div className="bg-amber-100 border-2 border-amber-300 text-amber-950 p-3.5 rounded-xl flex items-center gap-3 shadow-sm font-bold text-xs sm:text-sm">
          <AlertTriangle className="text-amber-700 shrink-0" size={18} />
          <span>MASS CASUALTY PROTOCOL STANDBY — 2 AMBULANCES INBOUND</span>
        </div>
      </div>

      {/* Main Operational Interface Stacked Full Width */}
      <div className="w-full space-y-6">
        
        {/* Ambulance Arrival Telemetry Rows */}
        <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm p-5 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900 block">Ambulance Arrival Telemetry</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold space-y-1">
              <div className="flex items-center justify-between text-slate-900">
                <span>AMB-07 · ALS</span>
                <Truck size={14} className="text-slate-900" />
              </div>
              <p className="text-slate-800 font-medium">En Route · ETA 4 min</p>
              <span className="text-[10px] text-slate-800 font-medium">1 Patient Boarded</span>
            </div>

            <div className="p-3 bg-emerald-50 border-2 border-emerald-200 rounded-lg text-xs font-bold space-y-1">
              <div className="flex items-center justify-between text-emerald-900">
                <span>AMB-12 · BLS</span>
                <CheckCircle2 size={14} className="text-emerald-700" />
              </div>
              <p className="text-emerald-800">Arrived at Bay</p>
              <span className="text-[10px] text-emerald-600 font-medium">2 Patients Logged</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold space-y-1">
              <div className="flex items-center justify-between text-slate-900">
                <span>AMB-03 · ALS</span>
                <Truck size={14} className="text-slate-900" />
              </div>
              <p className="text-slate-800 font-medium">En Route · ETA 12 min</p>
              <span className="text-[10px] text-slate-800 font-medium">1 Patient Boarded</span>
            </div>
          </div>
        </div>

        {/* High-Contrast Live Triage Board Table */}
        <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-base font-bold text-slate-900">Live Case Triage Board</h3>
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-1 rounded">
              <Activity size={10} />
              <span>REALTIME AGGREGATION CORE</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-100 text-slate-900 font-black">
                  <th className="p-3">Case ID</th>
                  <th className="p-3">Patient Descriptor</th>
                  <th className="p-3">Clinical Indication</th>
                  <th className="p-3">Urgency Tier</th>
                  <th className="p-3 text-right">Location Bed</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-slate-900">
                {activeTriageCases.map((item, idx) => (
                  <tr key={idx} className="border-b-2 border-slate-200 hover:bg-slate-100/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900">{item.id}</td>
                    <td className="p-3 font-bold text-slate-900">{item.patient}</td>
                    <td className="p-3 text-slate-950">{item.complaint}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.urgency === 'CRITICAL' ? 'bg-red-100 text-red-950 border-red-400 font-bold' :
                        item.urgency === 'URGENT' ? 'bg-amber-100 text-amber-950 border-amber-400 font-bold' :
                        'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold'
                      }`}>
                        {item.urgency}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {item.bed === 'Awaiting Bed' ? (
                        <button className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 py-1 rounded text-[10px] transition-colors shadow-sm">
                          Assign Trauma Bed
                        </button>
                      ) : (
                        <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded text-[10px] font-bold">
                          {item.bed}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      
    </div>
  );
}