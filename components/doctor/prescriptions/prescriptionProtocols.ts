import type { DrugCatalogEntry } from '@/lib/mock-data';

export type ProtocolRxLine = {
  drugId?: string;
  brand: string;
  generic: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  food: string;
  quantity: string;
};

export type PrescriptionProtocol = {
  id: string;
  label: string;
  lines: ProtocolRxLine[];
};

export const PRESCRIPTION_PROTOCOLS: PrescriptionProtocol[] = [
  {
    id: 'htn',
    label: 'Hypertension Kit',
    lines: [
      {
        drugId: 'd7',
        brand: 'Amlodipine 5mg',
        generic: 'Amlodipine',
        dosage: '5mg',
        route: 'Oral',
        frequency: 'OD',
        duration: '30 Days',
        food: 'After food',
        quantity: '30',
      },
      {
        drugId: 'd5',
        brand: 'Atorvastatin 20mg',
        generic: 'Atorvastatin',
        dosage: '20mg',
        route: 'Oral',
        frequency: 'OD',
        duration: '30 Days',
        food: 'After food',
        quantity: '30',
      },
    ],
  },
  {
    id: 'dm',
    label: 'Diabetes Follow-up',
    lines: [
      {
        drugId: 'd1',
        brand: 'Metformin 500mg',
        generic: 'Metformin',
        dosage: '500mg',
        route: 'Oral',
        frequency: 'BID',
        duration: '30 Days',
        food: 'After food',
        quantity: '60',
      },
    ],
  },
  {
    id: 'analgesic',
    label: 'Acute Analgesic Set',
    lines: [
      {
        drugId: 'd6',
        brand: 'Paracetamol 650mg',
        generic: 'Paracetamol',
        dosage: '650mg',
        route: 'Oral',
        frequency: '1-0-1',
        duration: '5 Days',
        food: 'After food',
        quantity: '15',
      },
    ],
  },
];

export function routeLabel(route: string): string {
  if (route === 'PO') return 'Oral';
  if (route === 'IV') return 'IV';
  return route;
}

export function catalogEntryToLine(d: DrugCatalogEntry): ProtocolRxLine {
  return {
    drugId: d.id,
    brand: d.brand,
    generic: d.generic,
    dosage: '500mg',
    route: routeLabel(d.route),
    frequency: 'BID',
    duration: '7 Days',
    food: 'After food',
    quantity: '14',
  };
}
