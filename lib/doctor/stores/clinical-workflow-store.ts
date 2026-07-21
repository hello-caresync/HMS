import { create } from 'zustand';

import type { EmergencyCase, OpdQueuePatient } from '@/types/clinical';

type ClinicalWorkflowState = {
  opdQueue: OpdQueuePatient[];
  completedConsultationsToday: number;
  pharmacySentCount: number;
  emergencyCases: EmergencyCase[];
  statLabAlerts: number;
  activeTeleSession: boolean;
  notifications: { id: string; title: string; body: string }[];

  startNextOpd: () => OpdQueuePatient | null;
  completeConsultation: (queueId: string, sentToPharmacy: boolean) => void;
  triggerCriticalAlert: (message: string) => void;
  issueStatLab: (caseId: string) => void;
  mockCriticalLabResult: () => void;
  startTeleSession: () => void;
  endTeleSession: (prescriptionSent: boolean) => void;
};

const INITIAL_QUEUE: OpdQueuePatient[] = [
  {
    id: 'q1',
    token: 'OPD-102',
    patientId: 'pat-1',
    patientName: 'Aishwarya D S',
    chiefComplaint: 'Fatigue · diabetes review',
    priority: 'Routine',
    waitMinutes: 12,
  },
  {
    id: 'q2',
    token: 'OPD-103',
    patientId: 'pat-3',
    patientName: 'K. Venkatesh',
    chiefComplaint: 'Syncope · orthostatic vitals',
    priority: 'Urgent',
    waitMinutes: 4,
  },
];

const INITIAL_EMERGENCY: EmergencyCase[] = [
  {
    id: 'er-1',
    triageLevel: 2,
    patientName: 'Unknown Male',
    presentation: 'Chest pain · STEMI rule-out',
    bay: 'Trauma Bay 3',
    statOrdersPending: 2,
  },
];

export const useClinicalWorkflowStore = create<ClinicalWorkflowState>((set, get) => ({
  opdQueue: INITIAL_QUEUE,
  completedConsultationsToday: 6,
  pharmacySentCount: 4,
  emergencyCases: INITIAL_EMERGENCY,
  statLabAlerts: 0,
  activeTeleSession: false,
  notifications: [],

  startNextOpd: () => {
    const queue = get().opdQueue;
    if (!queue.length) return null;
    return queue[0];
  },

  completeConsultation: (queueId, sentToPharmacy) =>
    set((s) => ({
      opdQueue: s.opdQueue.filter((q) => q.id !== queueId),
      completedConsultationsToday: s.completedConsultationsToday + 1,
      pharmacySentCount: sentToPharmacy ? s.pharmacySentCount + 1 : s.pharmacySentCount,
    })),

  triggerCriticalAlert: (message) =>
    set((s) => ({
      notifications: [
        { id: `n-${Date.now()}`, title: 'Critical Alert', body: message },
        ...s.notifications,
      ],
    })),

  issueStatLab: (caseId) =>
    set((s) => ({
      emergencyCases: s.emergencyCases.map((c) =>
        c.id === caseId ? { ...c, statOrdersPending: Math.max(0, c.statOrdersPending - 1) } : c,
      ),
    })),

  mockCriticalLabResult: () =>
    set((s) => ({
      statLabAlerts: s.statLabAlerts + 1,
      notifications: [
        {
          id: `lab-${Date.now()}`,
          title: 'STAT Lab Result',
          body: 'Potassium 6.2 mmol/L — critical high · immediate review',
        },
        ...s.notifications,
      ],
    })),

  startTeleSession: () => set({ activeTeleSession: true }),

  endTeleSession: (prescriptionSent) =>
    set((s) => ({
      activeTeleSession: false,
      pharmacySentCount: prescriptionSent ? s.pharmacySentCount + 1 : s.pharmacySentCount,
      completedConsultationsToday: s.completedConsultationsToday + 1,
    })),
}));
