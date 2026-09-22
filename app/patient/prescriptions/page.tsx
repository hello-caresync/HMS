'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pill } from 'lucide-react';

import { PendingConsultationCard } from '@/components/patient/PendingConsultationCard';
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
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 print:max-w-none print:p-0">
      <div className="mb-4 border-b border-[#EADBCE] pb-4 print:hidden">
        <h1 className="text-xl font-bold text-[#2B1810]">My Digital Prescriptions</h1>
        <p className="mt-0.5 text-xs text-[#7C5C48]">
          Verified Patient:{' '}
          <span className="font-semibold">{patientName || 'Patient'}</span>
          {' · '}
          {prescriptions.length} prescription{prescriptions.length === 1 ? '' : 's'} on record
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-[#7C5C48]">Loading prescriptions...</div>
      ) : !hasContent ? (
        <div className="rounded-xl border border-[#EADBCE] bg-white py-12 text-center shadow-xs">
          <Pill className="mx-auto mb-3 h-8 w-8 text-[#EADBCE]" />
          <p className="text-sm font-semibold text-[#2B1810]">No prescriptions found yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-[#7C5C48]">
            When your doctor completes a consultation, your prescription will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingConsultation ? (
            <PendingConsultationCard consultation={pendingConsultation} />
          ) : null}

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
                          ? 'border-[#8C5A3C] bg-[#8C5A3C] text-white'
                          : 'border-[#EADBCE] bg-white text-[#7C5C48] hover:border-[#8C5A3C]'
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
      )}
    </div>
  );
}
