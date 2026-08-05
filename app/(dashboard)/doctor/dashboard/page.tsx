'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  FileText, 
  AlertCircle, 
  Play, 
  UserCheck, 
  Search,
  Bell,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function DoctorDashboard() {
  const [activeQueueFilter, setActiveQueueFilter] = useState<'all' | 'waiting' | 'in_consultation'>('all');

  const liveQueue = [
    { id: '1', token: 'C-042', patient: 'P. Nandini', age: 28, gender: 'Female', time: '10:00 AM', wait: '8 min', status: 'waiting', department: 'General Medicine', reason: 'Post-surgery review & fever' },
    { id: '2', token: 'C-043', patient: 'Rajesh Kumar', age: 45, gender: 'Male', time: '10:30 AM', wait: '25 min', status: 'waiting', department: 'General Medicine', reason: 'Diabetes follow-up' },
    { id: '3', token: 'C-041', patient: 'Ananya Roy', age: 32, gender: 'Female', time: '09:45 AM', wait: 'In Room', status: 'in_consultation', department: 'General Medicine', reason: 'Routine Health Checkup' },
  ];

  const recentActivity = [
    { time: '10:12 AM', event: 'Patient checked in at OPD Desk', detail: 'P. Nandini assigned Token C-042' },
    { time: '09:45 AM', event: 'Consultation started', detail: 'Ananya Roy (Token C-041)' },
    { time: '09:30 AM', event: 'New online appointment booked', detail: 'Rajesh Kumar booked slot 10:30 AM' },
    { time: '09:15 AM', event: 'e-Prescription issued', detail: 'Suresh Raina — Paracetamol 650mg, Azithromycin 500mg' },
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#B2EBF2] shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-[#004D56] flex items-center gap-2">
            <span>Welcome, Dr. Aishwarya D S</span>
            <span className="text-xs bg-[#007B8A] text-white px-2.5 py-0.5 rounded-full font-medium">KMC-88410</span>
          </h1>
          <p className="text-sm text-[#005F6B] font-medium mt-0.5">
            General Medicine · Room 302 · Morning Shift (08:00 AM - 04:00 PM)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#007B8A]" />
            <input 
              type="text" 
              placeholder="Search patient, UHID or token..."
              className="pl-9 pr-4 py-2 text-sm bg-[#F0F8F9] border border-[#B2EBF2] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#007B8A] w-64 text-[#0A2E36] placeholder-[#005F6B]/60"
            />
          </div>
          <button className="relative p-2.5 bg-[#F0F8F9] border border-[#B2EBF2] rounded-xl hover:bg-[#B2EBF2]/30 text-[#004D56] transition-colors cursor-pointer">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>
        </div>
      </div>

      {/* 2. TOP 6 METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Today's Visits", val: "12", sub: "4 Completed", icon: Calendar, color: "text-[#007B8A]", bg: "bg-[#007B8A]/10" },
          { label: "Waiting Queue", val: "2", sub: "Avg wait: 12m", icon: Users, color: "text-amber-600", bg: "bg-amber-500/10" },
          { label: "In Room", val: "1", sub: "Token C-041", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Completed", val: "4", sub: "Prescriptions sent", icon: CheckCircle2, color: "text-[#004D56]", bg: "bg-[#004D56]/10" },
          { label: "e-Prescriptions", val: "4", sub: "Synced to Patient App", icon: FileText, color: "text-[#007B8A]", bg: "bg-[#007B8A]/10" },
          { label: "Pending Reviews", val: "1", sub: "Lab report ready", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-500/10" },
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-[#B2EBF2] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#005F6B] uppercase tracking-wider">{item.label}</span>
              <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-[#0A2E36]">{item.val}</span>
              <p className="text-[11px] font-semibold text-[#005F6B] mt-0.5">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. TWO-COLUMN MAIN GRID (8:4 RATIO) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: LIVE QUEUE & ACTIONS (SPAN 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white p-5 rounded-2xl border border-[#B2EBF2] shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#B2EBF2]">
              <div>
                <h2 className="text-lg font-extrabold text-[#004D56] flex items-center gap-2">
                  <span>OPD Live Queue</span>
                  <span className="text-xs bg-[#007B8A] text-white px-2 py-0.5 rounded-full">3 Active</span>
                </h2>
                <p className="text-xs text-[#005F6B] font-medium">Real-time synchronized with Patient App & HMS OPD Desk</p>
              </div>

              <div className="flex items-center gap-2 bg-[#F0F8F9] p-1 rounded-xl border border-[#B2EBF2]">
                {(['all', 'waiting', 'in_consultation'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveQueueFilter(tab)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${
                      activeQueueFilter === tab 
                        ? 'bg-[#007B8A] text-white shadow-xs' 
                        : 'text-[#005F6B] hover:text-[#004D56]'
                    }`}
                  >
                    {tab.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {liveQueue
                .filter(item => activeQueueFilter === 'all' || item.status === activeQueueFilter)
                .map((patient) => (
                  <div 
                    key={patient.id} 
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      patient.status === 'in_consultation' 
                        ? 'bg-[#E0F7FA]/40 border-[#007B8A] shadow-xs' 
                        : 'bg-white border-[#B2EBF2] hover:border-[#007B8A]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-xl font-extrabold text-sm ${
                        patient.status === 'in_consultation' 
                          ? 'bg-[#007B8A] text-white' 
                          : 'bg-[#F0F8F9] text-[#004D56] border border-[#B2EBF2]'
                      }`}>
                        {patient.token}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[#0A2E36] text-base">{patient.patient}</h3>
                          <span className="text-xs text-[#005F6B] font-semibold">({patient.age}y / {patient.gender})</span>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            patient.status === 'in_consultation' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {patient.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-[#005F6B] mt-1">
                          <span className="font-semibold text-[#004D56]">Reason:</span> {patient.reason}
                        </p>
                        <p className="text-[11px] text-[#005F6B]/80 mt-0.5">
                          Scheduled: {patient.time} · Wait Time: <span className="font-bold text-[#0A2E36]">{patient.wait}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {patient.status === 'waiting' && (
                        <button className="flex items-center gap-1.5 bg-[#007B8A] hover:bg-[#004D56] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer">
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Start Visit</span>
                        </button>
                      )}
                      {patient.status === 'in_consultation' && (
                        <button className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer">
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Resume Encounter</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#B2EBF2] shadow-xs">
            <h3 className="text-sm font-extrabold text-[#004D56] uppercase tracking-wider mb-3">Workstation Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { title: 'Write e-Rx', desc: 'Direct prescription', icon: FileText, route: '/doctor/prescriptions' },
                { title: 'View Patients', desc: 'Medical history vault', icon: Users, route: '/doctor/patients' },
                { title: 'Schedule', desc: 'Slot availability', icon: Calendar, route: '/doctor/schedule' },
                { title: 'Profile Setup', desc: 'Working hours & OPD', icon: Activity, route: '/doctor/profile' },
              ].map((act, i) => (
                <a 
                  key={i} 
                  href={act.route} 
                  className="p-3 bg-[#F0F8F9] hover:bg-[#E0F7FA] border border-[#B2EBF2] rounded-xl transition-all flex flex-col justify-between group"
                >
                  <act.icon className="h-5 w-5 text-[#007B8A] group-hover:scale-110 transition-transform" />
                  <div className="mt-2">
                    <p className="font-bold text-xs text-[#0A2E36] group-hover:text-[#004D56]">{act.title}</p>
                    <p className="text-[10px] text-[#005F6B]">{act.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: OPERATIONAL FEED & CROSS-APP SYNC (SPAN 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white p-5 rounded-2xl border border-[#B2EBF2] shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#B2EBF2] mb-4">
              <h2 className="text-base font-extrabold text-[#004D56]">Operational Feed</h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">Live Stream</span>
            </div>

            <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#B2EBF2]">
              {recentActivity.map((act, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#007B8A] ring-4 ring-white"></div>
                  <div>
                    <span className="text-[11px] font-extrabold text-[#007B8A]">{act.time}</span>
                    <p className="text-xs font-bold text-[#0A2E36] mt-0.5">{act.event}</p>
                    <p className="text-[11px] text-[#005F6B] mt-0.5 leading-snug">{act.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-linear-to-br from-[#004D56] to-[#007B8A] p-5 rounded-2xl text-white shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#80E0D0]">Real-Time Sync</span>
              <span className="h-2 w-2 bg-emerald-400 rounded-full animate-ping"></span>
            </div>
            <h3 className="text-lg font-bold mt-2">Nexora Patient App</h3>
            <p className="text-xs text-white/80 mt-1 leading-relaxed">
              Prescriptions, diagnosis notes, and slot updates sync in real-time to patient mobile devices.
            </p>
            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
              <span className="text-white/90 font-medium">Supabase WebSocket: Connected</span>
              <ArrowRight className="h-4 w-4 text-[#80E0D0]" />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}