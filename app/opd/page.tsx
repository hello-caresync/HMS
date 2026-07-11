"use client";
import React, { useState } from 'react';
import { Search, CheckCircle2, Clock, CalendarDays } from 'lucide-react';

export default function OPDDeskPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Isolated test data with strong contrast mapping (No live user data exposed)
  const mockPatients = [
    { id: "OPD-2026-001", initials: "R.K.", age: "34", gender: "Male", doctor: "Dr. A. Mehta", slot: "16:30", status: "Checked In" },
    { id: "OPD-2026-002", initials: "S.N.", age: "29", gender: "Female", doctor: "Dr. S. Patil", slot: "16:45", status: "In Consultation" },
    { id: "OPD-2026-003", initials: "V.G.", age: "52", gender: "Male", doctor: "Dr. A. Mehta", slot: "17:00", status: "Awaiting Vitals" },
  ];

  const filteredPatients = mockPatients.filter(p => 
    p.initials.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-900 bg-slate-50 min-h-screen font-sans selection:bg-slate-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">OPD Consultation Desk</h1>
          <p className="text-sm text-slate-900 font-medium">Manage outpatient registrations, dynamic queueing, and vital sign workflows.</p>
        </div>
        <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-800">
          Sandbox Mode Active
        </div>
      </div>

      {/* Analytical Monitoring Cards — High Contrast Text Mapping */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Today's Visits</span>
            <h3 className="text-2xl font-black text-slate-950 mt-1">24 Patients</h3>
          </div>
          <div className="bg-slate-100 p-2.5 rounded-lg text-slate-900 border border-slate-200"><CalendarDays size={18} /></div>
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Active Queue</span>
            <h3 className="text-2xl font-black text-slate-950 mt-1">5 Waiting</h3>
          </div>
          <div className="bg-slate-100 p-2.5 rounded-lg text-slate-900 border border-slate-200"><Clock size={18} /></div>
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Completed Sessions</span>
            <h3 className="text-2xl font-black text-slate-950 mt-1">19 Discharged</h3>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-800 border border-emerald-200"><CheckCircle2 size={18} /></div>
        </div>
      </div>

      {/* Main Operational Interface - Restructured to Full Width */}
      <div className="w-full bg-white rounded-xl border-2 border-slate-200 shadow-sm p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">Active Clinic Worklist</h2>
          <p className="text-xs text-slate-900 font-medium">Monitor ongoing doctor assignment queues and scheduling windows.</p>
        </div>

        {/* Interactive Filtering Tool */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-800" size={16} />
          <input 
            type="text" 
            placeholder="Search by test ID or tracking initials (e.g., 'R.K.')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-slate-400"
          />
        </div>

        {/* High Density Accessible Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-100 text-slate-900 font-black">
                <th className="p-3">OPD ID</th>
                <th className="p-3">Initials</th>
                <th className="p-3">Demographics</th>
                <th className="p-3">Assigned Physician</th>
                <th className="p-3">Slot Time</th>
                <th className="p-3 text-right">Status State</th>
              </tr>
            </thead>
            <tbody className="font-semibold text-slate-900">
              {filteredPatients.length > 0 ? (filteredPatients.map((patient, index) => (
                <tr key={index} className="border-b-2 border-slate-200 hover:bg-slate-100/80 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-900">{patient.id}</td>
                  <td className="p-3 font-bold text-slate-900">{patient.initials}</td>
                  <td className="p-3 text-slate-950">{patient.age} Yrs / {patient.gender}</td>
                  <td className="p-3 text-slate-950 font-bold">{patient.doctor}</td>
                  <td className="p-3 font-bold text-slate-900">{patient.slot}</td>
                  <td className="p-3 text-right">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      patient.status === 'In Consultation' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                      patient.status === 'Checked In' ? 'bg-amber-100 text-amber-950 border-amber-400 font-bold' :
                      'bg-slate-100 text-slate-900 border-slate-300'
                    }`}>
                      {patient.status}
                    </span>
                  </td>
                </tr>
              ))) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-900 font-bold bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                    No matching outpatient simulation files identified.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}