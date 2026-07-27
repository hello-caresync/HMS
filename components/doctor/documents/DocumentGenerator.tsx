'use client';

import { useMemo, useState } from 'react';
import { Download, Printer, QrCode } from 'lucide-react';
import { toast } from 'sonner';

import { ClinicalPageSkeleton } from '@/components/doctor/ClinicalSkeleton';
import { ClinicalPageHeader, DigitalSignaturePad, PatientHeaderBar } from '@/components/doctor/doctor-ui';
import { useGenerateDocument, usePatients } from '@/lib/doctor/hooks/useClinicalQueries';
import { sageUi } from '@/lib/doctor/ui-tokens';
import {
  DOCUMENT_TYPE_LABELS,
  MOCK_DOCTOR_PROFILE,
  type DocumentTemplateType,
} from '@/lib/mock-data';

const DOC_TYPES = Object.keys(DOCUMENT_TYPE_LABELS) as DocumentTemplateType[];

export default function DocumentGenerator() {
  const { data } = usePatients();
  const generate = useGenerateDocument();
  const patient = data?.patients?.[0];
  const [docType, setDocType] = useState<DocumentTemplateType>('DISCHARGE_SUMMARY');
  const [dateFrom, setDateFrom] = useState('2026-07-19');
  const [dateTo, setDateTo] = useState('2026-07-21');
  const [signed, setSigned] = useState(false);
  const [body, setBody] = useState('');

  const autoBody = useMemo(() => {
    if (!patient) return '';
    const dx = (patient as { chronicConditions?: string[] }).chronicConditions?.join(', ') || 'Type 2 DM · HTN';
    return `${DOCUMENT_TYPE_LABELS[docType]} for ${patient.fullName} (${patient.mrn}).

Admission: ${dateFrom} · Discharge: ${dateTo}
Attending: ${MOCK_DOCTOR_PROFILE.fullName} · Reg ${MOCK_DOCTOR_PROFILE.licenseNumber}
Active diagnoses: ${dx}

Clinical course and management plan documented per Nexora EMR. Patient counselled on follow-up and red-flag symptoms.`;
  }, [patient, docType, dateFrom, dateTo]);

  const effectiveBody = body || autoBody;

  const generatePreview = () => {
    if (!patient) return;
    generate.mutate(
      {
        patientId: patient.id,
        documentType: docType,
        dateFrom,
        dateTo,
        signed,
        content: effectiveBody,
      },
      {
        onSuccess: () => toast.success('Document stored in clinical_documents'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  if (!patient) return <ClinicalPageSkeleton rows={2} />;

  return (
    <div className={sageUi.page}>
      <ClinicalPageHeader
        title="Clinical Documents"
        subtitle="Smart templates · auto-fill demographics · live print preview · QR verification"
      />
      <PatientHeaderBar
        name={patient.fullName}
        mrn={patient.mrn}
        age={patient.age}
        gender={patient.gender}
        bloodGroup={patient.bloodGroup}
        allergies={patient.allergies}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {DOC_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setDocType(t);
              setBody('');
            }}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              docType === t ? 'bg-[#A39E75] text-white' : 'border border-[#C7C39E] bg-[#F7F6E8] text-[#5C5A4E]'
            }`}
          >
            {DOCUMENT_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className={`${sageUi.cardSolid} space-y-4 p-5 xl:col-span-5`}>
          <h3 className="text-xs font-black uppercase text-[#A39E75]">Structured inputs</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              From
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${sageUi.input} mt-1`} />
            </label>
            <label className="text-sm">
              To
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`${sageUi.input} mt-1`} />
            </label>
          </div>
          <textarea
            rows={12}
            className={sageUi.input}
            value={effectiveBody}
            onChange={(e) => setBody(e.target.value)}
          />
          <DigitalSignaturePad onApply={() => setSigned(true)} />
          <button type="button" className={sageUi.btnPrimary} onClick={generatePreview}>
            Save &amp; refresh preview
          </button>
        </div>

        <div className={`${sageUi.cardSolid} p-6 xl:col-span-7`}>
          <div className="flex items-start justify-between border-b border-[#E6E3C5] pb-4">
            <div>
              <p className="font-serif text-lg font-black text-[#2B2A22]">Nexora University Hospital</p>
              <p className="text-xs text-[#5C5A4E]">Verified clinical document · print-ready</p>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg border border-[#E6E3C5] bg-[#FAFAF5] p-2">
              <QrCode className="h-10 w-10 text-[#A39E75]" aria-hidden />
              <span className="text-[8px] font-mono font-bold">NX-DOC-VERIFY</span>
            </div>
          </div>
          <h2 className="mt-4 text-center font-serif text-xl font-bold">{DOCUMENT_TYPE_LABELS[docType]}</h2>
          <div className="mt-4 whitespace-pre-wrap font-serif text-sm leading-relaxed text-[#2B2A22]">
            {effectiveBody}
          </div>
          {signed ? (
            <p className="mt-6 font-serif text-2xl italic text-[#A39E75]">Dr. {MOCK_DOCTOR_PROFILE.fullName}</p>
          ) : null}
          <div className="mt-6 flex gap-2">
            <button type="button" className={sageUi.btnSecondary} onClick={() => window.print()}>
              <Printer className="mr-1 inline h-4 w-4" /> Print
            </button>
            <button type="button" className={sageUi.btnSecondary} onClick={() => toast.success('PDF export queued')}>
              <Download className="mr-1 inline h-4 w-4" /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
