'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
  HeartPulse,
  FileText,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  bypassToNextWaiting,
  callNextPatientInQueue,
  fetchLiveAppointments,
  isInConsultationStatus,
  isWaitingStatus,
  resolveActivePatient,
  subscribeAppointmentsRealtime,
  type LiveAppointmentRecord,
} from '@/lib/doctor/appointments-realtime';

export default function DoctorDashboardPage() {
  const router = useRouter();

  const doctorName = 'Dr. Chandrakanth S Kesari';
  const department = 'General Surgery • Room 204';
  const currentDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const [appointments, setAppointments] = useState<LiveAppointmentRecord[]>([]);
  const [activePatient, setActivePatient] = useState<LiveAppointmentRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'appointments'>('queue');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [callingNext, setCallingNext] = useState(false);
  const [bypassing, setBypassing] = useState(false);

  const loadAppointments = useCallback(async () => {
    try {
      const records = await fetchLiveAppointments();
      setAppointments(records);
      setActivePatient(resolveActivePatient(records));
    } catch (err) {
      console.error('[Doctor Dashboard Load]:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
    const unsubscribe = subscribeAppointmentsRealtime(() => {
      void loadAppointments();
    });
    return unsubscribe;
  }, [loadAppointments]);

  const waitingQueue = appointments.filter((a) => isWaitingStatus(a.status));
  const inConsultationQueue = appointments.filter((a) => isInConsultationStatus(a.status));
  const completedQueue = appointments.filter((a) => a.status === 'COMPLETED');

  const totalPatients = appointments.length;
  const totalWaiting = waitingQueue.length;
  const inConsultation = inConsultationQueue.length;
  const completedToday = completedQueue.length;

  const canCallNext = waitingQueue.length > 0 && !callingNext;
  const canStartConsultation = Boolean(activePatient);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadAppointments();
  };

  const handleCallNext = async () => {
    if (waitingQueue.length === 0) {
      toast.info('No patients waiting in queue. Patient bookings from the app will appear automatically.');
      return;
    }

    setCallingNext(true);
    try {
      const next = await callNextPatientInQueue(appointments, activePatient);
      if (next) {
        await loadAppointments();
        toast.success(`Called ${next.patient_name} into consultation`);
      }
    } catch (err) {
      console.error('[Call Next]:', err);
      toast.error('Failed to call next patient');
    } finally {
      setCallingNext(false);
    }
  };

  const handleBypass = async () => {
    if (waitingQueue.length === 0) {
      toast.info('No patients waiting in queue');
      return;
    }

    setBypassing(true);
    try {
      const next = await bypassToNextWaiting(appointments);
      if (next) {
        await loadAppointments();
        toast.success(`Emergency bypass: ${next.patient_name} moved to consultation`);
      }
    } catch (err) {
      console.error('[Emergency Bypass]:', err);
      toast.error('Emergency bypass failed');
    } finally {
      setBypassing(false);
    }
  };

  const handleStartConsultation = () => {
    if (!activePatient) return;
    router.push(`/doctor/consultations/${activePatient.id}`);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/70 p-4 md:p-6 space-y-4">
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Good Afternoon, {doctorName}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Connected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2">
            <span>{department}</span>
            <span>•</span>
            <span>{currentDate}</span>
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 active:scale-95 self-start md:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Patients</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalPatients}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Waiting Queue
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-1">{totalWaiting}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-blue-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              In Consultation
            </span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 mt-1">{inConsultation}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Completed Today
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">{completedToday}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
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
                All Bookings ({appointments.length})
              </button>
            </div>

            <button
              onClick={() => void handleCallNext()}
              disabled={!canCallNext}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                canCallNext
                  ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              {callingNext ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserCheck className="w-3.5 h-3.5" />
              )}
              Call Next
            </button>
          </div>

          {activeTab === 'queue' && (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
              {isLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <RotateCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
                  <p className="text-xs font-medium">Connecting to patient bookings...</p>
                </div>
              ) : waitingQueue.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Megaphone className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-xs text-slate-600">
                    No patients waiting in queue.
                  </p>
                  <p className="text-[11px] mt-0.5">
                    Patient bookings from the app will appear automatically.
                  </p>
                </div>
              ) : (
                waitingQueue.map((item, idx) => {
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
                        <span className="w-8 h-8 rounded-lg bg-teal-600 text-white font-black text-xs flex items-center justify-center">
                          {item.token_number || `#${idx + 1}`}
                        </span>
                        <div>
                          <p className="font-bold text-xs text-slate-900">{item.patient_name}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {item.chief_complaint || 'OPD Review'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 block">
                          ~{item.predicted_wait_min || 5} min
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

          {activeTab === 'appointments' && (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
              {appointments.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-xs text-slate-600">No patient bookings found</p>
                </div>
              ) : (
                appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900">{appt.patient_name}</p>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {appt.type || 'Standard Consultation'} · {appt.status}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                      {appt.time_slot || 'Today'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Active Clinical Encounter</h2>
                <p className="text-[11px] text-slate-400">Live patient on-deck workstation</p>
              </div>
            </div>

            <button
              onClick={() => void handleBypass()}
              disabled={waitingQueue.length === 0 || bypassing}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                waitingQueue.length > 0 && !bypassing
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              {bypassing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              )}
              Emergency Bypass
            </button>
          </div>

          {activePatient ? (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl text-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center font-black text-teal-300 text-base">
                    {activePatient.token_number || '#1'}
                  </div>
                  <div>
                    <h3 className="font-black text-base leading-tight">{activePatient.patient_name}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {activePatient.age || 25} Yrs • {activePatient.gender || 'Patient'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-teal-300 block tracking-wider">
                    Status
                  </span>
                  <span className="text-sm font-bold text-white">{activePatient.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <HeartPulse className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Recorded Vitals
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    {activePatient.vitals_summary || 'Awaiting vitals capture in consultation'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Chief Complaint
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    {activePatient.chief_complaint || 'General consultation review'}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleStartConsultation}
                  disabled={!canStartConsultation}
                  className={`w-full py-3 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] ${
                    canStartConsultation
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start Consultation Encounter
                </button>
              </div>
            </div>
          ) : (
            <div className="py-14 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Stethoscope className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-700">No Patient In Queue</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                Patient bookings from the app will appear automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
