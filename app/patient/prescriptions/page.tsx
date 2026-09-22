'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pill } from 'lucide-react';

import { PendingConsultationCard } from '@/components/patient/PendingConsultationCard';
import { PrescriptionGuidanceRail } from '@/components/patient/PrescriptionGuidanceRail';
import { PrescriptionMetricsRow } from '@/components/patient/PrescriptionMetricsRow';
import { PrescriptionSheet } from '@/components/patient/PrescriptionSheet';
import {
  readStoredPatientIdentity,
  type StoredPatientIdentity,
} from '@/lib/patient/active-patient-node';
import {
  fetchPatientPrescriptionsFeed,
  normalizePrescriptionRow,
  prescriptionMatchesPatient,
  type NormalizedPrescription,
  type PendingConsultation,
} from '@/lib/patient/prescriptions-feed';
import { createClient } from '@/lib/supabase/client';

function prependPrescription(
  current: NormalizedPrescription[],
  incoming: NormalizedPrescription,
): NormalizedPrescription[] {
  if (!incoming.id) return current;
  if (current.some((item) => item.id === incoming.id)) return current;
  return [incoming, ...current].sort((a, b) => {
    const aTime = a.created_at ? Date.parse(a.created_at) : 0;
    const bTime = b.created_at ? Date.parse(b.created_at) : 0;
    return bTime - aTime;
  });
}

export default function PatientPrescriptionsPage() {
  const supabase = createClient();
  const [prescriptions, setPrescriptions] = useState<NormalizedPrescription[]>([]);
  const [pendingConsultation, setPendingConsultation] = useState<PendingConsultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRxId, setSelectedRxId] = useState<string>('');
  const [patientName, setPatientName] = useState(() => readStoredPatientIdentity().patientName);
  const identityRef = useRef<StoredPatientIdentity>(readStoredPatientIdentity());

  const fetchPrescriptions = useCallback(async () => {
    const identity = readStoredPatientIdentity();
    identityRef.current = identity;
    setPatientName(identity.patientName);
    setLoading(true);

    try {
      const feed = await fetchPatientPrescriptionsFeed(supabase);
      setPrescriptions(feed.prescriptions);
      setPendingConsultation(feed.pendingConsultation);
      setSelectedRxId((prev) => {
        if (prev && feed.prescriptions.some((row) => row.id === prev)) return prev;
        return feed.prescriptions[0]?.id ?? '';
      });
    } catch (err: unknown) {
      console.error('[Patient Prescriptions] unable to load live prescriptions:', err);
      setPrescriptions([]);
      setPendingConsultation(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchPrescriptions();

    const channel = supabase
      .channel('patient-prescriptions-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prescriptions' },
        (payload: { eventType?: string; new?: Record<string, unknown> }) => {
          try {
            if (payload.eventType === 'INSERT' && payload.new) {
              const incoming = normalizePrescriptionRow(payload.new);
              if (!prescriptionMatchesPatient(incoming, identityRef.current)) return;
              setPrescriptions((prev) => prependPrescription(prev, incoming));
              setSelectedRxId(incoming.id);
              void fetchPrescriptions();
              return;
            }
            void fetchPrescriptions();
          } catch (err: unknown) {
            console.error('[Patient Prescriptions] realtime update failed:', err);
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          void fetchPrescriptions();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchPrescriptions, supabase]);

  const activeRx = prescriptions.find((rx) => rx.id === selectedRxId) ?? prescriptions[0] ?? null;
  const hasContent = Boolean(pendingConsultation || prescriptions.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 print:max-w-none print:p-0">
      <div className="mb-6 border-b border-sky-100 pb-5 print:hidden">
        <h1 className="text-2xl font-bold text-slate-900">My Digital Prescriptions</h1>
        <p className="mt-1 text-sm text-slate-600">
          Verified Patient:{' '}
          <span className="font-semibold text-slate-900">{patientName || 'Patient'}</span>
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-sky-100 bg-white/90 py-16 text-center text-sm text-slate-600 shadow-sm">
          Loading prescriptions...
        </div>
      ) : !hasContent ? (
        <div className="rounded-2xl border border-sky-100 bg-white/90 py-16 text-center shadow-sm">
          <Pill className="mx-auto mb-3 h-10 w-10 text-sky-200" />
          <p className="text-sm font-semibold text-slate-900">No prescriptions found yet</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-600">
            When your doctor completes a consultation, your prescription will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <PrescriptionMetricsRow
            pendingCount={pendingConsultation ? 1 : 0}
            prescriptionCount={prescriptions.length}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {pendingConsultation ? <PendingConsultationCard consultation={pendingConsultation} /> : null}

              {prescriptions.length > 0 ? (
                <div className="space-y-3">
                  {prescriptions.length > 1 ? (
                    <div className="flex flex-wrap gap-2 print:hidden">
                      {prescriptions.map((rx) => (
                        <button
                          key={rx.id}
                          type="button"
                          onClick={() => setSelectedRxId(rx.id)}
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                            rx.id === activeRx?.id
                              ? 'border-sky-600 bg-sky-600 text-white'
                              : 'border-sky-100 bg-white text-slate-600 hover:border-sky-300'
                          }`}
                        >
                          {rx.doctor_name || 'Prescription'} ·{' '}
                          {new Date(rx.created_at || rx.issued_at || '').toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {activeRx ? <PrescriptionSheet rx={activeRx} /> : null}
                </div>
              ) : null}
            </div>

            <PrescriptionGuidanceRail showPendingTips={Boolean(pendingConsultation)} />
          </div>
        </div>
      )}
    </div>
  );
}
