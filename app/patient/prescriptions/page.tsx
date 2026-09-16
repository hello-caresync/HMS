'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pill, Printer } from 'lucide-react';

import { PrescriptionCareRail } from '@/components/patient/PrescriptionCareRail';
import { PrescriptionSheet } from '@/components/patient/PrescriptionSheet';
import {
  readStoredPatientIdentity,
  type StoredPatientIdentity,
} from '@/lib/patient/active-patient-node';
import {
  normalizePrescriptionRow,
  prescriptionMatchesPatient,
  queryPrescriptionsForPatient,
  type NormalizedPrescription,
} from '@/lib/patient/prescriptions-feed';
import { supabase } from '@/lib/supabaseClient';
import { CACHE_KEYS, readLocalJson, writeLocalJson } from '@/lib/persistence/local-cache';

function prependPrescription(
  current: NormalizedPrescription[],
  incoming: NormalizedPrescription,
): NormalizedPrescription[] {
  if (!incoming.id) return current;
  if (current.some((item) => item.id === incoming.id)) return current;
  return [incoming, ...current];
}

export default function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<NormalizedPrescription[]>(() => {
    const cached = readLocalJson<NormalizedPrescription[]>(CACHE_KEYS.patientPrescriptions);
    return Array.isArray(cached) ? cached : [];
  });
  const [loading, setLoading] = useState(() => {
    const cached = readLocalJson<NormalizedPrescription[]>(CACHE_KEYS.patientPrescriptions);
    return !(Array.isArray(cached) && cached.length > 0);
  });
  const [selectedRxId, setSelectedRxId] = useState<string>('');
  const [patientName, setPatientName] = useState(() => readStoredPatientIdentity().patientName);
  const identityRef = useRef<StoredPatientIdentity>(readStoredPatientIdentity());

  const fetchPrescriptions = useCallback(async () => {
    const identity = readStoredPatientIdentity();
    identityRef.current = identity;
    setPatientName(identity.patientName);

    try {
      const rows = await queryPrescriptionsForPatient(identity);
      setPrescriptions(rows);
      writeLocalJson(CACHE_KEYS.patientPrescriptions, rows);
      setSelectedRxId((prev) => {
        if (prev && rows.some((row) => row.id === prev)) return prev;
        return rows[0]?.id ?? '';
      });
    } catch (err: unknown) {
      console.error('[Patient Prescriptions] unable to load live prescriptions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPrescriptions();

    const channel = supabase
      .channel('patient-prescriptions-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prescriptions',
        },
        (payload: { eventType?: string; new?: Record<string, unknown> }) => {
          try {
            if (payload.eventType === 'INSERT' && payload.new) {
              const incoming = normalizePrescriptionRow(payload.new);
              if (!prescriptionMatchesPatient(incoming, identityRef.current)) return;
              setPrescriptions((prev) => prependPrescription(prev, incoming));
              setSelectedRxId((prev) => prev || incoming.id);
              return;
            }
            void fetchPrescriptions();
          } catch (err: unknown) {
            console.error('[Patient Prescriptions] realtime update failed:', err);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchPrescriptions]);

  const activeRx = prescriptions.find((rx) => rx.id === selectedRxId) ?? prescriptions[0] ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 print:max-w-none print:p-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#EADBCE] pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-[#2B1810]">My Digital Prescriptions</h1>
          <p className="mt-0.5 text-xs text-[#7C5C48]">
            Facility:{' '}
            <span className="font-semibold text-[#8C5A3C]">HOSP-01 (Bengaluru)</span>
            {' · '}
            Verified Patient:{' '}
            <span className="font-semibold">{patientName || 'Patient'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#EADBCE] bg-white px-3 py-2 text-xs font-semibold text-[#7F5539] hover:bg-[#FAF6F0]"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live Sync
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-[#7C5C48]">Loading prescriptions...</div>
      ) : prescriptions.length === 0 ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="rounded-xl border border-[#EADBCE] bg-white py-12 text-center shadow-xs">
            <Pill className="mx-auto mb-3 h-8 w-8 text-[#EADBCE]" />
            <p className="text-sm font-semibold text-[#2B1810]">No prescriptions found yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-[#7C5C48]">
              When your doctor completes a consultation, your prescription will appear here instantly.
            </p>
          </div>
          <PrescriptionCareRail prescriptions={[]} activeRx={null} />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
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
                    {(rx.issued_at || rx.created_at || '').slice(0, 10)}
                  </button>
                ))}
              </div>
            ) : null}
            {activeRx ? <PrescriptionSheet rx={activeRx} /> : null}
          </div>
          <PrescriptionCareRail prescriptions={prescriptions} activeRx={activeRx} />
        </div>
      )}
    </div>
  );
}
