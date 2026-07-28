import {
  MOCK_ANALYTICS,
  MOCK_CALENDAR_EVENTS,
  MOCK_CHAT_CHANNELS,
  MOCK_CHAT_MESSAGES,
  MOCK_DOCTOR_PROFILE,
  MOCK_DRUG_CATALOG,
  MOCK_EMERGENCY_CASES,
  MOCK_IPD_CENSUS,
  MOCK_NOTIFICATIONS,
  MOCK_OPD_QUEUE,
  MOCK_PATIENTS,
  MOCK_TELEMEDICINE_SESSION,
  type ChatMessage,
  type ClinicalNotification,
  type MockPatient,
} from '@/lib/mock-data';

import { MOCK_EMR_TIMELINE } from '@/lib/doctor/mock-data';

export const mockProfile = {
  ...MOCK_DOCTOR_PROFILE,
  email: 'hospital@curasync.com',
  consultationFees: 800,
  workingHours: {
    monday: '09:00–17:00',
    tuesday: '09:00–17:00',
    wednesday: '09:00–13:00',
    thursday: '09:00–17:00',
    friday: '09:00–17:00',
  },
  hospital: { id: '00000000-0000-4000-a000-000000000001', name: 'Nexora Multispeciality Hospital', code: 'NX-HOSP-01' },
};

export const mockStore = {
  patients: [...MOCK_PATIENTS] as MockPatient[],
  opdQueue: MOCK_OPD_QUEUE.map((q) => ({ ...q, status: 'WAITING' as string })),
  notifications: MOCK_NOTIFICATIONS.map((n) => ({ ...n })) as ClinicalNotification[],
  messages: [...MOCK_CHAT_MESSAGES] as ChatMessage[],
  channels: [...MOCK_CHAT_CHANNELS],
  ipdCensus: [...MOCK_IPD_CENSUS],
  emergencyCases: [...MOCK_EMERGENCY_CASES],
  calendarEvents: [...MOCK_CALENDAR_EVENTS],
  analytics: MOCK_ANALYTICS,
  drugs: [...MOCK_DRUG_CATALOG],
  emrTimeline: [...MOCK_EMR_TIMELINE],
  telemedicine: { ...MOCK_TELEMEDICINE_SESSION },
  auditLogs: [] as Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    at: string;
    payload?: Record<string, unknown>;
  }>,
  labOrders: [
    {
      id: 'lab-1',
      patientId: 'pat-1',
      testCodesJson: ['HbA1c', 'LFT'],
      status: 'IN_PROGRESS',
      urgency: 'NORMAL',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'lab-2',
      patientId: 'pat-3',
      testCodesJson: ['BMP', 'Troponin'],
      status: 'ORDERED',
      urgency: 'STAT',
      createdAt: new Date().toISOString(),
    },
  ],
  clinicalOrders: [
    { id: 'o-lab-1', type: 'lab' as const, patient: 'Aishwarya D S', test: 'HbA1c, LFT', status: 'Processing', dept: 'Laboratory', eta: '2–4h', progress: 65, createdAt: new Date().toISOString() },
    { id: 'o-rad-1', type: 'rad' as const, patient: 'K. Venkatesh', test: 'CT Chest · STAT', status: 'Requested', dept: 'Radiology', eta: 'STAT', progress: 25, createdAt: new Date().toISOString() },
    { id: 'o-rx-1', type: 'rx' as const, patient: 'Aishwarya D S', test: 'Metformin 500mg', status: 'Sent To Pharmacy', dept: 'Pharmacy', eta: 'Done', progress: 100, createdAt: new Date().toISOString() },
  ],
};

let idCounter = 1000;
export function nextMockId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}
