'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ClinicalPageSkeleton } from '@/components/doctor/ClinicalSkeleton';
import { ClinicalDrawer, ClinicalModal } from '@/components/doctor/modules/ClinicalDrawer';
import { ClinicalPageHeader } from '@/components/doctor/doctor-ui';
import {
  useIpdAdmissions,
  useSaveSoapNote,
  type IpdAdmissionDto,
} from '@/lib/doctor/hooks/useClinicalQueries';
import { updateIpdAdmission } from '@/lib/doctor/client/clinical-data-service';
import { clinicalClasses } from '@/lib/doctor/theme';

const WARDS = ['ICU', 'CCU', 'General Male', 'General Female', 'Private'] as const;

const ICU_BED_CAPACITY = 12;

type SoapNote = { at: string; author: string; s: string; o: string; a: string; p: string };

type AdmissionWithStatus = IpdAdmissionDto & { status?: string };

function WardEmptyState() {
  return (
    <div className="w-full rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
      <p className="text-sm font-medium text-gray-600">No patients currently admitted</p>
    </div>
  );
}

export default function IpdWardModule() {
  const { data, isLoading, isError, error } = useIpdAdmissions();
  const saveSoap = useSaveSoapNote();
  const [selected, setSelected] = useState<IpdAdmissionDto | null>(null);
  const [drawer, setDrawer] = useState<'soap' | 'nursing' | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [soap, setSoap] = useState({ s: '', o: '', a: '', p: '' });

  const admissions = data?.admissions ?? [];

  const grouped = useMemo(() => {
    const map = new Map<string, IpdAdmissionDto[]>();
    WARDS.forEach((w) => map.set(w, []));
    admissions.forEach((row) => {
      const list = map.get(row.ward) ?? [];
      list.push(row);
      map.set(row.ward, list);
    });
    return map;
  }, [admissions]);

  const censusMetrics = useMemo(() => {
    const total = admissions.length;
    const icuCount = grouped.get('ICU')?.length ?? 0;
    const icuOccupancy =
      ICU_BED_CAPACITY > 0 ? Math.min(100, Math.round((icuCount / ICU_BED_CAPACITY) * 100)) : 0;
    const dischargesPending = (admissions as AdmissionWithStatus[]).filter(
      (a) => a.status === 'DISCHARGE_PLANNED',
    ).length;
    return { total, icuCount, icuOccupancy, dischargesPending };
  }, [admissions, grouped]);

  const history = (row: IpdAdmissionDto): SoapNote[] =>
    Array.isArray(row.dailyProgressNotesJson) ? (row.dailyProgressNotesJson as SoapNote[]) : [];

  const onSaveSoap = () => {
    if (!selected) return;
    saveSoap.mutate(
      { admissionId: selected.id, soap },
      {
        onSuccess: (res) => {
          toast.success(res.message ?? 'SOAP Note saved!');
          setSoap({ s: '', o: '', a: '', p: '' });
          setDrawer(null);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  if (isLoading) return <ClinicalPageSkeleton rows={4} />;
  if (isError) {
    return (
      <p className="text-sm text-[#EF4444]">
        {(error as Error).message}. Set DATABASE_URL and run npm run db:push && npm run db:seed
      </p>
    );
  }

  return (
    <div className={clinicalClasses.pageBg}>
      <ClinicalPageHeader title="IPD & Ward Round Management" subtitle="Live census from Supabase · Prisma-backed SOAP notes" />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-brand-light bg-brand-surface px-5 py-4 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-text/60">Total IPD Admitted</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-brand-text">{censusMetrics.total}</p>
        </div>
        <div className="rounded-xl border border-brand-light bg-brand-surface px-5 py-4 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-text/60">ICU Occupancy</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-brand">
            {censusMetrics.icuOccupancy}%
          </p>
          <p className="mt-0.5 text-sm text-slate-600">
            {censusMetrics.icuCount} / {ICU_BED_CAPACITY} beds
          </p>
        </div>
        <div className="rounded-xl border border-brand-light bg-brand-surface px-5 py-4 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Discharges Pending Today</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-amber-700">{censusMetrics.dischargesPending}</p>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {WARDS.map((ward) => {
          const rows = grouped.get(ward) ?? [];
          return (
            <section
              key={ward}
              className="flex h-full flex-col rounded-xl border border-gray-200 bg-brand-surface p-4 shadow-sm"
            >
              <header className="-mx-4 -mt-4 mb-4 rounded-t-xl border-b border-gray-200 bg-gray-100 px-4 py-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800">
                  {ward} ({rows.length})
                </h3>
              </header>

              <div className="flex min-h-0 flex-1 flex-col gap-3">
                {rows.length === 0 ? (
                  <WardEmptyState />
                ) : (
                  rows.map((row) => (
                    <article
                      key={row.id}
                      className="flex w-full flex-col rounded-lg border border-gray-200 bg-brand-surface p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-[#0F172A]">{row.patient.fullName}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-gray-100 px-2.5 py-1 font-mono text-sm font-medium text-gray-700">
                              {row.patient.mrn}
                            </span>
                            <span className="text-sm text-gray-600">Bed {row.bed}</span>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-md bg-teal-50 px-2.5 py-1 text-sm font-semibold text-[#0D9488]">
                          LOS {row.losDays}d
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-gray-600">Attending census · {row.ward}</p>
                      <div className="mt-4 grid w-full grid-cols-3 gap-2">
                        <button
                          type="button"
                          className={`min-w-0 ${clinicalClasses.btnPrimary}`}
                          onClick={() => {
                            setSelected(row);
                            setDrawer('soap');
                          }}
                        >
                          SOAP note
                        </button>
                        <button
                          type="button"
                          className={`min-w-0 ${clinicalClasses.btnSecondary}`}
                          onClick={() => {
                            setSelected(row);
                            setDrawer('nursing');
                          }}
                        >
                          Nursing
                        </button>
                        <button
                          type="button"
                          className={`min-w-0 ${clinicalClasses.btnSecondary}`}
                          onClick={() => {
                            setSelected(row);
                            setTransferOpen(true);
                          }}
                        >
                          Transfer / DC
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      <ClinicalDrawer open={drawer === 'soap' && !!selected} title={`SOAP · ${selected?.patient.fullName ?? ''}`} wide onClose={() => setDrawer(null)}>
        {selected && (
          <>
            <div className="mb-4 space-y-2">
              <h4 className={clinicalClasses.sectionTitle}>Historical timeline</h4>
              {history(selected).length === 0 ? (
                <p className="text-sm text-[#64748B]">No prior notes in database.</p>
              ) : (
                history(selected).map((h, i) => (
                  <div key={i} className="rounded-lg border border-brand-light/60 bg-[#F8FAFC] p-3 text-xs">
                    <p className="font-semibold">{new Date(h.at).toLocaleString('en-IN')} · {h.author}</p>
                    <p>S: {h.s}</p>
                    <p>O: {h.o}</p>
                    <p>A: {h.a}</p>
                    <p>P: {h.p}</p>
                  </div>
                ))
              )}
            </div>
            {(['s', 'o', 'a', 'p'] as const).map((key) => (
              <label key={key} className="mb-3 block">
                <span className="text-xs font-bold uppercase text-[#64748B]">{key}</span>
                <textarea
                  value={soap[key]}
                  onChange={(e) => setSoap((prev) => ({ ...prev, [key]: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-brand-light px-3 py-2 text-sm"
                />
              </label>
            ))}
            <button type="button" className={clinicalClasses.btnPrimary} disabled={saveSoap.isPending} onClick={onSaveSoap}>
              {saveSoap.isPending ? 'Saving…' : 'Save progress note'}
            </button>
          </>
        )}
      </ClinicalDrawer>

      <ClinicalDrawer open={drawer === 'nursing' && !!selected} title="Nursing directives" onClose={() => setDrawer(null)}>
        <textarea rows={4} className="w-full rounded-lg border px-3 py-2 text-sm" defaultValue="Vitals q4h · DVT prophylaxis" />
        <button type="button" className={`mt-3 ${clinicalClasses.btnPrimary}`} onClick={() => toast.success('Nursing directive queued')}>
          Submit to nursing station
        </button>
      </ClinicalDrawer>

      <ClinicalModal open={transferOpen} title="Transfer / discharge" onClose={() => setTransferOpen(false)}>
        <select className="w-full rounded-lg border px-3 py-2 text-sm">
          <option>Discharge home</option>
          <option>Transfer ward</option>
        </select>
        <button
          type="button"
          className={`mt-4 ${clinicalClasses.btnPrimary}`}
          onClick={async () => {
            if (!selected) return;
            await updateIpdAdmission({
              admissionId: selected.id,
              status: 'DISCHARGE_PLANNED',
            });
            toast.success('Discharge recommendation saved');
            setTransferOpen(false);
          }}
        >
          Send recommendation
        </button>
      </ClinicalModal>
    </div>
  );
}
