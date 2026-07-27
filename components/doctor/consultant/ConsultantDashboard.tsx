'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Bot,
  CalendarClock,
  ChevronRight,
  FlaskConical,
  MessageSquare,
  ScanLine,
  Stethoscope,
  Users,
} from 'lucide-react';

import { ClinicalPageSkeleton } from '@/components/doctor/ClinicalSkeleton';
import { LiveIndicator, MetricTile, WorkspaceHeader } from '@/components/doctor/primitives/WorkspacePrimitives';
import { useDoctorShell } from '@/components/doctor/shell/DoctorShellContext';
import {
  useCalendarEvents,
  useEmergencyCases,
  useIpdAdmissions,
  useNotificationsFeed,
  useOpdQueue,
} from '@/lib/doctor/hooks/useClinicalQueries';
import { useCareCenterInsights } from '@/lib/doctor/hooks/useCareCenter';
import { nxUi } from '@/lib/doctor/design-system';
import { MOCK_CHAT_MESSAGES } from '@/lib/mock-data';

function WorkflowRailItem({
  step,
  title,
  meta,
  href,
  primary,
  urgent,
}: {
  step: string;
  title: string;
  meta: string;
  href: string;
  primary?: boolean;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`${nxUi.cardInteractive} flex items-center gap-4 p-4 ${urgent ? 'border-l-[3px] border-l-[#DC2626]' : ''}`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
          primary ? 'bg-[#1C1B18] text-white' : 'bg-[#F3F2ED] text-[#6B6860]'
        }`}
      >
        {step}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-[#1C1B18]">{title}</p>
        <p className="truncate text-[12px] text-[#6B6860]">{meta}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#9C9890]" aria-hidden />
    </Link>
  );
}

export default function ConsultantDashboard() {
  const { setAiOpen } = useDoctorShell();
  const { data: queueData, isLoading } = useOpdQueue();
  const { data: ipdData } = useIpdAdmissions();
  const { data: erData } = useEmergencyCases();
  const { data: notifData } = useNotificationsFeed();
  const { data: calData } = useCalendarEvents();
  const { data: insightsData } = useCareCenterInsights();

  const queue = queueData?.queue ?? [];
  const current = queue[0];
  const ipd = ipdData?.admissions ?? [];
  const icu = ipd.filter((a) => a.ward?.toUpperCase().includes('ICU')).length;
  const criticalEr = (erData?.cases ?? []).filter((c) => c.esiLevel <= 2);
  const unread = (notifData?.notifications ?? []).filter((n) => !n.acknowledged).length;
  const insights = insightsData?.insights;
  const nextEvent = calData?.events?.[0];

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  if (isLoading) return <ClinicalPageSkeleton rows={4} />;

  return (
    <div className={nxUi.page}>
      <WorkspaceHeader
        eyebrow="Command center"
        title={`${greeting} — clinical day overview`}
        description="One screen for queue, ward census, critical alerts, and your next clinical action. No admin noise."
        actions={
          <>
            <LiveIndicator label="Real-time sync" />
            <Link href="/doctor/care-center" className={nxUi.btnPrimary}>
              <Stethoscope className="h-4 w-4" aria-hidden />
              Open Care Center
            </Link>
          </>
        }
      />

      {/* Primary KPIs — data-driven */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <MetricTile
          label="OPD queue"
          value={queue.length}
          sub="Waiting now"
          accent={queue.length > 5 ? 'warning' : 'live'}
          icon={Users}
        />
        <MetricTile label="Inpatients" value={ipd.length} sub={`${icu} in ICU`} icon={BedDouble} />
        <MetricTile
          label="Critical alerts"
          value={unread + criticalEr.length}
          accent={criticalEr.length > 0 ? 'critical' : 'default'}
          sub="ER · labs · system"
          icon={AlertTriangle}
        />
        <MetricTile
          label="Seen today"
          value={insights?.patientsSeenToday ?? '—'}
          sub={`Avg ${insights?.avgConsultMinutes ?? 14}m consult`}
          icon={Activity}
        />
        <MetricTile label="Lab orders" value={insights?.labOrders ?? 0} sub="Today" icon={FlaskConical} />
        <MetricTile label="Satisfaction" value={`${insights?.patientSatisfaction ?? 4.8}`} sub="/ 5.0" icon={Stethoscope} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Workflow rail — doctor's actual day */}
        <section className="space-y-3 xl:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#9C9890]">Your workflow</h2>
            <Link href="/doctor/schedule" className="text-[12px] font-semibold text-[#7A7558] hover:underline">
              Full schedule →
            </Link>
          </div>

          {current && (
            <div className={`${nxUi.shellGlass} border-l-[3px] border-l-[#10B981] p-4`}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Next patient · ready</p>
              <p className="mt-1 text-[18px] font-semibold text-[#1C1B18]">{current.patientName}</p>
              <p className="text-[12px] text-[#6B6860]">
                {current.token} · {current.chiefComplaint} · {current.waitMinutes}m wait
              </p>
              <div className="mt-3 flex gap-2">
                <Link href="/doctor/care-center" className={nxUi.btnPrimary}>
                  Start consultation
                </Link>
                <Link href={`/doctor/patients?patient=${current.patientId}`} className={nxUi.btnSecondary}>
                  Open chart
                </Link>
              </div>
            </div>
          )}

          <WorkflowRailItem
            step="1"
            title="OPD / IPD Care Center"
            meta={`${queue.length} in queue · ${ipd.length} inpatients`}
            href="/doctor/care-center"
            primary
          />
          <WorkflowRailItem
            step="2"
            title={nextEvent?.title ?? 'Review today\'s schedule'}
            meta={nextEvent ? `${new Date(nextEvent.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${nextEvent.location}` : 'Calendar sync active'}
            href="/doctor/schedule"
          />
          <WorkflowRailItem step="3" title="Orders & results" meta="Lab · radiology · prescriptions" href="/doctor/orders" />
          <WorkflowRailItem step="4" title="Communication hub" meta="Nursing · lab · pharmacy channels" href="/doctor/communication" />

          {criticalEr.map((c) => (
            <WorkflowRailItem
              key={c.id}
              step="!"
              title={`ESI ${c.esiLevel} · ${c.patientName}`}
              meta={c.presentation}
              href="/doctor/emergency"
              urgent
            />
          ))}
        </section>

        {/* Live queue */}
        <section className="xl:col-span-4">
          <div className={`${nxUi.shell} p-4`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#9C9890]">Live OPD queue</h2>
              <Link href="/doctor/care-center" className="text-[12px] font-semibold text-[#7A7558]">
                Manage →
              </Link>
            </div>
            {queue.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-[#6B6860]">Queue empty — patients appear on check-in.</p>
            ) : (
              <ul className="space-y-2">
                {queue.slice(0, 6).map((q, i) => (
                  <li
                    key={q.id}
                    className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${
                      i === 0 ? 'bg-[#F3F2ED]' : 'hover:bg-[#FAFAF8]'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tabular-nums text-[#9C9890]">
                        {q.token} · {q.waitMinutes}m
                      </p>
                      <p className="truncate text-[13px] font-semibold">{q.patientName}</p>
                      <p className="truncate text-[11px] text-[#6B6860]">{q.chiefComplaint}</p>
                    </div>
                    <Link href="/doctor/care-center" className={nxUi.btnSecondary + ' shrink-0 !px-2.5 !py-1.5 text-[11px]'}>
                      Start
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={`${nxUi.shell} mt-4 p-4`}>
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#9C9890]">Quick orders</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: 'Lab STAT', href: '/doctor/orders?tab=lab', icon: FlaskConical },
                { label: 'Imaging', href: '/doctor/orders?tab=rad', icon: ScanLine },
                { label: 'Teleconsult', href: '/doctor/communication?tab=tele', icon: MessageSquare },
                { label: 'Schedule', href: '/doctor/schedule', icon: CalendarClock },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href} className={`${nxUi.cardInteractive} flex items-center gap-2 p-3 text-[12px] font-semibold`}>
                  <Icon className="h-4 w-4 text-[#7A7558]" aria-hidden />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Intelligence column */}
        <aside className="space-y-4 xl:col-span-3">
          <div className={`${nxUi.shellGlass} p-4`}>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-[#7A7558]" aria-hidden />
              <h2 className="text-[13px] font-semibold text-[#1C1B18]">Clinical intelligence</h2>
            </div>
            <ul className="mt-3 space-y-2">
              {[
                { text: 'Review K+ 5.8 before next ICU round', type: 'critical' },
                { text: '2 progress notes pending signature', type: 'warning' },
                { text: 'Follow-up rate 82% — above target', type: 'info' },
              ].map((item) => (
                <li
                  key={item.text}
                  className={`rounded-lg px-3 py-2 text-[12px] font-medium ${
                    item.type === 'critical'
                      ? 'bg-red-50 text-red-800'
                      : item.type === 'warning'
                        ? 'bg-amber-50 text-amber-900'
                        : 'bg-[#F3F2ED] text-[#3D3C36]'
                  }`}
                >
                  {item.text}
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setAiOpen(true)} className={`${nxUi.btnPrimary} mt-3 w-full`}>
              Open AI Copilot
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className={`${nxUi.shell} p-4`}>
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#9C9890]">Messages</h2>
            <ul className="mt-2 space-y-2">
              {MOCK_CHAT_MESSAGES.slice(0, 3).map((m) => (
                <li key={m.id} className="rounded-lg px-2 py-1.5 hover:bg-[#F3F2ED]">
                  <p className="text-[12px] font-semibold">{m.sender}</p>
                  <p className="truncate text-[11px] text-[#6B6860]">{m.body}</p>
                </li>
              ))}
            </ul>
            <Link href="/doctor/communication" className="mt-2 block text-[12px] font-semibold text-[#7A7558] hover:underline">
              Open communication hub →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
