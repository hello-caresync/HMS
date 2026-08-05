'use client';

import { useState } from 'react';
import { Download, FileText, HeartPulse, History, ScanLine, TestTube } from 'lucide-react';

import { v0Ui, statusBadge } from '@/components/patient-v0/ui';
import { PatientStatusBanner } from '@/components/patient/PatientStatusBanner';
import { formatDateLabel, useMedicalRecords } from '@/lib/ecosystem/hooks';
import { usePatientAuth } from '@/lib/patient/auth/PatientAuthProvider';

type Tab = 'timeline' | 'visits' | 'vitals' | 'labs' | 'radiology';

export function RecordsWorkspace() {
  const { session } = usePatientAuth();
  const patientId = session?.patientId ?? null;
  const { visits, vitals, labs, rad } = useMedicalRecords(patientId);
  const [tab, setTab] = useState<Tab>('timeline');
  const [notice, setNotice] = useState<string | null>(null);

  const timeline = [
    ...visits.map((v) => ({ id: v.id, date: v.date, title: v.diagnosis, type: 'Visit' as const, detail: v.summary })),
    ...labs.filter((l) => l.status === 'ready').map((l) => ({
      id: l.id,
      date: l.completedAt ?? l.orderedAt,
      title: l.testName,
      type: 'Lab' as const,
      detail: l.resultSummary ?? 'Results available',
    })),
    ...rad.filter((r) => r.status === 'completed').map((r) => ({
      id: r.id,
      date: r.completedAt ?? r.orderedAt,
      title: r.studyName,
      type: 'Radiology' as const,
      detail: r.findings ?? 'Report available',
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const handleDownload = (label: string) => {
    setNotice(`${label} PDF generated · ready to download`);
    setTimeout(() => setNotice(null), 3500);
  };

  return (
    <div className={v0Ui.page}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={v0Ui.pageTitle}>Medical Records</h1>
          <p className={v0Ui.pageSubtitle}>Visit history, vitals, lab and imaging reports</p>
        </div>
        <button type="button" onClick={() => handleDownload('Complete health record')} className={v0Ui.btnSecondary}>
          <Download className="h-4 w-4" /> Download All Records
        </button>
      </header>

      {notice && <PatientStatusBanner message={notice} variant="success" />}

      <nav className="flex flex-wrap gap-2">
        {([
          ['timeline', History, 'Timeline'],
          ['visits', FileText, 'Visits'],
          ['vitals', HeartPulse, 'Vitals'],
          ['labs', TestTube, 'Laboratory'],
          ['radiology', ScanLine, 'Radiology'],
        ] as const).map(([id, Icon, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${
              tab === id ? 'bg-patient-primary text-white' : 'border border-patient-lavender/30 bg-white'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </nav>

      {tab === 'timeline' && (
        <section className={v0Ui.card}>
          {timeline.length === 0 ? (
            <p className="text-sm text-patient-lavender">Your health timeline will populate after consultations and tests.</p>
          ) : (
            <ol className="space-y-4 border-l-2 border-patient-lavender/30 pl-6">
              {timeline.map((item) => (
                <li key={item.id} className="relative">
                  <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-patient-primary" />
                  <p className="text-xs font-bold text-patient-lavender">{formatDateLabel(item.date)} · {item.type}</p>
                  <p className="font-black text-patient-plum">{item.title}</p>
                  <p className="text-sm text-patient-charcoal">{item.detail}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {tab === 'visits' && (
        <section className="space-y-3">
          {visits.length === 0 ? (
            <div className={v0Ui.empty}><p className="text-sm text-patient-lavender">No visit history yet</p></div>
          ) : (
            visits.map((v) => (
              <article key={v.id} className={v0Ui.card}>
                <p className="font-black text-patient-plum">{v.diagnosis}</p>
                <p className="text-sm text-patient-primary">{v.doctorName} · {v.department}</p>
                <p className="mt-2 text-sm">{v.summary}</p>
                <p className="mt-2 text-xs text-patient-lavender">{formatDateLabel(v.date)}</p>
              </article>
            ))
          )}
        </section>
      )}

      {tab === 'vitals' && (
        <section className={v0Ui.card}>
          {vitals.length === 0 ? (
            <p className="text-sm text-patient-lavender">Vitals recorded during visits appear here.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vitals.map((v) => (
                <div key={v.id} className="rounded-xl border border-patient-lavender/30 p-4">
                  <p className="text-xs font-bold text-patient-lavender">{formatDateLabel(v.recordedAt)}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div><dt className="text-xs text-patient-lavender">BP</dt><dd className="font-bold">{v.bp}</dd></div>
                    <div><dt className="text-xs text-patient-lavender">Pulse</dt><dd className="font-bold">{v.pulse}</dd></div>
                    <div><dt className="text-xs text-patient-lavender">SpO2</dt><dd className="font-bold">{v.spo2}</dd></div>
                    <div><dt className="text-xs text-patient-lavender">Temp</dt><dd className="font-bold">{v.temperature}</dd></div>
                  </dl>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'labs' && (
        <section className="space-y-3">
          {labs.map((l) => (
            <article key={l.id} className={v0Ui.card}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-black">{l.testName}</p>
                  <p className="text-sm text-patient-lavender">{l.doctorName}</p>
                  {l.resultSummary && <p className="mt-2 text-sm">{l.resultSummary}</p>}
                </div>
                <span className={`${v0Ui.badge} ${statusBadge[l.status]}`}>{l.status}</span>
              </div>
              {l.status === 'ready' && (
                <button type="button" onClick={() => handleDownload(l.testName)} className={`${v0Ui.btnSecondary} mt-3`}>
                  <Download className="h-4 w-4" /> Download Report
                </button>
              )}
            </article>
          ))}
        </section>
      )}

      {tab === 'radiology' && (
        <section className="space-y-3">
          {rad.map((r) => (
            <article key={r.id} className={v0Ui.card}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-black">{r.studyName}</p>
                  <p className="text-sm text-patient-lavender">{r.doctorName}</p>
                  {r.findings && <p className="mt-2 text-sm">{r.findings}</p>}
                </div>
                <span className={`${v0Ui.badge} ${statusBadge[r.status]}`}>{r.status}</span>
              </div>
              {r.status === 'completed' && (
                <button type="button" onClick={() => handleDownload(r.studyName)} className={`${v0Ui.btnSecondary} mt-3`}>
                  <Download className="h-4 w-4" /> Download Report
                </button>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
