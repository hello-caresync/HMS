'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  AlertTriangle,
  MapPin,
  Send,
  X,
  PhoneCall,
  Ambulance,
  Loader2,
  FileText,
  Calendar,
  Activity,
  Users,
  ChevronRight,
  PlusCircle,
  HeartPulse,
  Bell,
  RefreshCw,
  Clock,
  Sparkles,
  Zap,
  TrendingUp,
  Stethoscope,
  ShieldCheck,
  Building2,
  Heart,
  Flame,
} from 'lucide-react';

interface EmergencyAlert {
  id: string;
  patient_name: string;
  hospital_name: string;
  emergency_location: string;
  status: 'PENDING' | 'DISPATCHED' | 'RESOLVED';
  response_notes?: string;
  created_at: string;
}

interface Appointment {
  id: string;
  patient_name: string;
  doctor_name: string;
  department: string;
  slot_time: string;
  token_number: number;
  appointment_date: string;
}

export default function DashboardWorkspace() {
  const router = useRouter();

  const [showSosModal, setShowSosModal] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dashboard Data States
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [latestAppointment, setLatestAppointment] = useState<Appointment | null>(null);
  const [patientName, setPatientName] = useState('Aishwarya D S');

  const hospitalName =
    typeof window !== 'undefined'
      ? localStorage.getItem('selected_hospital_name') || 'Regal Hospital'
      : 'Regal Hospital';

  useEffect(() => {
    loadDashboardData();

    const handleStorageChange = () => loadDashboardData();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', loadDashboardData);

    const channelName = `dashboard_appts_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_appointments' },
        () => {
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', loadDashboardData);
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDashboardData = async () => {
    let latestAppt: Appointment | null = null;

    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('patient_full_name');
      if (savedName) setPatientName(savedName);

      const savedAppts = localStorage.getItem('curasync_appointments');
      if (savedAppts) {
        try {
          const list: Appointment[] = JSON.parse(savedAppts);
          if (list && list.length > 0) {
            latestAppt = list[0];
          }
        } catch (e) {
          console.warn('Local appointment parse notice');
        }
      }
    }

    try {
      const { data } = await supabase
        .from('patient_appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        latestAppt = data[0];
      }
    } catch (err) {
      console.warn('Supabase dashboard query notice:', err);
    } finally {
      setLatestAppointment(latestAppt);
    }
  };

  const handleSendSosAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput.trim()) return;

    setIsSubmitting(true);

    const newAlert: EmergencyAlert = {
      id: 'alert_' + Date.now(),
      patient_name: patientName,
      hospital_name: hospitalName,
      emergency_location: locationInput,
      status: 'PENDING',
      response_notes: emergencyNotes || 'Emergency dispatch initiated',
      created_at: new Date().toISOString(),
    };

    setActiveAlert(newAlert);
    setIsSubmitting(false);
    setShowSosModal(false);
    setLocationInput('');
    setEmergencyNotes('');
  };

  return (
    <div className="min-h-screen bg-[#EFE8E1] p-6 font-sans text-[#482A41] md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* INNOVATIVE DASHBOARD HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-[#E2D2C8] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#572E54] text-[#D8A657] font-black text-2xl shadow-md">
              {patientName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#482A41]">Hello, {patientName}</h1>
                <button 
                  onClick={loadDashboardData}
                  className="rounded-full bg-[#F8F4F1] p-1.5 text-[#572E54] hover:rotate-180 transition duration-300"
                  title="Sync Dashboard Data"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs font-bold text-[#7A6374]">
                Facility: <span className="text-[#572E54] font-black">{hospitalName}</span> • OPD ID: <span className="text-[#D8A657] font-black">NEX_9021</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/patient/appointments/book')}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#572E54] px-5 py-3.5 text-xs font-black text-white shadow-md hover:bg-[#482A41] transition"
            >
              <PlusCircle className="h-4 w-4 text-[#D8A657]" />
              Book Appointment
            </button>

            <button
              onClick={() => setShowSosModal(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-3.5 text-xs font-black text-white shadow-lg transition hover:bg-rose-700 active:scale-95"
            >
              <AlertTriangle className="h-4 w-4 animate-pulse" />
              SOS Emergency
            </button>
          </div>
        </div>

        {/* ACTIVE SOS STATUS BANNER */}
        {activeAlert && (
          <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-xl animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <Ambulance className="h-5 w-5 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#482A41]">Emergency SOS Sent</h3>
                  <p className="text-xs font-bold text-[#7A6374]">
                    Target Facility: <span className="text-[#572E54]">{activeAlert.hospital_name}</span>
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase text-amber-800">
                Awaiting Hospital Response
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-xs font-semibold sm:grid-cols-2">
              <div className="rounded-2xl bg-[#F8F4F1] p-3">
                <span className="text-[10px] font-black uppercase text-[#7A6374]">Location</span>
                <p className="font-bold text-[#482A41]">{activeAlert.emergency_location}</p>
              </div>

              <div className="rounded-2xl bg-[#F8F4F1] p-3">
                <span className="text-[10px] font-black uppercase text-[#7A6374]">Hospital Desk Status</span>
                <p className="font-bold text-[#572E54]">{activeAlert.response_notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* INNOVATIVE TOP HIGHLIGHT CARDS GRID */}
        <div className="grid gap-5 md:grid-cols-3">
          
          {/* SMARTQ LIVE TOKEN TRACKER CARD */}
          <div 
            onClick={() => router.push('/patient/appointments')}
            className="group relative overflow-hidden rounded-3xl border border-[#E2D2C8] bg-white p-6 shadow-sm transition hover:border-[#572E54] hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#572E54] text-[#D8A657] shadow-md">
                <Activity className="h-6 w-6" />
              </div>
              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${latestAppointment ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {latestAppointment ? 'Live Token Active' : 'No Queue Token'}
              </span>
            </div>

            <div className="mt-4 space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#7A6374]">SmartQ Token Number</h4>
              <p className="text-3xl font-black text-[#482A41]">
                {latestAppointment ? `#${latestAppointment.token_number || 1}` : 'Not Issued'}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-[#572E54]">
              <span>Est. Wait Time: <strong className="text-[#482A41]">{latestAppointment ? '~12 Mins' : '0 Mins'}</strong></span>
              <span className="flex items-center gap-1 group-hover:translate-x-1 transition">
                Track <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          {/* UPCOMING DOCTOR CONSULTATION CARD */}
          <div 
            onClick={() => router.push('/patient/appointments')}
            className="group relative overflow-hidden rounded-3xl border border-[#E2D2C8] bg-white p-6 shadow-sm transition hover:border-[#572E54] hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#572E54]/10 text-[#572E54]">
                <Calendar className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase text-amber-800">
                {latestAppointment ? latestAppointment.appointment_date : 'Schedule'}
              </span>
            </div>

            <div className="mt-4 space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#7A6374]">Upcoming Visit</h4>
              <p className="text-lg font-black text-[#482A41] truncate">
                {latestAppointment ? latestAppointment.doctor_name : 'No Scheduled Visits'}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-[#572E54]">
              <span>Slot: <strong className="text-[#482A41]">{latestAppointment ? latestAppointment.slot_time : 'N/A'}</strong></span>
              <span className="flex items-center gap-1 group-hover:translate-x-1 transition">
                View Ticket <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          {/* MEDICAL RECORDS & PRESCRIPTIONS CARD */}
          <div 
            onClick={() => router.push('/patient/prescriptions')}
            className="group relative overflow-hidden rounded-3xl border border-[#E2D2C8] bg-white p-6 shadow-sm transition hover:border-[#572E54] hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <FileText className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-700">
                Verified
              </span>
            </div>

            <div className="mt-4 space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#7A6374]">Digital Health Records</h4>
              <p className="text-lg font-black text-[#482A41] truncate">
                Prescriptions & OPD Notes
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-[#572E54]">
              <span>Records: <strong className="text-[#482A41]">Synced</strong></span>
              <span className="flex items-center gap-1 group-hover:translate-x-1 transition">
                Access All <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

        </div>

        {/* INNOVATIVE HEALTH VITALS & SHORTCUTS SECTION */}
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* LEFT COLUMN: QUICK ACTION HUB GRID */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-[#E2D2C8] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-[#482A41]">Quick Navigation Hub</h3>
                  <p className="text-xs font-bold text-[#7A6374]">Direct access to OPD services and hospital directory</p>
                </div>
                <Sparkles className="h-5 w-5 text-[#D8A657]" />
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <button
                  onClick={() => router.push('/patient/doctors')}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-[#F8F4F1] p-5 text-center transition hover:border-[#572E54] hover:bg-white hover:shadow-md group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#572E54] group-hover:bg-[#572E54] group-hover:text-white transition">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-black text-[#482A41]">Doctor Directory</span>
                </button>

                <button
                  onClick={() => router.push('/patient/appointments/book')}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-[#F8F4F1] p-5 text-center transition hover:border-[#572E54] hover:bg-white hover:shadow-md group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#572E54] group-hover:bg-[#572E54] group-hover:text-white transition">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-black text-[#482A41]">Book OPD</span>
                </button>

                <button
                  onClick={() => router.push('/patient/prescriptions')}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-[#F8F4F1] p-5 text-center transition hover:border-[#572E54] hover:bg-white hover:shadow-md group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#572E54] group-hover:bg-[#572E54] group-hover:text-white transition">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-black text-[#482A41]">Prescriptions</span>
                </button>

                <button
                  onClick={() => router.push('/patient/notifications')}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-[#F8F4F1] p-5 text-center transition hover:border-[#572E54] hover:bg-white hover:shadow-md group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#572E54] group-hover:bg-[#572E54] group-hover:text-white transition">
                    <Bell className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-black text-[#482A41]">Notifications</span>
                </button>
              </div>
            </div>

            {/* LIVE HEALTH VITALS MONITOR CARD */}
            <div className="rounded-3xl border border-[#E2D2C8] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-600 animate-pulse" />
                  <h3 className="text-base font-black text-[#482A41]">Personal Health Vitals</h3>
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  Normal Range
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-[#F8F4F1] p-4 space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#7A6374]">Heart Rate</span>
                  <p className="text-xl font-black text-[#482A41]">72 <span className="text-xs text-[#7A6374]">BPM</span></p>
                  <p className="text-[10px] font-extrabold text-emerald-600">Resting optimal</p>
                </div>

                <div className="rounded-2xl bg-[#F8F4F1] p-4 space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#7A6374]">Blood Pressure</span>
                  <p className="text-xl font-black text-[#482A41]">120/80 <span className="text-xs text-[#7A6374]">mmHg</span></p>
                  <p className="text-[10px] font-extrabold text-emerald-600">Systolic normal</p>
                </div>

                <div className="rounded-2xl bg-[#F8F4F1] p-4 space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#7A6374]">Blood Oxygen (SpO2)</span>
                  <p className="text-xl font-black text-[#482A41]">98%</p>
                  <p className="text-[10px] font-extrabold text-emerald-600">Optimal aeration</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PATIENT PROFILE CARD */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#E2D2C8] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-[#482A41]">Patient Profile Summary</h3>
                <HeartPulse className="h-5 w-5 text-rose-500" />
              </div>

              <div className="space-y-3 text-xs font-semibold">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-[#7A6374]">Full Name</span>
                  <span className="font-bold text-[#482A41]">{patientName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-[#7A6374]">Blood Group</span>
                  <span className="font-bold text-rose-600">O+ Positive</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-[#7A6374]">Registered Hospital</span>
                  <span className="font-bold text-[#572E54]">{hospitalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A6374]">Emergency Contact</span>
                  <span className="font-bold text-[#482A41]">+91 98765 43210</span>
                </div>
              </div>

              <button
                onClick={() => router.push('/patient/profile')}
                className="w-full rounded-2xl bg-[#572E54]/10 py-3 text-xs font-black text-[#572E54] hover:bg-[#572E54] hover:text-white transition"
              >
                Edit Profile Details
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* SOS EMERGENCY DISPATCH MODAL */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl">
            
            <button
              onClick={() => setShowSosModal(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[#482A41] hover:bg-slate-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-md">
                <AlertTriangle className="h-8 w-8 animate-pulse" />
              </div>
              <h2 className="mt-3 text-xl font-black text-[#482A41]">Emergency Dispatch</h2>
              <p className="mt-1 text-xs font-bold text-[#7A6374]">
                Sending alert to registered facility: <span className="text-[#572E54]">{hospitalName}</span>
              </p>
            </div>

            <form onSubmit={handleSendSosAlert} className="mt-6 space-y-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-[#482A41]">
                  Emergency Location / Place *
                </label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-rose-600" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bannerghatta Main Road, Bengaluru"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-[#F8F4F1] py-3 pl-10 pr-4 text-xs font-bold text-[#482A41] focus:border-rose-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-[#482A41]">
                  Emergency Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Severe chest pain, accident..."
                  value={emergencyNotes}
                  onChange={(e) => setEmergencyNotes(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-[#F8F4F1] p-3 text-xs font-bold text-[#482A41] focus:border-rose-600 focus:outline-none"
                />
              </div>

              <div className="rounded-2xl bg-rose-50 p-3 text-[11px] font-bold text-rose-800 flex items-center gap-2">
                <PhoneCall className="h-4 w-4 shrink-0" />
                <span>Auto-attaches medical profile to {hospitalName} emergency desk.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-4 text-xs font-black text-white shadow-xl transition hover:bg-rose-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Dispatching Alert...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send Emergency Alert to {hospitalName}
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}