'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  Stethoscope,
  UserCheck,
  Play,
  RotateCw,
  Calendar,
  Activity,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface QueuePatient {
  id: string;
  tokenNumber: string;
  patientName: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  vitalsSummary: string;
  predictedWaitMin: number;
  mlDurationMin: number;
  status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED';
}

interface Appointment {
  id: string;
  patientName: string;
  timeSlot: string;
  status: string;
}

export default function DoctorDashboardPage() {
  const router = useRouter();

  // Doctor Profile Info
  const doctorName = 'Dr. CHANDRAKANTH S KESARI';
  const department = 'General Surgery';
  const currentDate = 'Friday, 14 August 2026';

  // Queue State (Can be populated from Supabase)
  const [queue, setQueue] = useState<QueuePatient[]>([
    {
      id: 'p-1',
      tokenNumber: '#1',
      patientName: 'Aishwarya D S',
      age: 24,
      gender: 'Female',
      chiefComplaint: 'Post-surgery review & fever',
      vitalsSummary: 'BG O+ • Intake Complete',
      predictedWaitMin: 0,
      mlDurationMin: 16,
      status: 'WAITING',
    },
    {
      id: 'p-2',
      tokenNumber: '#2',
      patientName: 'Rahul Verma',
      age: 32,
      gender: 'Male',
      chiefComplaint: 'Abdominal pain & nausea',
      vitalsSummary: 'BP 120/80 • Pending Intake',
      predictedWaitMin: 10,
      mlDurationMin: 12,
      status: 'WAITING',
    },
  ]);

  const [activePatient, setActivePatient] = useState<QueuePatient | null>(queue[0] || null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Derived Metrics
  const totalWaiting = queue.filter((q) => q.status === 'WAITING').length;
  const inConsultation = queue.filter((q) => q.status === 'IN_CONSULTATION').length;
  const completedToday = queue.filter((q) => q.status === 'COMPLETED').length;
  const criticalAlerts = 0;
  const todaysOpdTotal = queue.length;

  const canCallNext = totalWaiting > 0;
  const canStartEncounter = Boolean(activePatient);

  // Action Handlers
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleCallNext = () => {
    const nextInLine = queue.find((q) => q.status === 'WAITING' && q.id !== activePatient?.id);
    if (nextInLine) {
      setActivePatient(nextInLine);
    }
  };

  const handleStartConsultation = () => {
    if (!activePatient) return;
    router.push(`/doctor/consultations/${activePatient.id}`);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/60 p-4 md:p-6 space-y-5">
      {/* 1. TOP HEADER & DOCTOR PROFILE GREETING */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Good Afternoon, {doctorName}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
            <span>{department}</span>
            <span>•</span>
            <span>{currentDate}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. FIVE METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Today's OPD
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{todaysOpdTotal}</span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Waiting Queue
          </span>
          <span className="text-2xl font-black text-amber-500 mt-1 block">{totalWaiting}</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            In Consultation
          </span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">{inConsultation}</span>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Completed
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{completedToday}</span>
        </div>

        {/* Metric 5 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm col-span-2 sm:col-span-1">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Critical Alerts
          </span>
          <span className="text-2xl font-black text-rose-500 mt-1 block">{criticalAlerts}</span>
        </div>
      </div>

      {/* 3. DUAL COLUMN: LIVE SMARTQ QUEUE & ACTION BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Live SmartQ Queue */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm md:text-base leading-none">
                  Live SmartQ Queue
                </h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Real-time ML prediction engine
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-100/70 text-blue-600 rounded-lg">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Waiting</span>
                <span className="text-sm font-black text-slate-800">{totalWaiting}</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-100/70 text-indigo-600 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Avg Wait</span>
                <span className="text-sm font-black text-slate-800">~5 min</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-100/70 text-emerald-600 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Done</span>
                <span className="text-sm font-black text-slate-800">{completedToday}</span>
              </div>
            </div>
          </div>

          {/* Queue List Container */}
          {queue.length === 0 ? (
            <div className="py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <Users className="w-5 h-5" />
              </div>
              <p className="font-bold text-slate-700 text-xs">No tokens assigned yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Incoming patients will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
              {queue.map((item, idx) => {
                const isSelected = activePatient?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActivePatient(item)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-teal-50/60 border-teal-300 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{item.tokenNumber}</span>
                          <span className="font-semibold text-xs text-slate-800">{item.patientName}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.chiefComplaint}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                        {item.status}
                      </span>
                      <span className="block text-[10px] font-bold text-slate-400 mt-1">
                        ~{item.predictedWaitMin} min
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Action Bar & On-Deck Spotlight */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm md:text-base leading-none">Action Bar</h2>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                On-deck spotlight & encounter controls
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleCallNext}
              disabled={!canCallNext}
              className={`w-full py-2.5 px-4 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 ${
                canCallNext
                  ? 'bg-[#008080] hover:bg-[#006e6e] text-white active:scale-[0.99]'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Call Next Patient
            </button>

            <button
              onClick={handleStartConsultation}
              disabled={!canStartEncounter}
              className={`w-full py-2.5 px-4 font-bold text-xs rounded-xl border transition-all flex items-center justify-center gap-2 ${
                canStartEncounter
                  ? 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                  : 'border-slate-200 text-slate-300 bg-slate-50/50 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4" />
              Start Encounter
            </button>

            <button className="w-full py-2 px-4 bg-rose-50/80 hover:bg-rose-100 text-rose-700 border border-rose-200/70 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Emergency Queue Bypass
            </button>
          </div>

          {/* On-Deck Patient Spotlight Card */}
          {activePatient ? (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
              <div>
                <span className="block text-[10px] font-black tracking-widest text-indigo-600 uppercase">
                  ON-DECK PATIENT
                </span>
                <span className="text-2xl font-black text-slate-900 block mt-0.5">
                  {activePatient.tokenNumber}
                </span>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Name</span>
                  <span className="text-xs font-bold text-slate-900 truncate block mt-0.5">
                    {activePatient.patientName}
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Age / Gender</span>
                  <span className="text-xs font-bold text-slate-900 block mt-0.5">
                    {activePatient.age} • {activePatient.gender}
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Vitals Summary</span>
                  <span className="text-xs font-bold text-slate-900 block mt-0.5">
                    {activePatient.vitalsSummary}
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">ML Duration</span>
                  <span className="text-xs font-bold text-indigo-600 block mt-0.5">
                    ~{activePatient.mlDurationMin} min
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Chief Complaint</span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">
                  {activePatient.chiefComplaint}
                </span>
              </div>

              <button
                onClick={handleStartConsultation}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
              >
                <Stethoscope className="w-4 h-4" />
                Start Consultation
              </button>
            </div>
          ) : (
            <div className="py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <Stethoscope className="w-5 h-5" />
              </div>
              <p className="font-bold text-slate-700 text-xs">No active patient on deck</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Queue is clear.</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. TODAY'S APPOINTMENTS CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-900 text-sm">Today's Appointments</h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {appointments.length} Scheduled
          </span>
        </div>

        {appointments.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-slate-400 font-medium">
              No appointments for today. Patient bookings appear here in real time.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100"
              >
                <span className="text-xs font-bold text-slate-800">{appt.patientName}</span>
                <span className="text-xs font-medium text-slate-500">{appt.timeSlot}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}