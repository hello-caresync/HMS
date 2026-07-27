'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, FlaskConical, Pill, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

import {
  DoctorModuleShell,
  PatientHeaderBar,
  PrescriptionTable,
  StickyVitalsBar,
} from '@/components/doctor/doctor-ui';
import {
  useEmrTimeline,
  useFormulary,
  useGenerateDocument,
  usePatientLabOrders,
  useSaveConsultation,
  useSendPrescription,
  useStatLabOrder,
} from '@/lib/doctor/hooks/useClinicalQueries';
import type { PatientDto } from '@/lib/doctor/types/clinical-dto';
import { clinicalClasses } from '@/lib/doctor/theme';
import { DOCUMENT_TYPE_LABELS, type DocumentTemplateType } from '@/lib/mock-data';

type TimelineEvent = {
  id: string;
  at: string;
  category: string;
  title: string;
  summary: string;
  detail?: string;
  provider?: string;
};

type WorkstationTab = 'soap' | 'rx' | 'orders' | 'documents';

const WORKSTATION_TABS: { id: WorkstationTab; label: string; icon: typeof Stethoscope }[] = [
  { id: 'soap', label: 'Current SOAP Note', icon: Stethoscope },
  { id: 'rx', label: 'Prescriptions', icon: Pill },
  { id: 'orders', label: 'Lab & Radiology Orders', icon: FlaskConical },
  { id: 'documents', label: 'Documents', icon: FileText },
];

const DEFAULT_VITALS = [
  { label: 'BP', value: '128/82', unit: 'mmHg' },
  { label: 'HR', value: '78', unit: 'bpm' },
  { label: 'SpO₂', value: '98', unit: '%' },
  { label: 'Temp', value: '37.1', unit: '°C' },
];

const SOAP_KEYS = [
  { key: 'subjective', label: 'Subjective' },
  { key: 'objective', label: 'Objective' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'plan', label: 'Plan' },
] as const;

function categoryAccent(category: string): string {
  if (category === 'Lab') return 'border-l-[#8B5CF6]';
  if (category === 'Pharmacy') return 'border-l-[#F59E0B]';
  if (category === 'Radiology') return 'border-l-[#3B82F6]';
  return 'border-l-brand';
}

export function EmrClinicalDashboard({ patient }: { patient: PatientDto }) {
  const { data: timelineData, isLoading: timelineLoading } = useEmrTimeline(patient.id);
  const { data: labData } = usePatientLabOrders(patient.id);
  const { data: formularyData } = useFormulary();
  const saveConsultation = useSaveConsultation();
  const sendRx = useSendPrescription();
  const statLab = useStatLabOrder();
  const generateDoc = useGenerateDocument();

  const timeline = (timelineData?.events ?? []) as TimelineEvent[];
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkstationTab>('soap');
  const [soap, setSoap] = useState<Record<(typeof SOAP_KEYS)[number]['key'], string>>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });
  const [rxQuery, setRxQuery] = useState('');
  const [rxRows, setRxRows] = useState([
    { drugName: 'Metformin 500mg', dosage: '1 tab', frequency: 'BD', duration: '30d' },
  ]);
  const [docType, setDocType] = useState<DocumentTemplateType>('DISCHARGE_SUMMARY');

  const selectedEvent = useMemo(
    () => timeline.find((e) => e.id === selectedEventId) ?? null,
    [timeline, selectedEventId],
  );

  useEffect(() => {
    if (timeline.length && !selectedEventId) {
      setSelectedEventId(timeline[0].id);
    }
  }, [timeline, selectedEventId]);

  const formulary = formularyData?.drugs ?? [];
  const rxSuggestions = useMemo(() => {
    const q = rxQuery.toLowerCase();
    if (!q) return [];
    return formulary.filter((d) => d.brand.toLowerCase().includes(q) || d.generic.toLowerCase().includes(q)).slice(0, 6);
  }, [formulary, rxQuery]);

  const saveSoap = () => {
    saveConsultation.mutate(
      {
        patientId: patient.id,
        chiefComplaint: 'EMR workstation encounter',
        hpi: Object.entries(soap)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n'),
        soapNotes: soap,
      },
      {
        onSuccess: () => toast.success('SOAP note saved to encounter'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const dispatchRx = () => {
    if (!rxRows.length) {
      toast.error('Add at least one medicine');
      return;
    }
    saveConsultation.mutate(
      {
        patientId: patient.id,
        chiefComplaint: 'e-Prescription from EMR',
        hpi: 'Quick prescribe widget',
        diagnosisIcd10: [],
      },
      {
        onSuccess: (res) => {
          sendRx.mutate(
            {
              encounterId: res.encounter.id,
              patientId: patient.id,
              medicines: rxRows.map((r) => ({
                drugName: r.drugName,
                dosage: r.dosage,
                frequency: r.frequency,
                duration: r.duration,
                instructions: 'After food',
              })),
            },
            {
              onSuccess: (rxRes) => toast.success(rxRes.message ?? 'Prescription sent to pharmacy'),
              onError: (e) => toast.error(e.message),
            },
          );
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const orderStat = (kind: 'lab' | 'rad', label: string) => {
    statLab.mutate(
      {
        patientId: patient.id,
        statLabTests: kind === 'lab' ? [label] : undefined,
        statRadiology: kind === 'rad' ? { modality: label, bodyPart: 'Chest' } : undefined,
      },
      {
        onSuccess: () => toast.success(`STAT ${label} ordered`),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const labOrders = labData?.orders ?? [];

  return (
    <DoctorModuleShell title="Electronic Medical Record" subtitle="Split clinical workstation · timeline + active charting">
      <div className="sticky top-0 z-20 -mx-1 rounded-2xl border border-brand-light/60 bg-brand-surface shadow-sm">
        <PatientHeaderBar
          name={patient.fullName}
          mrn={patient.mrn}
          age={patient.age}
          gender={patient.gender}
          bloodGroup={patient.bloodGroup}
          allergies={patient.allergies}
        />
        <StickyVitalsBar items={DEFAULT_VITALS} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <aside className={`${clinicalClasses.card} flex flex-col p-4 lg:col-span-1`}>
          <h3 className="text-xs font-black uppercase tracking-wide text-brand">Patient timeline</h3>
          <p className="mt-1 text-xs text-brand-text/70">Select an encounter to load history in the workstation</p>
          <ul className="mt-3 max-h-[600px] space-y-2 overflow-y-auto pr-1">
            {timelineLoading && <li className="text-sm text-brand-text/70">Loading timeline…</li>}
            {!timelineLoading && timeline.length === 0 && (
              <li className="text-sm text-brand-text/70">No prior encounters on file.</li>
            )}
            {timeline.map((ev) => {
              const active = ev.id === selectedEventId;
              return (
                <li key={ev.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEventId(ev.id);
                      setActiveTab('soap');
                    }}
                    className={`w-full rounded-xl border border-brand-light/60 border-l-4 ${categoryAccent(ev.category)} p-3 text-left transition-shadow ${
                      active ? 'bg-brand-surface shadow-md ring-1 ring-brand/30' : 'bg-brand-surface hover:bg-brand-light/40 hover:shadow-sm'
                    }`}
                  >
                    <p className="text-xs font-bold text-brand-text/70">
                      {new Date(ev.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {ev.category}
                    </p>
                    <p className="mt-0.5 font-bold text-brand-text">{ev.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-brand-text/70">{ev.summary}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className={`${clinicalClasses.card} flex min-h-[520px] flex-col p-4 lg:col-span-2`}>
          {selectedEvent && (
            <section className="mb-4 rounded-xl border border-brand-light/60 bg-brand-bg p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase text-brand-text/70">Historical record</p>
                  <h4 className="text-base font-bold text-brand-text">{selectedEvent.title}</h4>
                  <p className="text-xs text-brand-text/70">
                    {new Date(selectedEvent.at).toLocaleString('en-IN')}
                    {selectedEvent.provider ? ` · ${selectedEvent.provider}` : ''}
                  </p>
                </div>
                <span className="rounded-full bg-brand-surface px-2 py-0.5 text-xs font-semibold text-brand">
                  {selectedEvent.category}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#334155]">
                {selectedEvent.detail ?? selectedEvent.summary}
              </p>
            </section>
          )}

          <nav className="flex flex-wrap gap-1 border-b border-brand-light/60 pb-2" aria-label="Clinical workstation tabs">
            {WORKSTATION_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  activeTab === id ? 'bg-brand-text text-white' : 'text-brand-text/70 hover:bg-brand-light/40'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-4 flex-1 space-y-4">
            {activeTab === 'soap' && (
              <>
                <p className="text-xs text-brand-text/70">Document the active encounter while reviewing timeline on the left.</p>
                {SOAP_KEYS.map(({ key, label }) => (
                  <label key={key} className="block">
                    <span className="text-xs font-bold uppercase text-brand-text/70">{label}</span>
                    <textarea
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-brand-light px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                      value={soap[key]}
                      placeholder={`${label}…`}
                      onChange={(e) => setSoap((s) => ({ ...s, [key]: e.target.value }))}
                    />
                  </label>
                ))}
                <button type="button" className={clinicalClasses.btnPrimary} onClick={saveSoap} disabled={saveConsultation.isPending}>
                  Save SOAP note
                </button>
              </>
            )}

            {activeTab === 'rx' && (
              <>
                <p className="text-xs text-brand-text/70">Quick-prescribe · allergy-aware formulary search</p>
                <input
                  value={rxQuery}
                  onChange={(e) => setRxQuery(e.target.value)}
                  placeholder="Search brand or generic…"
                  className="w-full rounded-lg border border-brand-light px-3 py-2 text-sm"
                />
                {rxSuggestions.length > 0 && (
                  <ul className="max-h-36 overflow-y-auto rounded-lg border border-brand-light/60 bg-brand-surface">
                    {rxSuggestions.map((d) => (
                      <li key={d.brand}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-brand-light/40"
                          onClick={() => {
                            setRxRows((rows) => [
                              ...rows,
                              {
                                drugName: d.brand,
                                dosage: '1 tab',
                                frequency: 'OD',
                                duration: '7d',
                              },
                            ]);
                            setRxQuery('');
                          }}
                        >
                          <span className="font-medium">{d.brand}</span>
                          <span className="text-brand-text/70"> · {d.generic}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <PrescriptionTable rows={rxRows} onRemove={(i) => setRxRows((r) => r.filter((_, idx) => idx !== i))} />
                <button type="button" className={clinicalClasses.btnPrimary} onClick={dispatchRx}>
                  Send to pharmacy
                </button>
              </>
            )}

            {activeTab === 'orders' && (
              <>
                <p className="text-xs text-brand-text/70">One-click STAT orders for resuscitation and workup</p>
                <div className="flex flex-wrap gap-2">
                  {['CBC', 'BMP', 'Troponin', 'ABG'].map((test) => (
                    <button
                      key={test}
                      type="button"
                      className={clinicalClasses.btnSecondary}
                      onClick={() => orderStat('lab', test)}
                    >
                      STAT {test}
                    </button>
                  ))}
                  <button type="button" className={clinicalClasses.btnSecondary} onClick={() => orderStat('rad', 'CT')}>
                    STAT CT Chest
                  </button>
                  <button type="button" className={clinicalClasses.btnSecondary} onClick={() => orderStat('rad', 'X-Ray')}>
                    STAT X-Ray
                  </button>
                </div>
                <div className={`${clinicalClasses.card} p-3`}>
                  <p className="text-xs font-bold uppercase text-brand-text/70">Recent orders</p>
                  {labOrders.length === 0 ? (
                    <p className="mt-2 text-sm text-brand-text/70">No lab orders in queue · use STAT buttons above.</p>
                  ) : (
                    <ul className="mt-2 space-y-1 text-sm">
                      {labOrders.slice(0, 8).map((o, i) => (
                        <li key={i} className="text-[#334155]">
                          {String((o as Record<string, unknown>).test_name ?? (o as Record<string, unknown>).id ?? 'Order')}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}

            {activeTab === 'documents' && (
              <>
                <p className="text-xs text-brand-text/70">Generate certificates and summaries into the chart vault</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentTemplateType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDocType(t)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        docType === t ? 'bg-[#0F172A] text-white' : 'border border-brand-light bg-brand-surface text-brand-text/70'
                      }`}
                    >
                      {DOCUMENT_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className={clinicalClasses.btnPrimary}
                  disabled={generateDoc.isPending}
                  onClick={() =>
                    generateDoc.mutate(
                      {
                        patientId: patient.id,
                        documentType: docType,
                        content: `${DOCUMENT_TYPE_LABELS[docType]} — ${patient.fullName}`,
                      },
                      {
                        onSuccess: () => toast.success('Document generated'),
                        onError: (e) => toast.error(e.message),
                      },
                    )
                  }
                >
                  Generate {DOCUMENT_TYPE_LABELS[docType]}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </DoctorModuleShell>
  );
}
