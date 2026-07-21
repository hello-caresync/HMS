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
import { clinicalClasses } from '@/lib/doctor/theme';

const WARDS = ['ICU', 'CCU', 'General Male', 'General Female', 'Private'] as const;

type SoapNote = { at: string; author: string; s: string; o: string; a: string; p: string };

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

      <div className="space-y-6">
        {WARDS.map((ward) => {
          const rows = grouped.get(ward) ?? [];
          if (!rows.length) return null;
          return (
            <section key={ward}>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#0F172A]">
                {ward} ({rows.length})
              </h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {rows.map((row) => (
                  <article key={row.id} className={`${clinicalClasses.card} p-4`}>
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="font-bold text-[#0F172A]">{row.patient.fullName}</p>
                        <p className="text-xs text-[#64748B]">
                          {row.patient.mrn} · Bed {row.bed}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#0D9488]">LOS {row.losDays}d</span>
                    </div>
                    <p className="mt-2 text-xs text-[#64748B]">Attending census · ward {row.ward}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={clinicalClasses.btnPrimary}
                        onClick={() => {
                          setSelected(row);
                          setDrawer('soap');
                        }}
                      >
                        SOAP note
                      </button>
                      <button
                        type="button"
                        className={clinicalClasses.btnSecondary}
                        onClick={() => {
                          setSelected(row);
                          setDrawer('nursing');
                        }}
                      >
                        Nursing
                      </button>
                      <button
                        type="button"
                        className={clinicalClasses.btnSecondary}
                        onClick={() => {
                          setSelected(row);
                          setTransferOpen(true);
                        }}
                      >
                        Transfer / DC
                      </button>
                    </div>
                  </article>
                ))}
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
                  <div key={i} className="rounded-lg border border-slate-100 bg-[#F8FAFC] p-3 text-xs">
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
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
            await fetch('/api/ipd/soap-notes', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ admissionId: selected.id, status: 'DISCHARGE_PLANNED' }),
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
