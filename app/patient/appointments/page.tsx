'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  Calendar,
  Clock,
  PlusCircle,
  User,
  RefreshCw,
  Loader2,
  Trash2,
} from 'lucide-react';

interface Appointment {
  id: string;
  patient_name: string;
  doctor_name: string;
  department: string;
  hospital_name: string;
  appointment_date: string;
  slot_time: string;
  token_number: number;
  queue_status?: string;
}

function slotMinutes(slot: string): number {
  const match = slot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function mergeAndSort(local: Appointment[], remote: Appointment[]): Appointment[] {
  const map = new Map<string, Appointment>();
  for (const item of local) {
    map.set(item.id || `${item.doctor_name}-${item.appointment_date}-${item.token_number}`, item);
  }
  for (const item of remote) {
    const key = item.id || `${item.doctor_name}-${item.appointment_date}-${item.token_number}`;
    map.set(key, { ...map.get(key), ...item, id: item.id || key });
  }
  return Array.from(map.values()).sort((a, b) => {
    const dateCompare = (a.appointment_date || '').localeCompare(b.appointment_date || '');
    if (dateCompare !== 0) return dateCompare;
    return slotMinutes(a.slot_time || '') - slotMinutes(b.slot_time || '');
  });
}

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    let allAppointments: Appointment[] = [];

    if (typeof window !== 'undefined') {
      const savedLocal = localStorage.getItem('curasync_appointments');
      if (savedLocal) {
        try {
          allAppointments = JSON.parse(savedLocal) as Appointment[];
          setAppointments(allAppointments);
        } catch {
          console.warn('Local appointments parse notice');
        }
      }
    }

    try {
      const { data, error } = await supabase.from('patient_appointments').select('*');
      if (!error && data) {
        allAppointments = mergeAndSort(allAppointments, data as Appointment[]);
      }
    } catch (err) {
      console.warn('Database fetch notice:', err);
    } finally {
      allAppointments = mergeAndSort(allAppointments, []).map((apt) => ({
        ...apt,
        token_number: apt.token_number || 1,
        queue_status: apt.queue_status || 'SCHEDULED',
      }));
      localStorage.setItem('curasync_appointments', JSON.stringify(allAppointments));
      setAppointments(allAppointments);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchAppointments(), 0);
    const channel = supabase
      .channel('patient_appointments_page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_appointments' },
        () => void fetchAppointments(),
      )
      .subscribe();

    return () => {
      window.clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [fetchAppointments]);

  const handleCancelAppointment = async (id: string) => {
    setCancellingId(id);
    const updated = appointments.map((apt) =>
      apt.id === id ? { ...apt, queue_status: 'CANCELLED' } : apt,
    );
    setAppointments(updated);
    localStorage.setItem('curasync_appointments', JSON.stringify(updated));

    try {
      await supabase
        .from('patient_appointments')
        .update({ queue_status: 'CANCELLED' })
        .eq('id', id);
    } catch {
      console.warn('Cancelled locally.');
    } finally {
      setCancellingId(null);
    }
  };

  const visible = appointments.filter((apt) => apt.queue_status !== 'CANCELLED');

  return (
    <div className="mx-auto max-w-6xl space-y-8 font-sans text-[#0E2924]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0E2924]">Your Scheduled Appointments</h1>
          <p className="mt-1 text-xs font-bold text-[#4B736B]">
            Active SmartQ tokens synced with the Doctor App in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void fetchAppointments()}
            className="rounded-full bg-white p-3 text-[#227B6B] shadow-sm transition duration-300 hover:rotate-180"
            title="Refresh Appointments"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => router.push('/patient/appointments/book')}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#113831] px-5 py-3 text-xs font-black text-white shadow-md transition hover:bg-[#0E2924]"
          >
            <PlusCircle className="h-4 w-4 text-[#EAF5F2]" />
            Book New Appointment
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-[#D5E8E3] bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-[#227B6B]" />
        </div>
      ) : visible.length > 0 ? (
        <div className="space-y-4">
          {visible.map((apt, index) => (
            <div
              key={apt.id || index}
              className="flex flex-col gap-6 rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#EAF5F2] px-3 py-1 text-[10px] font-black uppercase text-[#113831]">
                    {apt.department || 'General Consultation'}
                  </span>
                  <span className="rounded-full bg-[#D5E8E3] px-3 py-1 text-[10px] font-black uppercase text-[#227B6B]">
                    {apt.queue_status || 'SCHEDULED'}
                  </span>
                  <span className="text-xs font-bold text-[#4B736B]">
                    {apt.hospital_name || 'Regal Hospital'}
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#0E2924]">{apt.doctor_name}</h3>
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#4B736B]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-[#227B6B]" /> {apt.appointment_date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[#227B6B]" /> {apt.slot_time}
                  </span>
                  <span className="flex items-center gap-1.5 font-black text-[#113831]">
                    <User className="h-4 w-4" /> Patient: {apt.patient_name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-[#113831] px-6 py-4 text-white shadow-md">
                  <span className="text-[10px] font-black uppercase text-[#EAF5F2]">SmartQ Token</span>
                  <div className="text-2xl font-black text-white">#{apt.token_number}</div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCancelAppointment(apt.id)}
                  disabled={cancellingId === apt.id}
                  className="rounded-2xl bg-[#EAF5F2] p-3 text-[#E63950] transition hover:bg-[#D5E8E3] disabled:opacity-50"
                  title="Cancel Appointment"
                >
                  {cancellingId === apt.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 rounded-3xl border border-[#D5E8E3] bg-white p-10 text-center">
          <Calendar className="mx-auto h-12 w-12 text-[#227B6B]/40" />
          <h3 className="text-base font-black text-[#0E2924]">No Booked Appointments Found</h3>
          <p className="text-xs font-bold text-[#4B736B]">
            Book a consultation to generate your live OPD SmartQ token.
          </p>
          <button
            type="button"
            onClick={() => router.push('/patient/appointments/book')}
            className="rounded-2xl bg-[#113831] px-6 py-3 text-xs font-black text-white shadow-md hover:bg-[#0E2924]"
          >
            Book Consultation Now
          </button>
        </div>
      )}
    </div>
  );
}
