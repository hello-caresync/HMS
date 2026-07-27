'use client';

import { AlertTriangle, Bot, Building2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import CareCenterConsultationDrawer from '@/components/doctor/care-center/CareCenterConsultationDrawer';
import CareCenterFilters from '@/components/doctor/care-center/CareCenterFilters';
import CareCenterInsightsStrip from '@/components/doctor/care-center/CareCenterInsightsStrip';
import CareCenterIpdDrawer from '@/components/doctor/care-center/CareCenterIpdDrawer';
import CareCenterIpdPanel from '@/components/doctor/care-center/CareCenterIpdPanel';
import CareCenterOpdPanel from '@/components/doctor/care-center/CareCenterOpdPanel';
import { LiveIndicator, WorkspaceHeader } from '@/components/doctor/primitives/WorkspacePrimitives';
import { nxUi } from '@/lib/doctor/design-system';
import { useCareCenterStore } from '@/lib/doctor/stores/care-center-store';

const AI_ALERTS = [
  { text: 'Drug interaction: Metformin + contrast — review before CT', severity: 'warning' as const },
  { text: 'K+ 5.8 · ICU Bed 3 · critical lab', severity: 'critical' as const },
  { text: '2 progress notes pending signature', severity: 'warning' as const },
  { text: 'CHF patient · elevated readmission risk', severity: 'info' as const },
];

function CareCenterWorkspaceInner() {
  const searchParams = useSearchParams();
  const activeTab = useCareCenterStore((s) => s.activeTab);
  const setTab = useCareCenterStore((s) => s.setTab);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'ipd' || tab === 'opd') setTab(tab);
  }, [searchParams, setTab]);

  return (
    <div className={nxUi.page}>
      <WorkspaceHeader
        eyebrow="Clinical workspace"
        title="OPD / IPD Care Center"
        description="Manage outpatient encounters and inpatient care from one workstation — queue, consult, round, discharge."
        actions={<LiveIndicator label="Queue sync active" />}
      />

      <CareCenterInsightsStrip />

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className={nxUi.segmentTrack}>
            {(['opd', 'ipd'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setTab(tab)}
                className={activeTab === tab ? nxUi.segmentActive : nxUi.segmentIdle}
              >
                {tab === 'opd' ? 'Outpatient' : 'Inpatient'}
              </button>
            ))}
          </div>

          <CareCenterFilters />
          {activeTab === 'opd' ? <CareCenterOpdPanel /> : <CareCenterIpdPanel />}
        </div>

        <aside className="space-y-3">
          <div className={`${nxUi.shell} p-4`}>
            <p className="flex items-center gap-2 text-[12px] font-semibold text-[#1C1B18]">
              <Bot className="h-4 w-4 text-[#7A7558]" aria-hidden />
              Clinical intelligence
            </p>
            <ul className="mt-3 space-y-2">
              {AI_ALERTS.map((a) => (
                <li
                  key={a.text}
                  className={`flex gap-2 rounded-lg px-3 py-2 text-[11px] font-medium ${
                    a.severity === 'critical'
                      ? 'bg-red-50 text-red-800'
                      : a.severity === 'warning'
                        ? 'bg-amber-50 text-amber-900'
                        : 'bg-[#F3F2ED] text-[#3D3C36]'
                  }`}
                >
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                  {a.text}
                </li>
              ))}
            </ul>
          </div>

          <div className={`${nxUi.shell} p-4`}>
            <p className="flex items-center gap-2 text-[12px] font-semibold text-[#1C1B18]">
              <Building2 className="h-4 w-4 text-[#7A7558]" aria-hidden />
              Event orchestration
            </p>
            <ol className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-[#6B6860]">
              <li>Check-in → Queue → Notify doctor</li>
              <li>Consult → EMR sync → Pharmacy</li>
              <li>Lab order → Result → Alert</li>
              <li>Admission → Bed → Nursing</li>
              <li>Discharge → Billing → Patient app</li>
            </ol>
          </div>

          <div className={`${nxUi.shell} p-4`}>
            <p className="flex items-center gap-2 text-[12px] font-semibold text-[#1C1B18]">
              <Sparkles className="h-4 w-4 text-[#7A7558]" aria-hidden />
              Quick links
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              <Link href="/doctor/communication" className={nxUi.btnSecondary + ' text-center text-[12px]'}>
                Communication hub
              </Link>
              <Link href="/doctor/orders" className={nxUi.btnSecondary + ' text-center text-[12px]'}>
                Orders & prescriptions
              </Link>
              <Link href="/doctor/documents" className={nxUi.btnSecondary + ' text-center text-[12px]'}>
                Documents
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <CareCenterConsultationDrawer />
      <CareCenterIpdDrawer />
    </div>
  );
}

export default function CareCenterWorkspace() {
  return (
    <Suspense fallback={<div className={nxUi.page}>Loading care center…</div>}>
      <CareCenterWorkspaceInner />
    </Suspense>
  );
}
