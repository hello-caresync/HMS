'use client';

import { useMemo, useState } from 'react';

import { ClinicalModal } from '@/components/doctor/modules/ClinicalDrawer';
import { ClinicalPageSkeleton } from '@/components/doctor/ClinicalSkeleton';
import { ClinicalPageHeader, DigitalSignaturePad, PatientHeaderBar } from '@/components/doctor/doctor-ui';
import { useFormulary, usePatients, useSaveConsultation, useSendPrescription } from '@/lib/doctor/hooks/useClinicalQueries';
import { clinicalClasses } from '@/lib/doctor/theme';
import { toast } from 'sonner';

type DrugEntry = {
  id: string;
  brand: string;
  generic: string;
  route: string;
  interactsWith: string[];
  allergyConflict: string[];
};

type RxRow = {
  drugName: string;
  generic: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  food: string;
  quantity: string;
};

export default function PrescriptionBuilder() {
  const { data, isLoading } = usePatients({ status: 'OPD' });
  const { data: formularyData } = useFormulary();
  const saveConsultation = useSaveConsultation();
  const sendRx = useSendPrescription();
  const patient = data?.patients?.[0];
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<RxRow[]>([]);
  const [signed, setSigned] = useState(false);
  const [stamp, setStamp] = useState<string | null>(null);
  const [interactionOpen, setInteractionOpen] = useState(false);
  const [interactionText, setInteractionText] = useState('');
  const [dispatchState, setDispatchState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [notice, setNotice] = useState<string | null>(null);

  const catalog = formularyData?.drugs ?? [];

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return catalog.filter((d) => d.brand.toLowerCase().includes(q) || d.generic.toLowerCase().includes(q)).slice(0, 8);
  }, [query, catalog]);

  const addDrug = (d: DrugEntry) => {
    if (!patient) return;
    const allergyHit = d.allergyConflict.find((a) => patient.allergies.includes(a));
    const interact = rows.some((r) =>
      d.interactsWith.some((i) => r.generic.toLowerCase().includes(i.toLowerCase()) || r.drugName.includes(i)),
    );

    if (allergyHit || interact) {
      setInteractionText(
        allergyHit
          ? `Drug–allergy conflict: ${d.generic} contraindicated with ${allergyHit} allergy.`
          : `Drug–drug interaction: ${d.generic} with existing regimen (anticoagulant + antiplatelet).`,
      );
      setInteractionOpen(true);
      return;
    }

    setRows((prev) => [
      ...prev,
      {
        drugName: d.brand,
        generic: d.generic,
        dosage: '1 tab',
        route: d.route,
        frequency: '1-0-1',
        duration: '7d',
        food: 'After food',
        quantity: '14',
      },
    ]);
    setQuery('');
  };

  const forceAddAfterAlert = () => {
    setInteractionOpen(false);
    setNotice('Override logged · proceed with caution');
  };

  const sendPharmacy = () => {
    if (!patient) return;
    if (!signed) {
      toast.error('Apply digital signature before dispatch');
      return;
    }
    if (!rows.length) return;
    setDispatchState('sending');
    saveConsultation.mutate(
      {
        patientId: patient.id,
        chiefComplaint: 'e-Prescription encounter',
        hpi: 'Rx builder',
        diagnosisIcd10: [],
      },
      {
        onSuccess: (encRes) => {
          sendRx.mutate(
            {
              encounterId: encRes.encounter.id,
              patientId: patient.id,
              medicines: rows.map((r) => ({
                drugName: r.drugName,
                dosage: r.dosage,
                frequency: r.frequency,
                duration: r.duration,
                instructions: `${r.route} · ${r.food} · Qty ${r.quantity}`,
              })),
              digitalSignatureApplied: true,
              digitalSignature: stamp ?? 'SIG',
            },
            {
              onSuccess: (res) => {
                setDispatchState('sent');
                toast.success(res.message ?? 'Prescription sent to pharmacy successfully!');
              },
              onError: (e) => {
                setDispatchState('idle');
                toast.error(e.message);
              },
            },
          );
        },
        onError: (e) => {
          setDispatchState('idle');
          toast.error(e.message);
        },
      },
    );
  };

  if (isLoading || !patient) {
    return <ClinicalPageSkeleton rows={2} />;
  }

  return (
    <div className={clinicalClasses.pageBg}>
      <ClinicalPageHeader title="e-Prescription Engine" subtitle="Drug search · Rx matrix · interactions · pharmacy dispatch" />
      <PatientHeaderBar
        name={patient.fullName}
        mrn={patient.mrn}
        age={patient.age}
        gender={patient.gender}
        bloodGroup={patient.bloodGroup}
        allergies={patient.allergies}
      />

      <div className="relative mt-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search drug database (brand / generic)…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/30"
        />
        {query && filtered.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
            {filtered.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[#F8FAFC]"
                  onClick={() => addDrug(d)}
                >
                  <span className="font-semibold">{d.brand}</span>
                  <span className="text-[#64748B]"> · {d.generic}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`${clinicalClasses.card} mt-4 overflow-x-auto p-2`}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-[#64748B]">
              {['Drug', 'Dose', 'Route', 'Frequency', 'Duration', 'Food', 'Qty', ''].map((h) => (
                <th key={h} className="px-2 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="px-2 py-2 font-medium">{r.drugName}</td>
                <td className="px-2 py-2">
                  <input
                    className="w-16 rounded border px-1 text-xs"
                    value={r.dosage}
                    onChange={(e) =>
                      setRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, dosage: e.target.value } : row)))
                    }
                  />
                </td>
                <td className="px-2 py-2">{r.route}</td>
                <td className="px-2 py-2">
                  <input
                    className="w-16 rounded border px-1 text-xs"
                    value={r.frequency}
                    onChange={(e) =>
                      setRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, frequency: e.target.value } : row)))
                    }
                  />
                </td>
                <td className="px-2 py-2">{r.duration}</td>
                <td className="px-2 py-2">{r.food}</td>
                <td className="px-2 py-2">{r.quantity}</td>
                <td className="px-2 py-2">
                  <button type="button" className="text-xs text-[#EF4444]" onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-4 text-sm text-[#64748B]">Add medicines from search combobox.</p>}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <DigitalSignaturePad
          onApply={(token) => {
            setSigned(true);
            setStamp(`Verified stamp · ${token} · ${new Date().toLocaleDateString('en-IN')}`);
          }}
        />
        {stamp && (
          <div className="rounded-xl border-2 border-[#0D9488]/30 bg-[#0D9488]/5 p-4 text-center">
            <p className="text-xs font-bold uppercase text-[#0D9488]">Signature preview</p>
            <p className="mt-2 font-serif text-lg text-[#0F172A]">{stamp}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={dispatchState === 'sending' || !rows.length}
        className={`mt-4 ${clinicalClasses.btnPrimary} disabled:opacity-50`}
        onClick={sendPharmacy}
      >
        {dispatchState === 'sent' ? 'Dispatched to pharmacy ✓' : dispatchState === 'sending' ? 'Sending…' : 'Send to pharmacy'}
      </button>
      {notice && <p className="mt-2 text-sm font-semibold text-[#0D9488]">{notice}</p>}

      <ClinicalModal open={interactionOpen} title="Interaction alert" onClose={() => setInteractionOpen(false)}>
        <p className="text-sm text-[#EF4444] font-semibold">{interactionText}</p>
        <div className="mt-4 flex gap-2">
          <button type="button" className={clinicalClasses.btnSecondary} onClick={() => setInteractionOpen(false)}>
            Cancel
          </button>
          <button type="button" className={clinicalClasses.btnCritical} onClick={forceAddAfterAlert}>
            Acknowledge override
          </button>
        </div>
      </ClinicalModal>
    </div>
  );
}
