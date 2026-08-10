'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  Calendar,
  FileText,
  ShieldCheck,
  PlusCircle,
  AlertTriangle,
  Activity,
  ChevronRight,
  RefreshCw,
  Stethoscope,
  User,
  MessageSquare,
} from 'lucide-react';

interface Appointment {
  id: string;
  patient_name: string;
  doctor_name: string;
  department: string;
  slot_time: string;
  token_number: number;
  appointment_date: string;
  queue_status?: string;
}

function mergeAppointments(local: Appointment[], remote: Appointment[]): Appointment[] {
  const map = new Map<string, Appointment>();
  for (const item of local) {
    map.set(item.id || `${item.doctor_name}-${item.appointment_date}-${item.token_number}`, item);
  }
  for (const item of remote) {
    const key = item.id || `${item.doctor_name}-${item.appointment_date}-${item.token_number}`;
    map.set(key, { ...map.get(key), ...item, id: item.id || key });
  }
  return Array.from(map.values()).sort((a, b) => {
    const dateCmp = (b.appointment_date || '').localeCompare(a.appointment_date || '');
    if (dateCmp !== 0) return dateCmp;
    return (b.token_number || 0) - (a.token_number || 0);
  });
}

export default function PatientDashboardPage() {
  const router = useRouter();
  const [patientName, setPatientName] = useState('Patient');
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const fetchPatientAppointments = useCallback(async () => {
    let list: Appointment[] = [];

    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('patient_full_name');
      if (savedName) setPatientName(savedName);

      const localData = localStorage.getItem('curasync_appointments');
      if (localData) {
        try {
          list = JSON.parse(localData) as Appointment[];
          setAppointments(list);
        } catch {
          console.warn('Local storage parse notice');
        }
      }
    }

    try {
      const { data, error } = await supabase
        .from('patient_appointments')
        .select('*')
        .order('appointment_date', { ascending: false });

      if (!error && data) {
        list = mergeAppointments(list, data as Appointment[]);
        localStorage.setItem('curasync_appointments', JSON.stringify(list));
      }
    } catch {
      console.warn('Backend sync notice');
    } finally {
      setAppointments(list);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchPatientAppointments(), 0);

    const channel = supabase
      .channel('patient_dashboard_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_appointments' },
        () => void fetchPatientAppointments(),
      )
      .subscribe();

    return () => {
      window.clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [fetchPatientAppointments]);

  const activeAppt =
    appointments.find(
      (apt) => apt.queue_status !== 'CANCELLED' && apt.queue_status !== 'COMPLETED',
    ) ?? appointments[0] ?? null;

  return (
    <div className="mx-auto max-w-7xl space-y-8 font-sans text-[#0E2924]">
      <div className="flex flex-col gap-6 rounded-3xl bg-[#113831] p-8 text-white shadow-xl md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-black text-[#EAF5F2] backdrop-blur-md">
            <ShieldCheck className="h-4 w-4" /> Regal Hospital Verified Account
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
            Welcome back, {patientName}
          </h1>
          <p className="mt-1 text-xs font-bold text-[#EAF5F2]/85">
            Track OPD appointments, live SmartQ tokens, prescriptions, and clinical messages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/patient/appointments/book')}
            className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-[#113831] shadow-md transition hover:bg-[#EAF5F2]"
          >
            <PlusCircle className="h-4 w-4" /> Book Consultation
          </button>
          <button
            type="button"
            onClick={() => router.push('/patient/emergency')}
            className="flex items-center gap-2 rounded-2xl bg-[#E63950] px-5 py-3 text-xs font-black text-white shadow-md transition hover:bg-rose-700"
          >
            <AlertTriangle className="h-4 w-4" /> Emergency SOS
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm transition hover:border-[#227B6B]">
          <div className="flex items-center justify-between border-b border-[#EAF5F2] pb-3">
            <span className="rounded-full bg-[#EAF5F2] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#113831]">
              Live OPD Token
            </span>
            <Activity className="h-5 w-5 text-[#227B6B]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#4B736B]">SmartQ OPD Queue</p>
            <p className="mt-1 text-3xl font-black text-[#0E2924]">
              {activeAppt ? `Token #${activeAppt.token_number}` : 'No Token'}
            </p>
            <p className="mt-2 text-xs font-semibold text-[#4B736B]">
              Status:{' '}
              <span className="font-bold text-[#0E2924]">
                {activeAppt?.queue_status || 'Scheduled'}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/patient/appointments')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EAF5F2] py-3 text-xs font-black text-[#113831] transition hover:bg-[#113831] hover:text-white"
          >
            View Queue Status <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm transition hover:border-[#227B6B]">
          <div className="flex items-center justify-between border-b border-[#EAF5F2] pb-3">
            <span className="rounded-full bg-[#EAF5F2] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#113831]">
              Consultation
            </span>
            <Calendar className="h-5 w-5 text-[#227B6B]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#4B736B]">Assigned Doctor</p>
            <p className="mt-1 truncate text-xl font-black text-[#0E2924]">
              {activeAppt ? activeAppt.doctor_name : 'No Scheduled Doctor'}
            </p>
            <p className="mt-2 text-xs font-semibold text-[#4B736B]">
              Time Slot:{' '}
              <span className="font-bold text-[#0E2924]">{activeAppt?.slot_time || 'N/A'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/patient/appointments')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EAF5F2] py-3 text-xs font-black text-[#113831] transition hover:bg-[#113831] hover:text-white"
          >
            Appointment Details <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm transition hover:border-[#227B6B]">
          <div className="flex items-center justify-between border-b border-[#EAF5F2] pb-3">
            <span className="rounded-full bg-[#EAF5F2] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#113831]">
              Medical Records
            </span>
            <FileText className="h-5 w-5 text-[#227B6B]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#4B736B]">Clinical Documents</p>
            <p className="mt-1 text-xl font-black text-[#0E2924]">Prescriptions & Notes</p>
            <p className="mt-2 text-xs font-semibold text-[#4B736B]">
              Synced from Doctor App clinical workspace
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/patient/prescriptions')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EAF5F2] py-3 text-xs font-black text-[#113831] transition hover:bg-[#113831] hover:text-white"
          >
            View Prescriptions <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-6 rounded-3xl border border-[#D5E8E3] bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#EAF5F2] pb-4">
          <h3 className="text-lg font-black text-[#0E2924]">Patient Services & Navigation</h3>
          <button
            type="button"
            onClick={() => void fetchPatientAppointments()}
            className="flex items-center gap-1.5 text-xs font-bold text-[#227B6B] hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Data
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[
            { href: '/patient/doctors', label: 'Doctor Directory', icon: Stethoscope },
            { href: '/patient/appointments/book', label: 'Book Appointment', icon: Calendar },
            { href: '/patient/messages', label: 'Messages', icon: MessageSquare },
            { href: '/patient/profile', label: 'Profile & Vitals', icon: User },
          ].map(({ href, label, icon: Icon }) => (
            <button
              key={href}
              type="button"
              onClick={() => router.push(href)}
              className="group flex flex-col items-center justify-center space-y-2 rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-6 text-center transition hover:border-[#113831] hover:bg-white"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#113831] text-white shadow-sm transition group-hover:scale-105">
                <Icon className="h-6 w-6 text-[#EAF5F2]" />
              </div>
              <span className="text-xs font-black text-[#0E2924]">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
