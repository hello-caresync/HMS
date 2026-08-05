'use client';

import React, { useState, useEffect } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  return createSupabaseClient(url, key);
}

export function DoctorDashboardWorkspace() {
  const supabase = getSupabaseClient();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true });

    if (data) {
      setAppointments(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();

    // Setup Supabase Realtime Listener for instant synchronization
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          fetchAppointments(); // Re-fetch as soon as patient books
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[#004D56]">Welcome, Dr. Aishwarya D S</h1>
          <p className="text-xs text-slate-500 font-medium">General Medicine • Room 302</p>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
          Realtime Sync Active
        </span>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-[#004D56] text-sm">
            Live Appointments ({appointments.length})
          </h3>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 font-bold p-4 text-center">Syncing with database...</p>
        ) : appointments.length === 0 ? (
          <p className="text-xs text-slate-400 font-bold p-4 text-center">No appointments booked yet.</p>
        ) : (
          <div className="space-y-3">
            {appointments.map((app) => (
              <div key={app.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-2 bg-[#004D56] text-white font-black text-xs rounded-xl">
                    {app.token_no}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{app.patient_name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Reason: {app.reason} • {app.appointment_date} at {app.appointment_time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg ${
                    app.status === 'REQUESTED' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {app.status}
                  </span>
                  
                  <button 
                    onClick={async () => {
                      await supabase.from('appointments').update({ status: 'IN_CONSULTATION' }).eq('id', app.id);
                    }}
                    className="px-3 py-1.5 bg-[#007B8A] text-white rounded-xl text-xs font-bold"
                  >
                    Start Visit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorDashboardWorkspace;