'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import {
  createAdmission,
  SEED_ADMISSIONS,
  SEED_BEDS,
  WARDS,
} from '../lib/seedIpd';
import type {
  BillingClearancePayload,
  DischargeSummary,
  FloorId,
  IPDAdmission,
  IPDBed,
  IPDToast,
  Ward,
  WardId,
} from '../types';
import { computeRoomTariff, emptyDischargeSummary } from '../types';

type IPDContextValue = {
  wards: Ward[];
  beds: IPDBed[];
  admissions: Record<string, IPDAdmission>;
  toasts: IPDToast[];
  selectedAdmissionId: string | null;
  selectedWardFilter: WardId | 'all';
  selectedFloorFilter: FloorId | 'all';
  setSelectedWardFilter: (ward: WardId | 'all') => void;
  setSelectedFloorFilter: (floor: FloorId | 'all') => void;
  selectAdmission: (admissionId: string | null) => void;
  getBed: (bedId: string) => IPDBed | undefined;
  getAdmission: (admissionId: string) => IPDAdmission | undefined;
  getAdmissionForBed: (bedId: string) => IPDAdmission | undefined;
  getVacantBedsInWard: (wardId: WardId) => IPDBed[];
  occupancyStats: { total: number; occupied: number; available: number; housekeeping: number };
  admitPatient: (bedId: string, patientId: string, admittingDoctor: string) => { success: boolean; error?: string };
  transferBed: (fromBedId: string, toBedId: string, transferTimestamp: string) => { success: boolean; error?: string };
  logMarAdministration: (admissionId: string, marEntryId: string, time: string, nurseName?: string) => void;
  updateDischargeSummary: (admissionId: string, summary: DischargeSummary) => void;
  finalizeDischarge: (admissionId: string, summary: DischargeSummary) => {
    success: boolean;
    error?: string;
    payload?: BillingClearancePayload;
  };
  dismissToast: (id: string) => void;
};

const IPDContext = createContext<IPDContextValue | null>(null);

const DEFAULT_SELECTED = 'adm-seed-001';

function pushToast(prev: IPDToast[], message: string, type: IPDToast['type']): IPDToast[] {
  return [{ id: `ipd-toast-${Date.now()}`, message, type }, ...prev].slice(0, 5);
}

export function IPDProvider({ children }: { children: React.ReactNode }) {
  const [beds, setBeds] = useState<IPDBed[]>(SEED_BEDS);
  const [admissions, setAdmissions] = useState<Record<string, IPDAdmission>>({ ...SEED_ADMISSIONS });
  const [toasts, setToasts] = useState<IPDToast[]>([]);
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string | null>(DEFAULT_SELECTED);
  const [selectedWardFilter, setSelectedWardFilter] = useState<WardId | 'all'>('all');
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<FloorId | 'all'>('all');

  const selectAdmission = useCallback((admissionId: string | null) => {
    setSelectedAdmissionId(admissionId);
  }, []);

  const getBed = useCallback((bedId: string) => beds.find((b) => b.id === bedId), [beds]);

  const getAdmission = useCallback(
    (admissionId: string) => admissions[admissionId],
    [admissions],
  );

  const getAdmissionForBed = useCallback(
    (bedId: string) => {
      const bed = beds.find((b) => b.id === bedId);
      if (!bed?.admissionId) return undefined;
      return admissions[bed.admissionId];
    },
    [beds, admissions],
  );

  const getVacantBedsInWard = useCallback(
    (wardId: WardId) => beds.filter((b) => b.wardId === wardId && b.status === 'Available'),
    [beds],
  );

  const occupancyStats = useMemo(
    () => ({
      total: beds.length,
      occupied: beds.filter((b) => b.status === 'Occupied').length,
      available: beds.filter((b) => b.status === 'Available').length,
      housekeeping: beds.filter((b) => b.status === 'Housekeeping').length,
    }),
    [beds],
  );

  const admitPatient = useCallback(
    (bedId: string, patientId: string, admittingDoctor: string) => {
      const bed = beds.find((b) => b.id === bedId);
      if (!bed) return { success: false, error: 'Bed not found' };
      if (bed.status !== 'Available') return { success: false, error: 'Bed is not available' };

      const alreadyAdmitted = Object.values(admissions).some(
        (a) => a.patientId === patientId && a.status === 'Active',
      );
      if (alreadyAdmitted) {
        return { success: false, error: 'Patient already has an active IPD admission' };
      }

      const admission = createAdmission(patientId, admittingDoctor, bed.wardId);
      if (!admission) return { success: false, error: 'Invalid patient or ward' };

      setAdmissions((prev) => ({ ...prev, [admission.id]: admission }));
      setBeds((prev) =>
        prev.map((b) =>
          b.id === bedId ? { ...b, status: 'Occupied' as const, admissionId: admission.id } : b,
        ),
      );
      setSelectedAdmissionId(admission.id);
      setToasts((prev) =>
        pushToast(prev, `${admission.patientName} admitted to ${bed.bedLabel}`, 'success'),
      );

      return { success: true };
    },
    [beds, admissions],
  );

  const transferBed = useCallback(
    (fromBedId: string, toBedId: string, transferTimestamp: string) => {
      const fromBed = beds.find((b) => b.id === fromBedId);
      const toBed = beds.find((b) => b.id === toBedId);

      if (!fromBed || !toBed) return { success: false, error: 'Invalid bed selection' };
      if (fromBed.status !== 'Occupied' || !fromBed.admissionId) {
        return { success: false, error: 'Source bed is not occupied' };
      }
      if (toBed.status !== 'Available') {
        return { success: false, error: 'Target bed is not available' };
      }

      const admission = admissions[fromBed.admissionId];
      if (!admission || admission.recordLocked) {
        return { success: false, error: 'Admission record is locked or missing' };
      }

      const fromWard = WARDS.find((w) => w.id === fromBed.wardId)!;
      const toWard = WARDS.find((w) => w.id === toBed.wardId)!;

      const updatedHistory = admission.rateHistory.map((seg, i, arr) => {
        if (i === arr.length - 1 && !seg.to) return { ...seg, to: transferTimestamp };
        return seg;
      });

      updatedHistory.push({
        wardId: toWard.id,
        wardName: toWard.name,
        dailyRate: toWard.dailyRate,
        from: transferTimestamp,
      });

      const updatedAdmission: IPDAdmission = {
        ...admission,
        currentDailyRate: toWard.dailyRate,
        rateHistory: updatedHistory,
      };

      setAdmissions((prev) => ({ ...prev, [admission.id]: updatedAdmission }));
      setBeds((prev) =>
        prev.map((b) => {
          if (b.id === fromBedId) {
            return { ...b, status: 'Housekeeping' as const, admissionId: undefined };
          }
          if (b.id === toBedId) {
            return { ...b, status: 'Occupied' as const, admissionId: admission.id };
          }
          return b;
        }),
      );

      setToasts((prev) =>
        pushToast(
          prev,
          `Ward transfer · ${admission.patientName} → ${toBed.bedLabel} (${toWard.name}). ${fromWard.name} rate frozen.`,
          'info',
        ),
      );

      return { success: true };
    },
    [beds, admissions],
  );

  const logMarAdministration = useCallback(
    (admissionId: string, marEntryId: string, time: string, nurseName = 'Nurse on Shift') => {
      setAdmissions((prev) => {
        const adm = prev[admissionId];
        if (!adm || adm.recordLocked) return prev;

        const now = new Date().toISOString();
        const updatedMar = adm.clinical.marEntries.map((entry) => {
          if (entry.id !== marEntryId) return entry;
          return {
            ...entry,
            schedules: entry.schedules.map((slot) =>
              slot.time === time
                ? { ...slot, administered: true, administeredAt: now, administeredBy: nurseName }
                : slot,
            ),
          };
        });

        return {
          ...prev,
          [admissionId]: {
            ...adm,
            clinical: { ...adm.clinical, marEntries: updatedMar },
          },
        };
      });

      setToasts((prev) =>
        pushToast(prev, `MAR logged · ${time} dose verified & timestamped`, 'success'),
      );
    },
    [],
  );

  const updateDischargeSummary = useCallback((admissionId: string, summary: DischargeSummary) => {
    setAdmissions((prev) => {
      const adm = prev[admissionId];
      if (!adm || adm.recordLocked) return prev;
      return {
        ...prev,
        [admissionId]: { ...adm, dischargeSummary: summary, status: 'Discharge Pending' },
      };
    });
  }, []);

  const finalizeDischarge = useCallback(
    (admissionId: string, summary: DischargeSummary) => {
      const admission = admissions[admissionId];
      if (!admission) return { success: false, error: 'Admission not found' };
      if (admission.recordLocked) {
        return { success: false, error: 'Medical record already locked' };
      }

      const required = [
        summary.reasonForAdmission,
        summary.courseInHospital,
        summary.finalDiagnosis,
        summary.dischargeCondition,
        summary.followUpInstructions,
      ];
      if (required.some((f) => !f.trim())) {
        return { success: false, error: 'Complete all required discharge fields' };
      }

      const now = new Date().toISOString();
      const roomTariff = computeRoomTariff({ ...admission, billingClearanceAt: now });
      const pharmacyCharges = 18450 + admission.clinical.marEntries.length * 1200;

      const payload: BillingClearancePayload = {
        ledgerId: `IPD-FINAL-${admission.uhid.replace(/-/g, '')}-${Date.now().toString(36).slice(-5).toUpperCase()}`,
        roomTariffTotal: roomTariff,
        pharmacyCharges,
        totalOutstanding: roomTariff + pharmacyCharges,
        lockedAt: now,
      };

      const finalized: IPDAdmission = {
        ...admission,
        dischargeSummary: { ...summary, finalizedAt: now },
        status: 'Discharged',
        recordLocked: true,
        billingClearanceSent: true,
        billingClearanceAt: now,
        billingPayload: payload,
        rateHistory: admission.rateHistory.map((seg, i, arr) =>
          i === arr.length - 1 && !seg.to ? { ...seg, to: now } : seg,
        ),
      };

      setAdmissions((prev) => ({ ...prev, [admissionId]: finalized }));

      const bed = beds.find((b) => b.admissionId === admissionId);
      if (bed) {
        setBeds((prev) =>
          prev.map((b) =>
            b.id === bed.id ? { ...b, status: 'Housekeeping' as const, admissionId: undefined } : b,
          ),
        );
      }

      setSelectedAdmissionId(null);
      setToasts((prev) =>
        pushToast(
          prev,
          `[Central Billing] Ledger ${payload.ledgerId} locked · ₹${payload.totalOutstanding.toLocaleString('en-IN')} consolidated`,
          'alert',
        ),
      );

      return { success: true, payload };
    },
    [admissions, beds],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      wards: WARDS,
      beds,
      admissions,
      toasts,
      selectedAdmissionId,
      selectedWardFilter,
      selectedFloorFilter,
      setSelectedWardFilter,
      setSelectedFloorFilter,
      selectAdmission,
      getBed,
      getAdmission,
      getAdmissionForBed,
      getVacantBedsInWard,
      occupancyStats,
      admitPatient,
      transferBed,
      logMarAdministration,
      updateDischargeSummary,
      finalizeDischarge,
      dismissToast,
    }),
    [
      beds,
      admissions,
      toasts,
      selectedAdmissionId,
      selectedWardFilter,
      selectedFloorFilter,
      selectAdmission,
      getBed,
      getAdmission,
      getAdmissionForBed,
      getVacantBedsInWard,
      occupancyStats,
      admitPatient,
      transferBed,
      logMarAdministration,
      updateDischargeSummary,
      finalizeDischarge,
      dismissToast,
    ],
  );

  return <IPDContext.Provider value={value}>{children}</IPDContext.Provider>;
}

export function useIPD(): IPDContextValue {
  const ctx = useContext(IPDContext);
  if (!ctx) throw new Error('useIPD must be used within IPDProvider');
  return ctx;
}
