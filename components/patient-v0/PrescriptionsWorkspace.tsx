'use client';

import { useState } from 'react';
import { Download, Pill } from 'lucide-react';

import { v0Ui, statusBadge } from '@/components/patient-v0/ui';
import { PatientStatusBanner } from '@/components/patient/PatientStatusBanner';
import { formatDateLabel, usePatientPrescriptions } from '@/lib/ecosystem/hooks';
import { usePatientAuth } from '@/lib/patient/auth/PatientAuthProvider';

export function PrescriptionsWorkspace() {
  const { session } = usePatientAuth();
  const patientId = session?.patientId ?? null;
  const prescriptions = usePatientPrescriptions(patientId);
  const [notice, setNotice] = useState<string | null>(null);

  const active = prescriptions.filter((p) => p.status === 'active');
  const previous = prescriptions.filter((p) => p.status === 'completed');

  const downloadPdf = (label: string) => {
    setNotice(`Prescription PDF for ${label} is ready`);
    setTimeout(() => setNotice(null), 3500);
  };

  return (
    <div className={v0Ui.page}>
      <header>
        <h1 className={v0Ui.pageTitle}>Prescriptions</h1>
        <p className={v0Ui.pageSubtitle}>Current and previous medicines from your doctors</p>
      </header>

      {notice && <PatientStatusBanner message={notice} variant="success" />}

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-patient-plum">
          <Pill className="h-5 w-5 text-patient-primary" /> Current Prescriptions
        </h2>
        {active.length === 0 ? (
          <div className={v0Ui.empty}><p className="text-sm text-patient-lavender">No active prescriptions</p></div>
        ) : (
          active.map((rx) => (
            <PrescriptionCard key={rx.id} rx={rx} onDownload={() => downloadPdf(rx.doctorName)} />
          ))
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-black text-patient-plum">Previous Prescriptions</h2>
        {previous.length === 0 ? (
          <p className="text-sm text-patient-lavender">Completed courses appear here</p>
        ) : (
          previous.map((rx) => (
            <PrescriptionCard key={rx.id} rx={rx} onDownload={() => downloadPdf(rx.doctorName)} muted />
          ))
        )}
      </section>
    </div>
  );
}

function PrescriptionCard({
  rx,
  onDownload,
  muted,
}: {
  rx: ReturnType<typeof usePatientPrescriptions>[0];
  onDownload: () => void;
  muted?: boolean;
}) {
  return (
    <article className={`${v0Ui.card} mb-4 ${muted ? 'opacity-80' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black text-patient-plum">{rx.doctorName}</p>
          <p className="text-xs text-patient-lavender">{formatDateLabel(rx.issuedAt)}</p>
        </div>
        <span className={`${v0Ui.badge} ${statusBadge[rx.status]}`}>{rx.status}</span>
      </div>
      <ul className="mt-4 space-y-3">
        {rx.medicines.map((m) => (
          <li key={m.id} className="rounded-xl border border-patient-lavender/30 bg-patient-lavender/5 p-3">
            <p className="font-bold text-patient-charcoal">{m.name} <span className="text-patient-primary">{m.dosage}</span></p>
            <p className="text-sm text-patient-charcoal">{m.frequency} · {m.duration}</p>
            <p className="mt-1 text-xs text-patient-lavender">{m.instructions}</p>
          </li>
        ))}
      </ul>
      {rx.notes && <p className="mt-3 text-sm text-patient-lavender">{rx.notes}</p>}
      <button type="button" onClick={onDownload} className={`${v0Ui.btnSecondary} mt-4`}>
        <Download className="h-4 w-4" /> Download PDF
      </button>
    </article>
  );
}
