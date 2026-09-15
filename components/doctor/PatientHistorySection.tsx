'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Pill, User } from 'lucide-react';

import type { DoctorConsultationFeedItem } from '@/lib/doctor/doctor-consultation-feed';

type PatientHistorySectionProps = {
  feed: DoctorConsultationFeedItem[];
  isLoading?: boolean;
  autoExpandId?: string | null;
  onAutoExpandConsumed?: () => void;
};

function formatToken(token?: string | number | null): string {
  if (token === undefined || token === null || String(token).trim() === '') return '—';
  return `#${String(token).replace(/^#/, '')}`;
}

function formatStatusBadge(status: string): string {
  return String(status ?? 'completed').trim().replace(/_/g, ' ').toUpperCase();
}

function statusBadgeClasses(status: string): string {
  const value = String(status ?? '').toLowerCase();
  if (/billing/.test(value)) return 'text-amber-700 bg-amber-50 border-amber-200/60';
  if (/complete|done|paid/.test(value)) return 'text-emerald-700 bg-emerald-50 border-emerald-200/60';
  return 'text-slate-600 bg-slate-100 border-slate-200/60';
}

function FeedDetailView({
  item,
  onBack,
}: {
  item: DoctorConsultationFeedItem;
  onBack: () => void;
}) {
  const completedAt = item.completed_at || item.updated_at || item.created_at;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Recent History
      </button>

      <div className="rounded-xl border border-slate-200 bg-slate-900 p-3.5 text-white">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-black">{item.patient_name}</h3>
            <p className="mt-0.5 text-[11px] text-slate-300">
              {item.age ? `${item.age} Yrs` : '—'} • {item.gender || '—'}
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-300">
            {formatToken(item.token_number)}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
          <span
            className={`rounded border px-1.5 py-0.5 font-bold uppercase ${statusBadgeClasses(item.status)}`}
          >
            {formatStatusBadge(item.status)}
          </span>
          <span className="text-slate-400">
            Completed {new Date(completedAt).toLocaleString('en-IN')}
          </span>
        </div>
        {item.vitals_summary ? (
          <p className="mt-2 font-mono text-[11px] text-emerald-200">{item.vitals_summary}</p>
        ) : null}
      </div>

      <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3">
        <div className="text-[10px] font-black uppercase tracking-wide text-teal-900">
          Clinical Diagnosis &amp; Symptoms
        </div>
        <p className="mt-1 text-xs font-bold text-teal-950">
          {item.diagnosis || item.chief_complaint || 'General Consultation'}
        </p>
        {item.clinical_notes ? (
          <p className="mt-1.5 text-[11px] leading-relaxed text-teal-900/80">{item.clinical_notes}</p>
        ) : null}
      </div>

      {item.doctor_instructions ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-[10px] font-black uppercase tracking-wide text-slate-600">
            Doctor&apos;s Instructions &amp; Dietary Advice
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-700">{item.doctor_instructions}</p>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-slate-700">
          <Pill className="h-3.5 w-3.5 text-teal-700" />
          Prescriptions Dossier
        </div>
        {item.prescriptions.length === 0 ? (
          <p className="text-[11px] text-slate-400">No medicines recorded for this visit.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {item.prescriptions.map((med) => (
              <div
                key={`${item.id}-${med.name}-${med.dosage ?? ''}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2.5"
              >
                <span className="min-w-0 truncate text-xs font-semibold text-slate-800">{med.name}</span>
                <div className="flex shrink-0 items-center gap-1.5 text-[10px] text-slate-600">
                  {med.frequency || med.dosage ? (
                    <span className="rounded border border-emerald-200/60 bg-emerald-50 px-1.5 py-0.5 font-mono font-medium text-emerald-700">
                      {med.frequency || med.dosage}
                    </span>
                  ) : null}
                  {med.duration ? <span>{med.duration}</span> : null}
                  <span className="font-medium text-slate-700">Qty: {med.quantity ?? 1}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PatientHistorySection({
  feed,
  isLoading,
  autoExpandId,
  onAutoExpandConsumed,
}: PatientHistorySectionProps) {
  const [activeHistoryItem, setActiveHistoryItem] = useState<DoctorConsultationFeedItem | null>(null);

  useEffect(() => {
    if (!autoExpandId) return;
    const match = feed.find((item) => item.id === autoExpandId || item.appointment_id === autoExpandId);
    if (match) {
      setActiveHistoryItem(match);
      onAutoExpandConsumed?.();
    }
  }, [autoExpandId, feed, onAutoExpandConsumed]);

  if (isLoading && feed.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-xs text-slate-400">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading consultation feed...
      </div>
    );
  }

  if (activeHistoryItem) {
    return <FeedDetailView item={activeHistoryItem} onBack={() => setActiveHistoryItem(null)} />;
  }

  if (feed.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center text-xs text-slate-400">
        <User className="mb-2 h-8 w-8 text-slate-300" />
        No consultations recorded yet today.
      </div>
    );
  }

  return (
    <div className="flex max-h-[calc(100vh-220px)] min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
      {feed.map((item) => (
        <div
          key={item.id}
          role="button"
          tabIndex={0}
          onClick={() => setActiveHistoryItem(item)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setActiveHistoryItem(item);
            }
          }}
          className="flex cursor-pointer flex-col gap-1.5 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-400 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900">{item.patient_name}</span>
            <span className="text-[11px] font-mono text-slate-400">
              {new Date(item.updated_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="rounded border border-emerald-200/60 bg-emerald-50 px-1.5 py-0.5 font-mono text-emerald-700">
              {formatToken(item.token_number)}
            </span>
            <span className="truncate">{item.diagnosis || item.chief_complaint || 'General Consultation'}</span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-1 text-[11px] text-slate-400">
            <span>Click to view full dossier →</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${statusBadgeClasses(item.status)}`}
            >
              {formatStatusBadge(item.status)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
