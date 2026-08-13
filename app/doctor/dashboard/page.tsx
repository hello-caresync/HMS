'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  getDoctorDashboardData,
  updateAppointmentStatus,
  DoctorDashboardMetrics,
  DoctorAppointment,
} from '@/lib/doctor/command-center/supabase-service';
import SmartQCommandCenter from '@/components/doctor/SmartQCommandCenter';

export default function DoctorDashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DoctorDashboardMetrics>({
    todaysOpd: 0,
    waitingQueue: 0,
    completed: 0,
    inConsultation: 0,
    criticalAlerts: 0,
    appointmentsList: [],
    liveQueueTokens: [],
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch initial dashboard metrics and lists
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDoctorDashboardData();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load doctor dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    // Subscribe to real-time changes on appointments and opd_tokens
    const supabase = createClient();
    const channel = supabase
      .channel('doctor-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          console.log('Realtime appointment event received — refreshing dashboard...');
          void loadDashboardData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'opd_tokens' },
        () => {
          console.log('Realtime OPD token event received — refreshing queue...');
          void loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadDashboardData]);

  const handleStartConsultation = async (appointmentId: string) => {
    try {
      setUpdatingId(appointmentId);
      await updateAppointmentStatus(appointmentId, 'IN_CONSULTATION');
      router.push(`/doctor/consultations/${appointmentId}`);
    } catch (error) {
      console.error(`Failed to start consultation for ${appointmentId}:`, error);
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle appointment status transitions
  const handleStatusUpdate = async (appointmentId: string, nextStatus: string) => {
    try {
      setUpdatingId(appointmentId);
      await updateAppointmentStatus(appointmentId, nextStatus);
      await loadDashboardData();
    } catch (error) {
      console.error(`Failed to update status for appointment ${appointmentId}:`, error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 bg-slate-50 p-5 min-h-screen font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase">
            Clinical Command Center
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Good Afternoon, Dr. CHANDRAKANTH S KESARI
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            General Surgery • Wednesday, 12 August 2026
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
          <button
            onClick={() => loadDashboardData()}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Counters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">TODAY&apos;S OPD</span>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {loading ? '-' : metrics.todaysOpd}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">WAITING QUEUE</span>
          <p className="text-3xl font-bold text-amber-600 mt-2">
            {loading ? '-' : metrics.waitingQueue}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">IN CONSULTATION</span>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {loading ? '-' : metrics.inConsultation}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">COMPLETED</span>
          <p className="text-3xl font-bold text-emerald-600 mt-2">
            {loading ? '-' : metrics.completed}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">CRITICAL ALERTS</span>
          <p className="text-3xl font-bold text-rose-600 mt-2">
            {loading ? '-' : metrics.criticalAlerts}
          </p>
        </div>
      </div>

      {/* SmartQ Live Queue + Action Bar */}
      <SmartQCommandCenter
        doctorId={metrics.doctorId}
        queueTokens={metrics.liveQueueTokens}
        waitingCount={metrics.waitingQueue}
        completedCount={metrics.completed}
        loading={loading}
        onRefresh={() => void loadDashboardData()}
      />

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Today&apos;s Appointments</h2>
              <span className="text-xs text-slate-500 font-medium">
                {metrics.appointmentsList.length} Scheduled
              </span>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500 py-8 text-center">Loading appointments...</p>
            ) : metrics.appointmentsList.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                No appointments for today. Patient bookings appear here in real time.
              </p>
            ) : (
              <div className="space-y-4">
                {metrics.appointmentsList.map((app: DoctorAppointment) => (
                  <div
                    key={app.appointment_id}
                    className="p-4 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900">
                          {app.patient_name || 'Patient'}
                        </span>
                        {app.token_number && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-slate-200 text-slate-800 rounded">
                            {app.token_number}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${
                            app.status === 'confirmed' || app.status === 'SCHEDULED' || app.status === 'WAITING'
                              ? 'bg-amber-100 text-amber-800'
                              : app.status === 'IN_CONSULTATION' || app.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : app.status === 'COMPLETED' || app.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5">
                        Time: <span className="font-medium text-slate-700">{app.appointment_time || 'N/A'}</span> | Reason:{' '}
                        <span className="font-medium text-slate-700">{app.reason || 'General Consultation'}</span>
                      </p>
                    </div>

                    {/* Interactive Action Controls */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {(app.status === 'SCHEDULED' || app.status === 'WAITING' || app.status === 'confirmed') && (
                        <button
                          disabled={updatingId === app.appointment_id}
                          onClick={() => handleStartConsultation(app.appointment_id)}
                          className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm transition-colors disabled:opacity-50"
                        >
                          Start Consultation
                        </button>
                      )}

                      {(app.status === 'IN_CONSULTATION' || app.status === 'in_progress') && (
                        <button
                          disabled={updatingId === app.appointment_id}
                          onClick={() => router.push(`/doctor/consultations/${app.appointment_id}`)}
                          className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm transition-colors disabled:opacity-50"
                        >
                          Open Workspace
                        </button>
                      )}

                      {(app.status === 'IN_CONSULTATION' || app.status === 'in_progress') && (
                        <button
                          disabled={updatingId === app.appointment_id}
                          onClick={() => handleStatusUpdate(app.appointment_id, 'COMPLETED')}
                          className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors disabled:opacity-50"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}