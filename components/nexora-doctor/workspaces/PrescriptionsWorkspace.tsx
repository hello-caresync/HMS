'use client';

import { useMemo, useState } from 'react';
import { Plus, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { ui } from '@/components/nexora-doctor/ui/primitives';
import { EmptyState, SectionHeader } from '@/components/nexora-doctor/ui/shared';
import { doctorUi } from '@/lib/nexora-doctor/design-tokens';
import { useDrugCatalog, usePatients } from '@/lib/nexora-doctor/hooks';
import { useDoctorClinicalStore } from '@/lib/nexora-doctor/store';
import type { PrescriptionItem } from '@/lib/nexora-doctor/types';

export function PrescriptionsWorkspace() {
  const patients = usePatients();
  const drugs = useDrugCatalog();
  const prescriptions = useDoctorClinicalStore((s) => s.prescriptions);
  const addPrescription = useDoctorClinicalStore((s) => s.addPrescription);

  const [patientId, setPatientId] = useState(patients[0]?.id ?? '');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [newDrug, setNewDrug] = useState('');

  const patient = patients.find((p) => p.id === patientId);
  const history = useMemo(
    () => prescriptions.filter((p) => !patientId || p.patientId === patientId),
    [prescriptions, patientId],
  );

  const addLine = () => {
    if (!newDrug) return;
    setItems((prev) => [
      ...prev,
      {
        id: `draft-${Date.now()}`,
        drug: newDrug,
        dose: '—',
        frequency: 'OD',
        duration: '7 days',
      },
    ]);
    setNewDrug('');
  };

  const handleSend = () => {
    if (!patient || items.length === 0) {
      toast.error('Select a patient and add at least one medicine');
      return;
    }
    addPrescription({
      patientId: patient.id,
      patientName: patient.fullName,
      medicines: items,
      notes,
      status: 'sent',
    });
    toast.success('Prescription sent · visible in patient medical records');
    setItems([]);
    setNotes('');
  };

  return (
    <div className={ui.page}>
      <div className="mb-8">
        <h1 className={ui.pageTitle}>Prescriptions</h1>
        <p className={ui.pageSubtitle}>Issue digital prescriptions synced to the patient app</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={ui.card}>
          <SectionHeader title="New Prescription" />
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#2C3531]/60">Patient</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className={`${ui.select} mt-1 w-full`}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} · {p.mrn}
                  </option>
                ))}
              </select>
            </div>

            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="flex gap-2 rounded-lg bg-[#F4F6F0] p-3 text-sm">
                  <input
                    value={item.drug}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x) => (x.id === item.id ? { ...x, drug: e.target.value } : x)),
                      )
                    }
                    className={`${ui.input} flex-1`}
                    placeholder="Medicine"
                  />
                  <input
                    value={item.dose}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x) => (x.id === item.id ? { ...x, dose: e.target.value } : x)),
                      )
                    }
                    className={`${ui.input} w-20`}
                    placeholder="Dose"
                  />
                  <input
                    value={item.frequency}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x) => (x.id === item.id ? { ...x, frequency: e.target.value } : x)),
                      )
                    }
                    className={`${ui.input} w-20`}
                    placeholder="Freq"
                  />
                  <input
                    value={item.duration}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x) => (x.id === item.id ? { ...x, duration: e.target.value } : x)),
                      )
                    }
                    className={`${ui.input} w-24`}
                    placeholder="Duration"
                  />
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                    className="text-[#D96B52]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex gap-2">
              <select value={newDrug} onChange={(e) => setNewDrug(e.target.value)} className={ui.select}>
                <option value="">Add medicine…</option>
                {drugs.map((d) => (
                  <option key={d.id} value={d.brand}>
                    {d.brand}
                  </option>
                ))}
              </select>
              <button type="button" onClick={addLine} className={ui.btnSecondary}>
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${ui.input} resize-none`}
              placeholder="Notes for patient / pharmacy"
            />

            <button type="button" onClick={handleSend} className={ui.btnPrimary}>
              <Send className="h-4 w-4" /> Send Prescription
            </button>
          </div>
        </section>

        <section className={doctorUi.rxPreview}>
          <SectionHeader title="Preview" />
          {patient ? (
            <>
              <p className="text-sm font-semibold text-[#2C3531]">{patient.fullName}</p>
              <p className="text-xs text-[#2C3531]/60">{patient.mrn}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {items.length === 0 ? (
                  <li className="text-[#2C3531]/60">Add medicines to preview Rx</li>
                ) : (
                  items.map((item) => (
                    <li key={item.id}>
                      {item.drug} — {item.dose} · {item.frequency} · {item.duration}
                    </li>
                  ))
                )}
              </ul>
              {notes && <p className="mt-4 text-xs text-[#2C3531]/70">Notes: {notes}</p>}
            </>
          ) : (
            <EmptyState title="Select a patient" />
          )}
        </section>
      </div>

      <section className={`${ui.card} mt-8`}>
        <SectionHeader title="Prescription History" />
        {history.length === 0 ? (
          <EmptyState title="No prescriptions yet" />
        ) : (
          <ul className="divide-y divide-[#E2E8E0]">
            {history.map((rx) => (
              <li key={rx.id} className="py-3 text-sm">
                <p className="font-medium">
                  {rx.patientName} · {new Date(rx.issuedAt).toLocaleString()}
                </p>
                <p className="text-[#2C3531]/70">
                  {rx.medicines.map((m) => m.drug).join(', ')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
