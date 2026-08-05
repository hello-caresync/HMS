'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { AppointmentService } from '@/lib/services/appointment-service';
import { 
  CalendarDays, 
  Clock, 
  User, 
  CheckCircle2, 
  Calendar, 
  AlertCircle, 
  Search, 
  Loader2, 
  Phone, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  return createSupabaseClient(url, key);
}

interface PatientProfile {
  id: string;
  full_name: string;
  phone: string;
  gender: string;
  dob: string;
  blood_group: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  slot_time: string;
  token_number: number | null;
  status: 'requested' | 'confirmed' | 'rescheduled' | 'cancelled' | 'rejected' | 'checked_in' | 'in_consultation' | 'completed';
  chief_complaint?: string;
  cancellation_reason?: string;
  rescheduled_date?: string;
  rescheduled_time?: string;
  created_at: string;
  patient_profiles?: PatientProfile;
}

export default function DoctorSchedulePage() {
  const supabase = getSupabaseClient();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState(false);

  // Modal States
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // 1. Get Logged In Doctor ID
  useEffect(() => {
    async function getDoctorUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentDoctorId(user.id);
        } else {
          setCurrentDoctorId('d0c10203-0000-0000-0000-000000000000');
        }
      } catch (err) {
        setCurrentDoctorId('d0c10203-0000-0000-0000-000000000000');
      }
    }
    getDoctorUser();
  }, [supabase.auth]);

  // 2. Fetch Appointments
  const fetchAppointments = useCallback(async () => {
    if (!currentDoctorId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient_profiles (
            id,
            full_name,
            phone,
            gender,
            dob,
            blood_group
          )
        `)
        .eq('doctor_id', currentDoctorId)
        .order('slot_time', { ascending: true });

      if (error) {
        console.warn('Supabase query notice:', error.message);
        setNetworkError(true);
        setAppointments([]);
      } else if (data) {
        setAppointments(data as unknown as Appointment[]);
        setNetworkError(false);
      }
    } catch (err: any) {
      console.warn('Caught network exception:', err.message);
      setNetworkError(true);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [currentDoctorId, supabase]);

  // 3. Realtime Listener
  useEffect(() => {
    if (!currentDoctorId) return;

    fetchAppointments();

    try {
      const channel = supabase
        .channel(`doctor-schedule-${currentDoctorId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
            filter: `doctor_id=eq.${currentDoctorId}`
          },
          () => {
            fetchAppointments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Realtime channel subscription notice:', e);
    }
  }, [currentDoctorId, fetchAppointments, supabase]);

  // --- ACTIONS USING AppointmentService ---
  const handleAccept = async (appointmentId: string) => {
    setActionLoadingId(appointmentId);
    try {
      await AppointmentService.acceptAppointment(appointmentId);
      await fetchAppointments();
    } catch (err: any) {
      alert(`Accept action failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget || !newDate || !newTime) return;

    setActionLoadingId(rescheduleTarget.id);
    try {
      await AppointmentService.rescheduleAppointment(rescheduleTarget.id, newDate, newTime);
      setRescheduleTarget(null);
      setNewDate('');
      setNewTime('');
      await fetchAppointments();
    } catch (err: any) {
      alert(`Reschedule failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;

    setActionLoadingId(cancelTarget.id);
    try {
      await AppointmentService.cancelAppointment(cancelTarget.id, cancelReason || 'Doctor unavailable', true);
      setCancelTarget(null);
      setCancelReason('');
      await fetchAppointments();
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredAppointments = appointments.filter((appt) => {
    const matchesDate = !selectedDate || appt.appointment_date === selectedDate;
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'requested' ? appt.status === 'requested' :
      activeTab === 'confirmed' ? (appt.status === 'confirmed' || appt.status === 'checked_in') :
      activeTab === 'rescheduled' ? appt.status === 'rescheduled' :
      activeTab === 'cancelled' ? (appt.status === 'cancelled' || appt.status === 'rejected') :
      activeTab === 'completed' ? appt.status === 'completed' : true;

    const patientName = appt.patient_profiles?.full_name?.toLowerCase() || '';
    const patientPhone = appt.patient_profiles?.phone || '';
    const matchesSearch = patientName.includes(searchQuery.toLowerCase()) || patientPhone.includes(searchQuery);

    return matchesDate && matchesTab && matchesSearch;
  });

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'requested':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Pending Request</span>;
      case 'confirmed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Confirmed</span>;
      case 'checked_in':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">Checked-In</span>;
      case 'rescheduled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D8A657]/20 text-[#482A41] border border-[#D8A657]/40">Rescheduled</span>;
      case 'cancelled':
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">Cancelled/Rejected</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">Completed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {networkError && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <p className="font-bold">Database Connection Notice</p>
              <p className="mt-0.5">Unable to connect to Supabase. Check network or .env.local configuration.</p>
            </div>
          </div>
          <button 
            onClick={fetchAppointments}
            className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 font-semibold rounded-lg text-xs flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#007B8A]/20 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#004D56] flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-[#007B8A]" /> OPD Patient Schedule
          </h1>
          <p className="text-xs text-slate-500 mt-1">Real-time synchronized schedule workstation.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#F0F8F9] px-3 py-2 rounded-xl border border-[#007B8A]/30">
            <Calendar className="w-4 h-4 text-[#007B8A]" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#004D56] focus:outline-none"
            />
          </div>
          <button 
            onClick={() => setSelectedDate('')}
            className="text-xs text-[#007B8A] hover:underline font-semibold"
          >
            Show All
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-2xl border border-[#007B8A]/20 p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-full lg:w-auto text-xs font-medium">
            {[
              { id: 'all', label: 'All Slots' },
              { id: 'requested', label: 'Requests', count: appointments.filter(a => a.status === 'requested').length },
              { id: 'confirmed', label: 'Confirmed', count: appointments.filter(a => a.status === 'confirmed' || a.status === 'checked_in').length },
              { id: 'rescheduled', label: 'Rescheduled' },
              { id: 'cancelled', label: 'Cancelled' },
              { id: 'completed', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-[#004D56] text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-[#004D56] hover:bg-slate-200/50'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    activeTab === tab.id ? 'bg-[#007B8A] text-white' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder="Search by patient name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#007B8A]"
            />
          </div>
        </div>
      </div>

      {/* Roster List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Loader2 className="w-8 h-8 text-[#007B8A] animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Loading schedule...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-[#F0F8F9] rounded-full flex items-center justify-center text-[#007B8A] mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#004D56]">No Appointments Found</h3>
          </div>
        ) : (
          filteredAppointments.map((appt) => (
            <div
              key={appt.id}
              className={`bg-white rounded-2xl p-5 border transition-all shadow-sm hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                appt.status === 'requested' ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#004D56] text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
                  {appt.token_number ? (
                    <>
                      <span className="text-[9px] uppercase font-bold text-[#F0F8F9]/70">Token</span>
                      <span className="text-base font-extrabold text-[#D8A657]">#{appt.token_number}</span>
                    </>
                  ) : (
                    <User className="w-6 h-6 text-[#F0F8F9]" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-slate-900">
                      {appt.patient_profiles?.full_name || 'Patient Record'}
                    </h4>
                    {getStatusBadge(appt.status)}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-[#004D56]">
                      <Clock className="w-3.5 h-3.5 text-[#007B8A]" /> {appt.slot_time} ({appt.appointment_date})
                    </span>
                    {appt.patient_profiles?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {appt.patient_profiles.phone}
                      </span>
                    )}
                  </div>

                  {appt.chief_complaint && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2">
                      <span className="font-semibold text-[#004D56]">Chief Complaint:</span> {appt.chief_complaint}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                {appt.status === 'requested' && (
                  <>
                    <button
                      onClick={() => handleAccept(appt.id)}
                      disabled={actionLoadingId === appt.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      {actionLoadingId === appt.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Accept
                    </button>

                    <button
                      onClick={() => setRescheduleTarget(appt)}
                      disabled={actionLoadingId === appt.id}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-[#004D56] rounded-xl text-xs font-bold"
                    >
                      Reschedule
                    </button>

                    <button
                      onClick={() => setCancelTarget(appt)}
                      disabled={actionLoadingId === appt.id}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#004D56]">Reschedule Appointment</h3>
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">New Date</label>
                <input 
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">New Time</label>
                <input 
                  type="time"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setRescheduleTarget(null)} className="w-1/2 py-2 bg-slate-100 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="w-1/2 py-2 bg-[#007B8A] text-white rounded-xl text-xs font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Reject Request
            </h3>
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Reason for Rejection</label>
                <textarea 
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason..."
                  rows={3}
                  className="w-full p-2.5 border rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setCancelTarget(null)} className="w-1/2 py-2 bg-slate-100 rounded-xl text-xs font-semibold">Back</button>
                <button type="submit" className="w-1/2 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">Confirm Reject</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}