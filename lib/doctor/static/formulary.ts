/** Build-time formulary snapshot (matches prisma seed) — no DB worker for /api/formulary */
export const STATIC_FORMULARY_DRUGS = [
  { id: 'static-metformin', brand: 'Metformin 500mg', generic: 'Metformin', route: 'PO', interactsWith: [] as string[], allergyConflict: [] as string[] },
  { id: 'static-amox', brand: 'Amoxicillin 500mg', generic: 'Amoxicillin', route: 'PO', interactsWith: [] as string[], allergyConflict: ['Penicillin'] },
  { id: 'static-aspirin', brand: 'Aspirin 75mg', generic: 'Aspirin', route: 'PO', interactsWith: ['Warfarin'], allergyConflict: ['Aspirin'] },
  { id: 'static-atorv', brand: 'Atorvastatin 20mg', generic: 'Atorvastatin', route: 'PO', interactsWith: [] as string[], allergyConflict: [] as string[] },
  { id: 'static-paracet', brand: 'Paracetamol 650mg', generic: 'Paracetamol', route: 'PO', interactsWith: [] as string[], allergyConflict: [] as string[] },
] as const;
