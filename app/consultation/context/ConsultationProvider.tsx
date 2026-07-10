'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { ACTIVE_ENCOUNTER } from '../lib/seedConsultation';
import type {
  ConsultationEncounter,
  DiagnosisEntry,
  FinalizeHandshake,
  FollowUpTimeline,
  LabOrderCode,
  PrescriptionLine,
  RadiologyOrderCode,
  ReferralType,
  SoapNotes,
} from '../types';
import { generateDiagnosisId, generatePrescriptionLineId } from '../types';

type ConsultationContextValue = {
  encounter: ConsultationEncounter;
  isLocked: boolean;
  handshake: FinalizeHandshake | null;
  updateSoap: (patch: Partial<SoapNotes>) => void;
  addDiagnosis: (entry: Omit<DiagnosisEntry, 'id'>) => void;
  removeDiagnosis: (id: string) => void;
  setPrimaryDiagnosis: (id: string) => void;
  addPrescription: (line: Omit<PrescriptionLine, 'id'>) => void;
  removePrescription: (id: string) => void;
  toggleLabOrder: (code: LabOrderCode) => void;
  toggleRadiologyOrder: (code: RadiologyOrderCode) => void;
  setFollowUp: (value: FollowUpTimeline) => void;
  setReferralType: (value: ReferralType) => void;
  setReferralNotes: (value: string) => void;
  setFollowUpDate: (value: string) => void;
  finalizeConsultation: () => FinalizeHandshake | null;
  resetEncounter: () => void;
};

const ConsultationContext = createContext<ConsultationContextValue | null>(null);

export function ConsultationProvider({ children }: { children: React.ReactNode }) {
  const [encounter, setEncounter] = useState<ConsultationEncounter>(ACTIVE_ENCOUNTER);
  const [handshake, setHandshake] = useState<FinalizeHandshake | null>(null);

  const isLocked = encounter.status === 'finalized';

  const updateSoap = useCallback((patch: Partial<SoapNotes>) => {
    setEncounter((prev) => {
      if (prev.status === 'finalized') return prev;
      return { ...prev, soap: { ...prev.soap, ...patch } };
    });
  }, []);

  const addDiagnosis = useCallback((entry: Omit<DiagnosisEntry, 'id'>) => {
    setEncounter((prev) => {
      if (prev.status === 'finalized') return prev;
      const isFirst = prev.diagnoses.length === 0;
      return {
        ...prev,
        diagnoses: [
          ...prev.diagnoses,
          { ...entry, id: generateDiagnosisId(), isPrimary: isFirst || entry.isPrimary },
        ],
      };
    });
  }, []);

  const removeDiagnosis = useCallback((id: string) => {
    setEncounter((prev) => {
      if (prev.status === 'finalized') return prev;
      const remaining = prev.diagnoses.filter((d) => d.id !== id);
      if (remaining.length > 0 && !remaining.some((d) => d.isPrimary)) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      return { ...prev, diagnoses: remaining };
    });
  }, []);

  const setPrimaryDiagnosis = useCallback((id: string) => {
    setEncounter((prev) => {
      if (prev.status === 'finalized') return prev;
      return {
        ...prev,
        diagnoses: prev.diagnoses.map((d) => ({ ...d, isPrimary: d.id === id })),
      };
    });
  }, []);

  const addPrescription = useCallback((line: Omit<PrescriptionLine, 'id'>) => {
    setEncounter((prev) => {
      if (prev.status === 'finalized') return prev;
      return {
        ...prev,
        prescriptions: [...prev.prescriptions, { ...line, id: generatePrescriptionLineId() }],
      };
    });
  }, []);

  const removePrescription = useCallback((id: string) => {
    setEncounter((prev) => {
      if (prev.status === 'finalized') return prev;
      return { ...prev, prescriptions: prev.prescriptions.filter((p) => p.id !== id) };
    });
  }, []);

  const toggleLabOrder = useCallback((code: LabOrderCode) => {
    setEncounter((prev) => {
      if (prev.status === 'finalized') return prev;
      const has = prev.labOrders.includes(code);
      return {
        ...prev,
        labOrders: has ? prev.labOrders.filter((c) => c !== code) : [...prev.labOrders, code],
      };
    });
  }, []);

  const toggleRadiologyOrder = useCallback((code: RadiologyOrderCode) => {
    setEncounter((prev) => {
      if (prev.status === 'finalized') return prev;
      const has = prev.radiologyOrders.includes(code);
      return {
        ...prev,
        radiologyOrders: has
          ? prev.radiologyOrders.filter((c) => c !== code)
          : [...prev.radiologyOrders, code],
      };
    });
  }, []);

  const setFollowUp = useCallback((value: FollowUpTimeline) => {
    setEncounter((prev) => (prev.status === 'finalized' ? prev : { ...prev, followUp: value }));
  }, []);

  const setReferralType = useCallback((value: ReferralType) => {
    setEncounter((prev) => (prev.status === 'finalized' ? prev : { ...prev, referralType: value }));
  }, []);

  const setReferralNotes = useCallback((value: string) => {
    setEncounter((prev) => (prev.status === 'finalized' ? prev : { ...prev, referralNotes: value }));
  }, []);

  const setFollowUpDate = useCallback((value: string) => {
    setEncounter((prev) => (prev.status === 'finalized' ? prev : { ...prev, followUpDate: value }));
  }, []);

  const finalizeConsultation = useCallback((): FinalizeHandshake | null => {
    if (encounter.status === 'finalized') return handshake;

    const signedAt = new Date().toISOString();
    const signatureId = `SIG-${Date.now().toString(36).toUpperCase()}`;
    const pharmacyLogId = `RX-LOG-${Date.now().toString(36).slice(-6).toUpperCase()}`;
    const billingLedgerId = `OPD-BILL-${encounter.uhid.replace(/-/g, '')}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    const finalized: ConsultationEncounter = {
      ...encounter,
      status: 'finalized',
      finalizedAt: signedAt,
      digitalSignatureId: signatureId,
    };

    const output: FinalizeHandshake = {
      encounterId: finalized.id,
      pharmacyLogId,
      billingLedgerId,
      prescriptionCount: finalized.prescriptions.length,
      labOrderCount: finalized.labOrders.length,
      radiologyOrderCount: finalized.radiologyOrders.length,
      signedAt,
      message: [
        `Digital signature ${signatureId} applied — consultation record locked.`,
        `${finalized.prescriptions.length} prescription line(s) routed to Pharmacy subsystem (${pharmacyLogId}).`,
        `OPD charges synchronized to central Billing Integration ledger (${billingLedgerId}).`,
        finalized.labOrders.length > 0
          ? `Lab orders dispatched: ${finalized.labOrders.join(', ')}.`
          : null,
        finalized.radiologyOrders.length > 0
          ? `Imaging requests dispatched: ${finalized.radiologyOrders.join(', ')}.`
          : null,
      ]
        .filter(Boolean)
        .join(' '),
    };

    setEncounter(finalized);
    setHandshake(output);
    return output;
  }, [encounter, handshake]);

  const resetEncounter = useCallback(() => {
    setEncounter({
      ...ACTIVE_ENCOUNTER,
      id: `enc-${Date.now().toString(36)}`,
      status: 'draft',
      diagnoses: [],
      prescriptions: [],
      labOrders: [],
      radiologyOrders: [],
      soap: { subjective: '', objective: '', assessment: '', plan: '' },
    });
    setHandshake(null);
  }, []);

  const value = useMemo(
    () => ({
      encounter,
      isLocked,
      handshake,
      updateSoap,
      addDiagnosis,
      removeDiagnosis,
      setPrimaryDiagnosis,
      addPrescription,
      removePrescription,
      toggleLabOrder,
      toggleRadiologyOrder,
      setFollowUp,
      setReferralType,
      setReferralNotes,
      setFollowUpDate,
      finalizeConsultation,
      resetEncounter,
    }),
    [
      encounter,
      isLocked,
      handshake,
      updateSoap,
      addDiagnosis,
      removeDiagnosis,
      setPrimaryDiagnosis,
      addPrescription,
      removePrescription,
      toggleLabOrder,
      toggleRadiologyOrder,
      setFollowUp,
      setReferralType,
      setReferralNotes,
      setFollowUpDate,
      finalizeConsultation,
      resetEncounter,
    ],
  );

  return <ConsultationContext.Provider value={value}>{children}</ConsultationContext.Provider>;
}

export function useConsultation(): ConsultationContextValue {
  const ctx = useContext(ConsultationContext);
  if (!ctx) throw new Error('useConsultation must be used within ConsultationProvider');
  return ctx;
}
