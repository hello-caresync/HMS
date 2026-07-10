export interface Icd10Match {
  term: string;
  code: string;
  description: string;
}

/** Mock ICD-10 lookup table — substring match on clinical terms */
export const ICD10_CATALOG: Icd10Match[] = [
  { term: 'Essential Hypertension', code: 'I10', description: 'Essential (primary) hypertension' },
  { term: 'Hypertension', code: 'I10', description: 'Essential (primary) hypertension' },
  { term: 'Type 2 Diabetes', code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { term: 'Diabetes Mellitus', code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { term: 'Acute Bronchitis', code: 'J20.9', description: 'Acute bronchitis, unspecified' },
  { term: 'GERD', code: 'K21.0', description: 'Gastro-esophageal reflux disease with esophagitis' },
  { term: 'Gastroesophageal Reflux', code: 'K21.0', description: 'GERD with esophagitis' },
  { term: 'Migraine', code: 'G43.909', description: 'Migraine, unspecified, not intractable' },
  { term: 'Anxiety Disorder', code: 'F41.9', description: 'Anxiety disorder, unspecified' },
  { term: 'Iron Deficiency Anemia', code: 'D50.9', description: 'Iron deficiency anemia, unspecified' },
  { term: 'Osteoarthritis', code: 'M19.90', description: 'Unspecified osteoarthritis, unspecified site' },
  { term: 'Urinary Tract Infection', code: 'N39.0', description: 'Urinary tract infection, site not specified' },
  { term: 'UTI', code: 'N39.0', description: 'Urinary tract infection, site not specified' },
  { term: 'Asthma', code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
  { term: 'Hypothyroidism', code: 'E03.9', description: 'Hypothyroidism, unspecified' },
  { term: 'Hyperlipidemia', code: 'E78.5', description: 'Hyperlipidemia, unspecified' },
  { term: 'Chest Pain', code: 'R07.9', description: 'Chest pain, unspecified' },
  { term: 'Fever', code: 'R50.9', description: 'Fever, unspecified' },
];

export function lookupIcd10(query: string): Icd10Match | null {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return null;
  const exact = ICD10_CATALOG.find((item) => item.term.toLowerCase() === q);
  if (exact) return exact;
  return (
    ICD10_CATALOG.find(
      (item) =>
        item.term.toLowerCase().includes(q) || q.includes(item.term.toLowerCase()),
    ) ?? null
  );
}
