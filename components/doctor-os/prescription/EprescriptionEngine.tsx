'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import DigitalSignaturePad from '@/components/doctor-os/ui/DigitalSignaturePad';
import { useFormulary, usePatients, useSendPrescription } from '@/lib/doctor/hooks/useClinicalQueries';
import { useDoctorAuth } from '@/lib/doctor/auth/DoctorAuthProvider';
import { sageUi } from '@/lib/doctor/ui-tokens';

type RxLine = { drug: string; dose: string; freq: string; duration: string };

const PROTOCOLS: Record<string, RxLine[]> = {
  'Hypertension Kit': [
    { drug: 'Amlodipine 5mg', dose: '1 tab', freq: 'OD', duration: '30 days' },
    { drug: 'Atorvastatin 20mg', dose: '1 tab', freq: 'HS', duration: '30 days' },
  ],
  'Diabetes Kit': [
    { drug: 'Metformin 500mg', dose: '1 tab', freq: 'BD', duration: '30 days' },
    { drug: 'Glimepiride 1mg', dose: '1 tab', freq: 'OD', duration: '30 days' },
  ],
};

const ALLERGY_TRIGGERS = ['penicillin', 'amoxicillin', 'sulfa', 'sulfonamide'];

function drugConflictsAllergies(drug: string, allergies: string[]): string | null {
  const d = drug.toLowerCase();
  for (const a of allergies) {
    const al = a.toLowerCase();
    if (ALLERGY_TRIGGERS.some((t) => d.includes(t) && (al.includes('penicillin') || al.includes('sulfa')))) {
      return `Contraindication: ${drug} conflicts with allergy "${a}"`;
    }
    if (d.includes('amoxicillin') && al.includes('penicillin')) {
      return `Contraindication: ${drug} conflicts with Penicillin allergy`;
    }
  }
  return null;
}

export default function EprescriptionEngine() {
  const { session } = useDoctorAuth();
  const { data: patientsData } = usePatients();
  const patient = patientsData?.patients[0];
  const { data: formularyData } = useFormulary();
  const sendRx = useSendPrescription();

  const [lines, setLines] = useState<RxLine[]>([{ drug: '', dose: '', freq: 'OD', duration: '7 days' }]);
  const [search, setSearch] = useState('');
  const [warn, setWarn] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const allergies = patient?.allergies ?? [];
  const drugs = formularyData?.drugs ?? [];
  const filtered = useMemo(
    () => drugs.filter((d) => !search || d.brand.toLowerCase().includes(search.toLowerCase())),
    [drugs, search],
  );

  const addDrug = (brand: string) => {
    const conflict = drugConflictsAllergies(brand, allergies);
    if (conflict) {
      setWarn(conflict);
      return;
    }
    setWarn(null);
    setLines((l) => [...l, { drug: brand, dose: '1 tab', freq: 'OD', duration: '7 days' }]);
  };

  const applyProtocol = (name: string) => {
    for (const line of PROTOCOLS[name]) {
      const conflict = drugConflictsAllergies(line.drug, allergies);
      if (conflict) {
        setWarn(conflict);
        return;
      }
    }
    setWarn(null);
    setLines(PROTOCOLS[name]);
  };

  const submit = () => {
    if (!patient) {
      toast.error('No patient selected');
      return;
    }
    sendRx.mutate(
      { patientId: patient.id, items: lines.filter((l) => l.drug.trim()) },
      { onSuccess: () => toast.success('Prescription sent'), onError: (e) => toast.error(e.message) },
    );
  };

  return (
    <div className="doctor-page">
      <header className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-primary">e-Prescription Engine</p>
        <h1 className="text-xl font-black">Digital Rx workstation</h1>
      </header>

      {warn && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 text-rose-900">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Allergy contraindication</p>
            <p className="text-sm">{warn}</p>
            <button type="button" className="mt-2 text-xs font-bold underline" onClick={() => setWarn(null)}>
              Acknowledge & dismiss
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 space-y-4 lg:col-span-7">
          <div className="doctor-card">
            <input
              className={sageUi.input}
              placeholder="Search formulary…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="mt-2 max-h-32 overflow-y-auto">
              {filtered.slice(0, 8).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-brand-surface"
                  onClick={() => addDrug(d.brand)}
                >
                  {d.brand} <span className="text-[#5A584A]">({d.generic})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.keys(PROTOCOLS).map((p) => (
              <button key={p} type="button" className={sageUi.chip + ' cursor-pointer'} onClick={() => applyProtocol(p)}>
                [{p}]
              </button>
            ))}
          </div>

          <div className="doctor-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-light text-left text-[11px] uppercase text-[#5A584A]">
                  <th className="py-2">Drug</th>
                  <th>Dose</th>
                  <th>Freq</th>
                  <th>Duration</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="border-b border-brand-light/60">
                    <td className="py-2 pr-2">
                      <input className={sageUi.input} value={line.drug} onChange={(e) => setLines((l) => l.map((r, j) => (j === i ? { ...r, drug: e.target.value } : r)))} />
                    </td>
                    <td className="py-2 pr-2">
                      <input className={sageUi.input} value={line.dose} onChange={(e) => setLines((l) => l.map((r, j) => (j === i ? { ...r, dose: e.target.value } : r)))} />
                    </td>
                    <td className="py-2 pr-2">
                      <input className={sageUi.input} value={line.freq} onChange={(e) => setLines((l) => l.map((r, j) => (j === i ? { ...r, freq: e.target.value } : r)))} />
                    </td>
                    <td className="py-2 pr-2">
                      <input className={sageUi.input} value={line.duration} onChange={(e) => setLines((l) => l.map((r, j) => (j === i ? { ...r, duration: e.target.value } : r)))} />
                    </td>
                    <td>
                      <button type="button" onClick={() => setLines((l) => l.filter((_, j) => j !== i))} aria-label="Remove">
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className={`${sageUi.btnSecondary} mt-3 text-xs`} onClick={() => setLines((l) => [...l, { drug: '', dose: '', freq: 'OD', duration: '7 days' }])}>
              <Plus className="mr-1 inline h-3.5 w-3.5" /> Add row
            </button>
          </div>

          <button type="button" className={sageUi.btnPrimary} onClick={submit}>
            Send to pharmacy
          </button>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="doctor-card min-h-[420px] border-2 border-brand-light bg-white shadow-sage">
            <div className="border-b border-brand-light pb-3 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-primary">Nexora Multispeciality Hospital</p>
              <p className="text-[10px] text-[#5A584A]">Rx · Verify at nexora.clinical/rx</p>
            </div>
            {patient && (
              <div className="mt-3 text-sm">
                <p className="font-bold">{patient.fullName}</p>
                <p className="text-xs text-[#5A584A]">{patient.mrn} · {patient.age}y</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {allergies.map((a) => (
                    <span key={a} className={sageUi.allergyBadge}>{a}</span>
                  ))}
                </div>
              </div>
            )}
            <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm">
              {lines.filter((l) => l.drug).map((l, i) => (
                <li key={i}>
                  <strong>{l.drug}</strong> — {l.dose} · {l.freq} · {l.duration}
                </li>
              ))}
            </ol>
            <div className="mt-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded border border-brand-light bg-brand-surface text-[8px] text-[#5A584A]">
                QR VERIFY
              </div>
            </div>
            <div className="mt-4">
              <p className="mb-1 text-xs font-bold">Digital signature</p>
              <DigitalSignaturePad onSave={setSignature} />
              {signature && <p className="mt-1 text-[10px] text-green-700">Signature captured</p>}
            </div>
            <p className="mt-4 text-right text-xs font-semibold">{session?.fullName}</p>
            <p className="text-right text-[10px] text-[#5A584A]">{session?.licenseNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
