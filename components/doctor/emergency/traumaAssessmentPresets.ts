export const TRAUMA_MECHANISM_CHIPS = [
  'MVC High-Speed',
  'Fall > 10ft',
  'Gunshot',
  'Stab Wound',
  'Pedestrian vs Auto',
] as const;

export const TRAUMA_INJURY_CHIPS = [
  'Abdominal Guarding',
  'Pelvic Instability',
  'Chest Flail',
  'Head Trauma',
] as const;

export const TRAUMA_INTERVENTION_CHIPS = [
  '2x Large-Bore IV',
  '1L NS Bolus',
  'E-FAST Positive',
  'Intubated',
  'Blood Crossmatched',
] as const;

export type TraumaFormField = 'mechanism' | 'injuries' | 'interventions';

export const TRAUMA_FIELD_LABELS: Record<TraumaFormField, string> = {
  mechanism: 'Mechanism',
  injuries: 'Injuries',
  interventions: 'Interventions',
};

export const TRAUMA_FIELD_CHIPS: Record<TraumaFormField, readonly string[]> = {
  mechanism: TRAUMA_MECHANISM_CHIPS,
  injuries: TRAUMA_INJURY_CHIPS,
  interventions: TRAUMA_INTERVENTION_CHIPS,
};

export function appendTraumaTag(current: string, tag: string): string {
  const trimmed = current.trim();
  if (!trimmed) return tag;
  if (trimmed.split(/;\s*/).some((part) => part.trim() === tag)) return trimmed;
  return `${trimmed}; ${tag}`;
}
