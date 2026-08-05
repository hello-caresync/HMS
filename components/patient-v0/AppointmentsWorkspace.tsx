'use client';

import React, { useState, useEffect } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key);
}

export function AppointmentsWorkspace() {
  const supabase = getSupabaseClient();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Live Queue' | 'History'>('Upcoming');
  const [loading, setLoading] = useState(true);

  const loadAppointments = async () => {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setAppointments(data);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();

    if (!supabase) return;

    // Realtime Listener
    const channel = supabase
      .channel('patient-appointments-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        loadAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="p-6 space-y-6 bg-[#EBE3DB] min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold text-[#3D2638]">Appointments</h1>
        <p className="text-xs text-[#6B5B68] font-medium mt-1">Book, reschedule, and manage your visits</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['Upcoming', 'Live Queue', 'History'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === tab
                ? 'bg-[#4A2E44] text-white shadow-sm'
                : 'bg-white/80 text-[#3D2638] hover:bg-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Appointment List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-[#6B5B68]">Syncing with Hospital Database...</div>
        ) : appointments.length === 0 ? (
          <div className="p-8 bg-white/90 rounded-3xl text-center text-xs font-bold text-[#6B5B68]">
            No live appointments found.
          </div>
        ) : (
          appointments.map((app) => (
            <div key={app.id} className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100/60 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-extrabold text-[#2C1D2A]">{app.doctor_name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{app.department} · Token {app.token_no}</p>
                </div>
                <span className="px-3 py-1 bg-amber-100/80 text-amber-900 text-[10px] font-black rounded-full uppercase tracking-wider">
                  {app.status}
                </span>
              </div>

              <div className="text-xs font-semibold text-slate-700 flex items-center gap-4">
                <span>📅 {app.appointment_date}</span>
                <span>⏰ {app.appointment_time}</span>
              </div>

              <p className="text-xs text-slate-600 font-medium">{app.reason}</p>
              <p className="text-xs font-extrabold text-slate-800">Est. ₹{app.estimated_fee}</p>

              <div className="flex gap-2 pt-2">
                <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl">
                  Live Queue
                </button>
                <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl">
                  View Doctor
                </button>
                <button 
                  onClick={async () => {
                    if (supabase) {
                      await supabase.from('appointments').update({ status: 'CANCELLED' }).eq('id', app.id);
                    }
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AppointmentsWorkspace;