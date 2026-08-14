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
  HeartPulse,
  User,
  FileText
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
  type: string;
}

export default function DoctorDashboardPage() {
  const router = useRouter();

  // Clinician Details
  const doctorName = 'Dr. Chandrakanth S Kesari';
  const department = 'General Surgery • Room 204';
  const currentDate = 'Friday, 14 August 2026';

  // Queue State
  const [queue, setQueue] = useState<QueuePatient[]>([
    {
      id: 'p-1',
      tokenNumber: '#1',
      patientName: 'Aishwarya D S',
      age: 24,
      gender: 'Female',
      chiefComplaint: 'Post-surgery review & mild fever',
      vitalsSummary: 'BP: 120/80 • SpO2: 98% • Temp: 98.6°F',
      predictedWaitMin: 0,
      mlDurationMin: 15,
      status: 'WAITING',
    },
    {
      id: 'p-2',
      tokenNumber: '#2',
      patientName: 'Rahul Verma',
      age: 32,
      gender: 'Male',
      chiefComplaint: 'Abdominal discomfort after meals',
      vitalsSummary: 'Vitals pending intake',
      predictedWaitMin: 15,
      mlDurationMin: 12,
      status: 'WAITING',
    },
  ]);

  const [activeTab, setActiveTab] = useState<'queue' | 'appointments'>('queue');
  const [activePatient, setActivePatient] = useState<QueuePatient | null>(queue[0] || null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const appointments: Appointment[] = [
    { id: 'a-1', patientName: 'Suresh Rao', timeSlot: '02:30 PM', type: 'Follow-up' },
    { id: 'a-2', patientName: 'Meera Nair', timeSlot: '03:15 PM', type: 'Pre-op Check' },
  ];

  // Derived Metrics
  const totalWaiting = queue.filter((q) => q.status === 'WAITING').length;
  const inConsultation = queue.filter((q) => q.status === 'IN_CONSULTATION').length;
  const completedToday = queue.filter((q) => q.status === 'COMPLETED').length;
  const totalOpd = queue.length + appointments.length;

  const canCallNext = totalWaiting > 0;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleCallNext = () => {
    const nextPatient = queue.find((q) => q.status === 'WAITING' && q.id !== activePatient?.id);
    if (nextPatient) {
      setActivePatient(nextPatient);
    }
  };

  const handleStartConsultation = () => {
    if (!activePatient) return;
    router.push(`/doctor/consultations/${activePatient.id}`);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/70 p-4 md:p-6 space-y-4">
      {/* 1. TOP HEADER & CLINICIAN PROFILE */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Good Afternoon, {doctorName}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online & Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2">
            <span>{department}</span>
            <span>•</span>
            <span>{currentDate}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* 2. BALANCED 4-METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Patients</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalOpd}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Waiting Queue</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-1">{totalWaiting}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-blue-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Consultation</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 mt-1">{inConsultation}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">{completedToday}</p>
        </div>
      </div>

      {/* 3. MAIN 2-COLUMN WORKSTATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: Queue & Scheduled (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setActiveTab('queue')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'queue'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Live Queue ({totalWaiting})
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'appointments'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Appointments ({appointments.length})
              </button>
            </div>

            <button
              onClick={handleCallNext}
              disabled={!canCallNext}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                canCallNext
                  ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Call Next
            </button>
          </div>

          {/* Tab Content: Live Queue */}
          {activeTab === 'queue' && (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
              {queue.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Megaphone className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-xs text-slate-600">No patients waiting in queue</p>
                  <p className="text-[11px] mt-0.5">Mobile app check-ins will sync here.</p>
                </div>
              ) : (
                queue.map((item) => {
                  const isSelected = activePatient?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActivePatient(item)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-teal-50/70 border-teal-400 shadow-sm ring-1 ring-teal-400/20'
                          : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-teal-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          {item.tokenNumber}
                        </span>
                        <div>
                          <p className="font-bold text-xs text-slate-900">{item.patientName}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{item.chiefComplaint}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 block">
                          ~{item.predictedWaitMin} min
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-md bg-amber-100 text-amber-800 uppercase tracking-wide">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab Content: Appointments */}
          {activeTab === 'appointments' && (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
              {appointments.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-xs text-slate-600">No scheduled appointments</p>
                </div>
              ) : (
                appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900">{appt.patientName}</p>
                      <span className="text-[10px] text-slate-400 font-semibold">{appt.type}</span>
                    </div>
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                      {appt.timeSlot}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Active Clinical Workstation (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Active Clinical Encounter</h2>
                <p className="text-[11px] text-slate-400">Patient on-deck workstation</p>
              </div>
            </div>

            <button className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Emergency Bypass
            </button>
          </div>

          {activePatient ? (
            <div className="space-y-4">
              {/* Patient Banner */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl text-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center font-black text-teal-300 text-base">
                    {activePatient.tokenNumber}
                  </div>
                  <div>
                    <h3 className="font-black text-base leading-tight">{activePatient.patientName}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {activePatient.age} Yrs • {activePatient.gender}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-teal-300 block tracking-wider">
                    ML Duration
                  </span>
                  <span className="text-sm font-bold text-white">~{activePatient.mlDurationMin} min</span>
                </div>
              </div>

              {/* Vitals & Intake Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <HeartPulse className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Recorded Vitals</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{activePatient.vitalsSummary}</p>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Chief Complaint</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{activePatient.chiefComplaint}</p>
                </div>
              </div>

              {/* Primary Call to Action */}
              <div className="pt-2">
                <button
                  onClick={handleStartConsultation}
                  className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Start Consultation Encounter
                </button>
              </div>
            </div>
          ) : (
            <div className="py-14 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Stethoscope className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-700">No Active Patient On Deck</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                Select a patient from the queue or click "Call Next" to start an encounter.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}