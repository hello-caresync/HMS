'use client';

import React, { useState, useEffect } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { AlertTriangle, RefreshCw, Calendar, Search } from 'lucide-react';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createSupabaseClient(url, key);
}

const SAMPLE_SCHEDULE = [
  {
    id: '1',
    token_no: 'C-041',
    patient_name: 'Ananya Roy',
    patient_age: 32,
    patient_gender: 'Female',
    doctor_name: 'Dr. Aishwarya D S',
    department: 'General Medicine',
    appointment_date: '2026-08-05',
    appointment_time: '09:45:00',
    reason: 'Routine Health Checkup',
    status: 'IN_CONSULTATION',
  },
  {
    id: '2',
    token_no: 'C-042',
    patient_name: 'P. Nandini',
    patient_age: 28,
    patient_gender: 'Female',
    doctor_name: 'Dr. Aishwarya D S',
    department: 'General Medicine',
    appointment_date: '2026-08-05',
    appointment_time: '10:00:00',
    reason: 'Post-surgery review & fever',
    status: 'WAITING',
  },
  {
    id: '3',
    token_no: 'C-051',
    patient_name: 'Aishwarya D S',
    patient_age: 24,
    patient_gender: 'Female',
    doctor_name: 'Dr. Aishwarya D S',
    department: 'General Medicine',
    appointment_date: '2026-08-09',
    appointment_time: '15:30:00',
    reason: 'cold',
    status: 'REQUESTED',
  },
];

export default function OPDPatientSchedule() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All Slots');
  const [searchTerm, setSearchTerm] = useState('');

  const loadScheduleData = async () => {
    setLoading(true);
    setConnectionError(false);

    const supabase = getSupabaseClient();

    if (!supabase) {
      console.warn('Supabase credentials missing in .env.local. Loaded fallback schedule.');
      setConnectionError(true);
      setAppointments(SAMPLE_SCHEDULE);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setAppointments(data);
      } else {
        setAppointments(SAMPLE_SCHEDULE);
      }
    } catch (err: any) {
      console.warn('Supabase connection error:', err?.message || err);
      setConnectionError(true);
      setAppointments(SAMPLE_SCHEDULE); // Fallback to display mock UI instead of getting stuck
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScheduleData();
  }, []);

  const filteredAppointments = appointments.filter((item) => {
    const matchesSearch =
      item.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.token_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.doctor_name.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedFilter === 'All Slots') return matchesSearch;
    if (selectedFilter === 'Requests') return matchesSearch && item.status === 'REQUESTED';
    if (selectedFilter === 'Confirmed') return matchesSearch && (item.status === 'WAITING' || item.status === 'IN_CONSULTATION');
    if (selectedFilter === 'Completed') return matchesSearch && item.status === 'COMPLETED';
    if (selectedFilter === 'Cancelled') return matchesSearch && item.status === 'CANCELLED';

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F0F8F9] p-6 space-y-6">
      
      {/* Database Connection Notice Banner */}
      {connectionError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-xs">Database Connection Notice</h4>
              <p className="text-[11px] text-amber-700">
                Unable to connect to Supabase. Displaying local fallback data. Check network or <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px]">.env.local</code> configuration.
              </p>
            </div>
          </div>
          <button
            onClick={loadScheduleData}
            className="px-3.5 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Title Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#004D56] flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#007B8A]" /> OPD Patient Schedule
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time synchronized schedule workstation.</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            defaultValue="2026-08-05"
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          />
          <button onClick={() => setSelectedFilter('All Slots')} className="text-xs font-extrabold text-[#007B8A] hover:underline">
            Show All
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap gap-1.5">
          {['All Slots', 'Requests', 'Confirmed', 'Rescheduled', 'Cancelled', 'Completed'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedFilter === filter
                  ? 'bg-[#004D56] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by patient name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#007B8A]"
          />
        </div>
      </div>

      {/* Schedule Table / List Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-[#007B8A] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-bold">Loading schedule...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-400">
            No appointments found for the selected filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAppointments.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-[#007B8A]/40 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="px-3.5 py-2.5 bg-[#004D56] text-white font-black text-xs rounded-xl shadow-sm">
                    {item.token_no}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900">{item.patient_name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Doctor: <span className="font-bold text-slate-700">{item.doctor_name}</span> • {item.reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800">{item.appointment_date}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{item.appointment_time}</p>
                  </div>

                  <span
                    className={`px-3 py-1 text-[10px] font-black rounded-lg ${
                      item.status === 'REQUESTED'
                        ? 'bg-amber-100 text-amber-800'
                        : item.status === 'IN_CONSULTATION'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}