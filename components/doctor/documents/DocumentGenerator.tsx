'use client';

import { useState } from 'react';
import { Download, Printer } from 'lucide-react';

import { ClinicalPageSkeleton } from '@/components/doctor/ClinicalSkeleton';
import { ClinicalPageHeader, DigitalSignaturePad, PatientHeaderBar } from '@/components/doctor/doctor-ui';
import { useGenerateDocument, usePatients } from '@/lib/doctor/hooks/useClinicalQueries';
import { clinicalClasses } from '@/lib/doctor/theme';
import {
  DOCUMENT_TYPE_LABELS,
  MOCK_DOCTOR_PROFILE,
  type DocumentTemplateType,
} from '@/lib/mock-data';
import { toast } from 'sonner';

const DOC_TYPES = Object.keys(DOCUMENT_TYPE_LABELS) as DocumentTemplateType[];

export default function DocumentGenerator() {
  const { data } = usePatients();
  const generate = useGenerateDocument();
  const patient = data?.patients?.[0];
  const [docType, setDocType] = useState<DocumentTemplateType>('DISCHARGE_SUMMARY');
  const [dateFrom, setDateFrom] = useState('2026-07-19');
  const [dateTo, setDateTo] = useState('2026-07-21');
  const [signed, setSigned] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const generatePreview = () => {
    if (!patient) return;
    generate.mutate(
      {
        patientId: patient.id,
        documentType: docType,
        dateFrom,
        dateTo,
        signed,
        content: `${DOCUMENT_TYPE_LABELS[docType]} for ${patient.fullName}`,
      },
      {
        onSuccess: (res) => {
          setPreviewHtml(res.previewHtml ?? '');
          toast.success('Document stored in clinical_documents');
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  if (!patient) {
    return <ClinicalPageSkeleton rows={2} />;
  }

  return (
    <div className={clinicalClasses.pageBg}>
      <ClinicalPageHeader title="Clinical Documents & Certificates" subtitle="Templates · auto-fill · signature · export" />
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
            onClick={() => setDocType(t)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              docType === t ? 'bg-[#0F172A] text-white' : 'border border-slate-200 bg-white text-[#64748B]'
            }`}
          >
            {DOCUMENT_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className={`${clinicalClasses.card} mt-4 grid gap-4 p-4 md:grid-cols-2`}>
        <label className="text-sm">
          From
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="text-sm">
          To
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <div className="md:col-span-2">
          <p className="text-xs font-semibold text-[#64748B]">Auto-filled body (editable)</p>
          <textarea
            rows={6}
            className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
            defaultValue={`${DOCUMENT_TYPE_LABELS[docType]} for ${patient.fullName} (${patient.mrn}). Attending: ${MOCK_DOCTOR_PROFILE.fullName}.`}
          />
        </div>
      </div>

      <DigitalSignaturePad onApply={() => setSigned(true)} />

      <button type="button" className={`mt-4 ${clinicalClasses.btnPrimary}`} onClick={generatePreview}>
        Preview document
      </button>

      {previewHtml && (
        <div className={`${clinicalClasses.card} mt-4 p-6`}>
          <p className="text-xs font-bold uppercase text-[#64748B]">PDF preview (mock)</p>
          <div
            className="mt-3 rounded-lg border border-slate-200 bg-white p-6 font-serif text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
          <div className="mt-4 flex gap-2">
            <button type="button" className={clinicalClasses.btnSecondary} onClick={() => window.print()}>
              <Printer className="mr-1 inline h-4 w-4" /> Print
            </button>
            <button type="button" className={clinicalClasses.btnSecondary} onClick={() => setPreviewHtml(previewHtml)}>
              <Download className="mr-1 inline h-4 w-4" /> Download PDF (mock)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
