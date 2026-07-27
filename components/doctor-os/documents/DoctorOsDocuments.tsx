'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

import DigitalSignaturePad from '@/components/doctor-os/ui/DigitalSignaturePad';
import { useGenerateDocument, usePatients } from '@/lib/doctor/hooks/useClinicalQueries';
import { sageUi } from '@/lib/doctor/ui-tokens';

const TEMPLATES = [
  { id: 'DISCHARGE_SUMMARY', label: 'Discharge Summary' },
  { id: 'REFERRAL_LETTER', label: 'Referral Letter' },
  { id: 'FITNESS_CERTIFICATE', label: 'Fitness Certificate' },
  { id: 'MEDICAL_CERTIFICATE', label: 'Medical Certificate' },
  { id: 'SICK_LEAVE', label: 'Sick Leave' },
];

export default function DoctorOsDocuments() {
  const generate = useGenerateDocument();
  const { data } = usePatients();
  const patient = data?.patients[0];
  const [selected, setSelected] = useState(TEMPLATES[0].id);
  const [preview, setPreview] = useState('');

  const onGenerate = () => {
    if (!patient) {
      toast.error('No patient selected');
      return;
    }
    generate.mutate(
      {
        documentType: selected,
        patientId: patient.id,
        content: { body: preview || 'Auto-filled from clinical encounter data.', generatedAt: new Date().toISOString() },
      },
      {
        onSuccess: () => toast.success('Document generated · PDF ready'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <div className="doctor-page">
      <header className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-primary">Clinical Documents</p>
        <h1 className="text-xl font-black">Certificates & summaries</h1>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 space-y-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(t.id)}
              className={`doctor-card flex w-full items-center gap-2 text-left ${selected === t.id ? 'ring-2 ring-brand-primary' : ''}`}
            >
              <FileText className="h-4 w-4 text-brand-primary" />
              {t.label}
            </button>
          ))}
        </div>
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="doctor-card">
            <label className="text-sm font-bold">Auto-filled content (editable)</label>
            <textarea
              className={`${sageUi.input} mt-2 min-h-[160px]`}
              value={preview}
              onChange={(e) => setPreview(e.target.value)}
              placeholder={`${selected.replace(/_/g, ' ')} for ${patient?.fullName ?? 'patient'}…`}
            />
          </div>
          <div className="doctor-card">
            <p className="mb-2 text-sm font-bold">Digital signature</p>
            <DigitalSignaturePad />
          </div>
          <div className="doctor-card-surface min-h-[200px] border-2 border-dashed border-brand-secondary">
            <p className="text-center text-xs font-bold uppercase text-[#5A584A]">Live PDF preview</p>
            <div className="mt-4 whitespace-pre-wrap text-sm">{preview || 'Preview renders after you type content…'}</div>
          </div>
          <button type="button" className={sageUi.btnPrimary} onClick={onGenerate}>
            Generate & save document
          </button>
        </div>
      </div>
    </div>
  );
}
