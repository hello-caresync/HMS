'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Stethoscope,
  Users,
  Megaphone,
} from 'lucide-react';
import { getDoctorSession } from '@/lib/doctor/session';
import { setDoctorAvailability } from '@/lib/doctor/command-center/doctor-context';
import {
  useAuthenticatedDoctor,
  useDoctorDashboardRealtime,
  useDoctorAppointmentsRealtime,
  useEmergencyAlertsRealtime,
  useCallNextPatient,
} from '@/lib/doctor/command-center/hooks';
import type { DoctorDashboardMetrics } from '@/lib/doctor/command-center/supabase-service';
import { TodaysAppointments } from './TodaysAppointments';
import { useCommandCenterStore } from '@/lib/doctor/command-center/store';
import { ccClasses } from '@/lib/doctor/command-center/theme';
import { KpiCard } from './KpiCard';
import { QueueDrawer } from './QueueDrawer';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function statusBadge(status: string) {
  if (status === 'IN_CONSULTATION') return 'bg-[#2A9D8F]/15 text-[#2A9D8F]';
  if (status === 'CALLED') return 'bg-[#20639B]/15 text-[#20639B]';
  if (status === 'ISSUED') return 'bg-[#E8F1F8] text-[#173F5F]';
  return 'bg-[#5A7A94]/10 text-[#5A7A94]';
}

export type CommandCenterDashboardProps = {
  metrics?: DoctorDashboardMetrics;
  metricsLoading?: boolean;
  onRefreshMetrics?: () => void;
  metricsFetching?: boolean;
};

export function CommandCenterDashboard(props: CommandCenterDashboardProps) {
  const {
    metrics: metricsProp,
    metricsLoading: metricsLoadingProp,
    onRefreshMetrics,
    metricsFetching,
  } = props;
  const router = useRouter();
  const session = getDoctorSession();
  const doctorName = session.fullName || session.doctor_name;

  const isOnline = useCommandCenterStore((s) => s.isOnline);
  const setOnline = useCommandCenterStore((s) => s.setOnline);
  const setQueueDrawerOpen = useCommandCenterStore((s) => s.setQueueDrawerOpen);

  const { data: authDoctor } = useAuthenticatedDoctor();

  const {
    data: dashboard,
    resolvedDoctorId: sessionDoctorId = '',
    isLoading,
    refetch,
    isFetching,
  } = useDoctorDashboardRealtime(session.employeeId, doctorName, session.email);

  const activeDoctorId = authDoctor?.doctor_id ?? sessionDoctorId ?? metricsProp?.doctorId ?? '';
  const metrics = metricsProp;
  const metricsLoading = metricsLoadingProp ?? false;

  const {
    data: todaysAppointments = [],
    isLoading: appointmentsLoading,
    refetch: refetchAppointments,
  } = useDoctorAppointmentsRealtime(activeDoctorId || '');

  const callNextMutation = useCallNextPatient(activeDoctorId || '');

  const { data: alerts = [] } = useEmergencyAlertsRealtime(activeDoctorId || '');

  const tokens = dashboard?.liveQueueList ?? [];
  const queueTokens = metrics?.liveQueueTokens ?? [];
  const kpis = {
    todaysOpd: metrics?.todaysOpd ?? dashboard?.todaysOpd ?? 0,
    waiting: metrics?.waitingQueue ?? dashboard?.waitingQueue ?? 0,
    completed: metrics?.completed ?? tokens.filter((t) => t.status === 'COMPLETED').length,
    pendingFollowUps: metrics?.inConsultation ?? tokens.filter((t) => t.status === 'IN_CONSULTATION').length,
    criticalAlerts: metrics?.criticalAlerts ?? alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length,
  };
  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');
  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE');
  const active =
    tokens.find((t) => t.status === 'IN_CONSULTATION') || tokens.find((t) => t.status === 'CALLED');

  const handleToggleOnline = async () => {
    const next = !isOnline;
    setOnline(next);
    if (activeDoctorId) await setDoctorAvailability(activeDoctorId, next);
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {criticalAlerts.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-[#D9534F]/30 bg-[#D9534F]/10 px-5 py-4 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[#D9534F]" />
            <div>
              <p className="text-sm font-black text-[#D9534F]">
                {criticalAlerts.length} CRITICAL SOS alert(s)
              </p>
              <p className="text-xs font-semibold text-[#173F5F]/70">Immediate clinical response required</p>
            </div>
          </div>
          <Link href="/doctor/emergency/" className={ccClasses.btnPrimary}>
            Open SOS Center
          </Link>
        </div>
      )}

      <header className={`flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between ${ccClasses.card}`}>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#2A9D8F]">Clinical Command Center</p>
          <h1 className="mt-1 text-2xl font-black text-[#173F5F]">
            {greeting()}, Dr. {session.fullName || session.doctor_name}
          </h1>
          <p className="mt-1 text-sm font-semibold text-[#5A7A94]">
            {session.department} · {today}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleToggleOnline()}
            className={`rounded-full px-4 py-2 text-xs font-black ${
              isOnline ? 'bg-[#2E8B70]/15 text-[#2E8B70]' : 'bg-[#E9A23B]/15 text-[#E9A23B]'
            }`}
          >
            {isOnline ? '● Online' : '○ Offline'}
          </button>
          <button type="button" onClick={() => setQueueDrawerOpen(true)} className={ccClasses.btnGhost}>
            <Users className="h-4 w-4" /> Live Queue
          </button>
          <button type="button" onClick={() => { void refetch(); onRefreshMetrics?.(); }} disabled={isFetching || metricsFetching} className={ccClasses.btnGhost}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Today's OPD" value={kpis.todaysOpd} icon={Calendar} />
        <KpiCard label="Waiting Queue" value={kpis.waiting} icon={Clock} tone="warning" />
        <KpiCard label="Completed" value={kpis.completed} icon={CheckCircle2} tone="success" />
        <KpiCard label="In Consultation" value={kpis.pendingFollowUps} icon={Bell} />
        <KpiCard label="Critical Alerts" value={kpis.criticalAlerts} icon={AlertTriangle} tone="critical" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TodaysAppointments
          appointments={todaysAppointments}
          isLoading={appointmentsLoading}
          onRefresh={() => void refetchAppointments()}
        />

        <div className={`p-6 ${ccClasses.card}`}>
          <div className="flex items-center justify-between">
            <h2 className="font-black text-[#173F5F]">SmartQ Live OPD Queue</h2>
            <button
              type="button"
              disabled={callNextMutation.isPending || !activeDoctorId}
              onClick={() => void callNextMutation.mutateAsync()}
              className={ccClasses.btnAccent}
            >
              <Megaphone className="mr-1 inline h-4 w-4" />
              Call Next Patient
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {(queueTokens.length ? queueTokens : tokens).slice(0, 8).map((t, index) => {
              const raw = t as Record<string, unknown>;
              const profile = raw.patient_profiles as Record<string, unknown> | Record<string, unknown>[] | undefined;
              const p = Array.isArray(profile) ? profile[0] : profile;
              const tokenNum = String(raw.token_number ?? (t as { token_number?: string }).token_number ?? index + 1);
              const patientName = String(p?.full_name ?? (t as { patient_name?: string }).patient_name ?? 'Patient');
              const tokenStatus = String(raw.status ?? (t as { status?: string }).status ?? 'ISSUED');
              const wait = raw.estimated_wait_minutes ?? (t as { estimated_wait_minutes?: number }).estimated_wait_minutes;
              const key = String(raw.id ?? (t as { id?: string }).id ?? index);

              return (
              <div key={key} className="flex items-center justify-between rounded-xl bg-[#F6F9FB] px-3 py-2">
                <div>
                  <p className="text-xs font-black text-[#173F5F]">
                    #{tokenNum} · {patientName}
                  </p>
                  {wait != null && (
                    <p className="text-[10px] font-semibold text-[#5A7A94]">
                      ~{wait} min wait
                    </p>
                  )}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${statusBadge(tokenStatus)}`}>
                  {tokenStatus}
                </span>
              </div>
            );})}
            {!tokens.length && (
              <p className="text-sm font-semibold text-[#5A7A94]">Queue empty — waiting for patient bookings.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`p-6 ${ccClasses.card}`}>
          <div className="flex items-center gap-2 text-sm font-black text-[#20639B]">
            <Stethoscope className="h-4 w-4" /> Now Consulting
          </div>
          {isLoading ? (
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#5A7A94]">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : active ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-[#E8F1F8] px-3 py-1 text-sm font-black text-[#173F5F]">
                  Token #{active.token_number}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2A9D8F]">
                  <Activity className="h-3 w-3 animate-pulse" /> {active.status.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-xl font-black text-[#173F5F]">{active.patient_name}</h2>
              <p className="text-sm font-semibold text-[#5A7A94]">
                {active.age ?? '—'} yrs · {active.gender ?? '—'} · BG {active.blood_group || '—'}
              </p>
              <p className="text-sm font-semibold text-[#173F5F]">
                {active.chief_complaint || 'General consultation'}
              </p>
              <button
                type="button"
                onClick={() =>
                  router.push(`/doctor/consultations/${active.appointment_id || active.id}/`)
                }
                className={ccClasses.btnAccent}
              >
                Open EMR Workspace
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm font-semibold text-[#5A7A94]">
              No active consultation. Call the next patient from SmartQ.
            </p>
          )}
        </div>

        <div className={`p-6 ${ccClasses.card}`}>
          <div className="flex items-center justify-between">
            <h2 className="font-black text-[#173F5F]">Live Queue Sidebar</h2>
            <Link href="/doctor/queue/" className="text-xs font-bold text-[#20639B] underline">
              SmartQ Engine
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {tokens.slice(0, 5).map((t) => (
              <div key={`sidebar-${t.id}`} className="flex items-center justify-between rounded-xl bg-[#F6F9FB] px-3 py-2">
                <div>
                  <p className="text-xs font-black text-[#173F5F]">
                    #{t.token_number} · {t.patient_name}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${statusBadge(t.status)}`}>
                  {t.status}
                </span>
              </div>
            ))}
            {!tokens.length && (
              <p className="text-sm font-semibold text-[#5A7A94]">No tokens in sidebar queue.</p>
            )}
          </div>
        </div>
      </div>

      <QueueDrawer tokens={tokens} />
    </div>
  );
}

export default CommandCenterDashboard;
