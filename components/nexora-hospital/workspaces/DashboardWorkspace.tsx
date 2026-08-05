'use client';

import React, { useState, useEffect } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  return createSupabaseClient(url, key);
}

export function DashboardWorkspace() {
  const supabase = getSupabaseClient();
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    async function loadAppointments() {
      const { data } = await supabase.from('appointments').select('*').order('created_at', { ascending: false });
      if (data) setAppointments(data);
    }

    loadAppointments();

    const channel = supabase
      .channel('admin-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        loadAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[#004D56]">Hospital Executive Workspace</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time synchronized hospital operations control center.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-[#004D56]">Central Master Appointments ({appointments.length})</h3>
        
        <div className="space-y-2">
          {appointments.map((app) => (
            <div key={app.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="font-extrabold text-[#007B8A] mr-2">{app.token_no}</span>
                <span className="font-bold text-slate-900">{app.patient_name}</span>
                <span className="text-slate-500 ml-2">({app.doctor_name} - {app.department})</span>
              </div>
              <span className="font-bold text-slate-700">{app.appointment_date} {app.appointment_time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardWorkspace;