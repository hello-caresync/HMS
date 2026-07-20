'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Pill,
  Plus,
  Printer,
  Search,
  Send,
  ShieldCheck,
  Star,
} from 'lucide-react';

type MedicationRoute = 'Oral' | 'IV' | 'Topical' | 'Inhalation';

type PrescriptionLine = {
  id: string;
  nameStrength: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: MedicationRoute;
  specialInstructions: string;
};

type FormDraft = {
  nameStrength: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: MedicationRoute;
  specialInstructions: string;
};

const WORKFLOW_SUMMARY =
  'Standalone Rx builder · sandbox patient P.N. · formulary search · safety checks simulated · 13 Jul 2026';

const PATIENT = {
  initials: 'P.N.',
  uhid: 'NX-2026-301882',
  knownAllergies: ['Penicillin', 'Sulfa drugs'],
};

const FORMULARY = [
  'Paracetamol 650 mg',
  'Amoxicillin 500 mg',
  'Ibuprofen 400 mg',
  'Metformin 500 mg',
  'Amlodipine 5 mg',
  'Atorvastatin 10 mg',
  'Aspirin 75 mg',
  'Warfarin 5 mg',
  'Omeprazole 20 mg',
  'Azithromycin 500 mg',
];

const FAVOURITE_SEED = ['Paracetamol 650 mg', 'Amoxicillin 500 mg', 'Metformin 500 mg', 'Amlodipine 5 mg'];

const ALLERGY_TRIGGER_TOKENS = ['amoxicillin', 'penicillin', 'ampicillin'];

const INTERACTION_PAIRS: [string, string][] = [
  ['ibuprofen', 'aspirin'],
  ['warfarin', 'aspirin'],
  ['warfarin', 'ibuprofen'],
];

const ROUTES: MedicationRoute[] = ['Oral', 'IV', 'Topical', 'Inhalation'];

const EMPTY_DRAFT: FormDraft = {
  nameStrength: '',
  dosage: '1 Tablet',
  frequency: 'Twice Daily',
  duration: '5 Days',
  route: 'Oral',
  specialInstructions: 'After Food',
};

const INPUT_CLASS =
  'w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200';

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function matchesAllergyTrigger(nameStrength: string): boolean {
  const token = normalizeToken(nameStrength);
  return ALLERGY_TRIGGER_TOKENS.some((t) => token.includes(t));
}

function findInteraction(nameA: string, existingLines: PrescriptionLine[]): string | null {
  const tokenA = normalizeToken(nameA);
  for (const line of existingLines) {
    const tokenB = normalizeToken(line.nameStrength);
    for (const [x, y] of INTERACTION_PAIRS) {
      if (
        (tokenA.includes(x) && tokenB.includes(y)) ||
        (tokenA.includes(y) && tokenB.includes(x))
      ) {
        return `${line.nameStrength} ↔ ${nameA}`;
      }
    }
  }
  return null;
}

function createLineId(): string {
  return `rx-line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function EPrescriptionCorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [favourites, setFavourites] = useState<string[]>(FAVOURITE_SEED);
  const [draft, setDraft] = useState<FormDraft>(EMPTY_DRAFT);
  const [prescriptionLines, setPrescriptionLines] = useState<PrescriptionLine[]>([]);
  const [allergyAlert, setAllergyAlert] = useState(false);
  const [interactionAlert, setInteractionAlert] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);

  const filteredFormulary = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return FORMULARY;
    return FORMULARY.filter((med) => med.toLowerCase().includes(query));
  }, [searchQuery]);

  const showNotice = useCallback((message: string) => {
    setActionNote(message);
    window.setTimeout(() => setActionNote(null), 4500);
  }, []);

  const selectMedicine = (name: string) => {
    setDraft((prev) => ({ ...prev, nameStrength: name }));
    setAllergyAlert(matchesAllergyTrigger(name));
    setInteractionAlert(null);
  };

  const toggleFavourite = (name: string) => {
    setFavourites((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    );
  };

  const handleAddToRxList = () => {
    if (!draft.nameStrength.trim()) return;

    const allergy = matchesAllergyTrigger(draft.nameStrength);
    const interaction = findInteraction(draft.nameStrength, prescriptionLines);

    setAllergyAlert(allergy);
    setInteractionAlert(interaction);

    const line: PrescriptionLine = {
      id: createLineId(),
      nameStrength: draft.nameStrength.trim(),
      dosage: draft.dosage.trim() || '—',
      frequency: draft.frequency.trim() || '—',
      duration: draft.duration.trim() || '—',
      route: draft.route,
      specialInstructions: draft.specialInstructions.trim() || '—',
    };

    setPrescriptionLines((prev) => [...prev, line]);
    setDraft({ ...EMPTY_DRAFT, nameStrength: '' });
  };

  const removeLine = (id: string) => {
    setPrescriptionLines((prev) => prev.filter((line) => line.id !== id));
  };

  const handlePrint = () => {
    showNotice('Printable prescription file queued · sandbox PDF simulation · read-only preview');
  };

  const handleFinalize = () => {
    showNotice(
      `Finalize & transmit · ${prescriptionLines.length} line(s) · ${PATIENT.uhid} · digital copy sandbox only`,
    );
  };

  return (
    <div className="min-h-screen w-full font-sans text-slate-950 selection:bg-slate-200">
      <div className="w-full space-y-5 p-4 sm:p-6 lg:p-8">
        {/* Secure logistics header */}
        <header className="flex w-full flex-col gap-4 border-b-2 border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              e-Prescription Generation Console
            </h1>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-800">
              {WORKFLOW_SUMMARY}
            </p>
            <p className="mt-2 font-mono text-xs font-black text-slate-950">
              Patient · {PATIENT.initials} · {PATIENT.uhid}
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 shadow-sm">
            <Pill className="h-4 w-4 text-emerald-700" aria-hidden />
            <span>RX_SAFETY_CORE_ACTIVE</span>
          </div>
        </header>

        {/* Safety alert banners */}
        <section aria-label="Safety alerts" className="w-full space-y-3">
          {allergyAlert && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border-2 border-rose-400 bg-rose-50 px-4 py-3 text-rose-950"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-black uppercase tracking-wide">Allergy Alert</p>
                <p className="mt-1 text-xs font-bold leading-relaxed">
                  Selected medication may conflict with documented allergies (
                  {PATIENT.knownAllergies.join(', ')}). Verify before prescribing · sandbox
                  warning only.
                </p>
              </div>
            </div>
          )}
          {interactionAlert && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-amber-950"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-bold uppercase tracking-wide">Drug Interaction Alert</p>
                <p className="mt-1 text-xs font-bold leading-relaxed">
                  Potential compound conflict detected · {interactionAlert} · review concurrent
                  therapy before finalizing.
                </p>
              </div>
            </div>
          )}
          {!allergyAlert && !interactionAlert && (
            <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-950">
              Safety core monitoring active · no blocking alerts on current draft selection
            </div>
          )}
        </section>

        {actionNote && (
          <p
            role="status"
            className="w-full rounded-lg border-2 border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-950"
          >
            {actionNote}
          </p>
        )}

        {/* Two-column Rx layout */}
        <div className="grid w-full grid-cols-1 gap-5 xl:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]">
          {/* Left — intake & formulary */}
          <section
            aria-label="Medication intake and formulary search"
            className="w-full space-y-4 rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 shadow-sm sm:p-5"
          >
            <h2 className="text-base font-black text-slate-950">Medication Intake &amp; Formulary</h2>

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-800"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search standard and generic medicines…"
                aria-label="Search medicines"
                className={`${INPUT_CLASS} pl-10`}
              />
            </div>

            {searchQuery.trim() && (
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border-2 border-slate-200 bg-slate-50 p-2">
                {filteredFormulary.length === 0 ? (
                  <li className="px-2 py-2 text-xs font-bold text-slate-800">No formulary matches</li>
                ) : (
                  filteredFormulary.map((med) => (
                    <li key={med}>
                      <button
                        type="button"
                        onClick={() => selectMedicine(med)}
                        className="w-full rounded-md px-2 py-2 text-left text-sm font-bold text-slate-950 hover:bg-white"
                      >
                        {med}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}

            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-800">
                Favourite Medicines
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {favourites.map((med) => (
                  <div key={med} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => selectMedicine(med)}
                      className="min-w-0 flex-1 rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-black text-slate-950 hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      {med}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavourite(med)}
                      className="rounded-lg border-2 border-slate-200 p-2 text-amber-600 hover:bg-amber-50"
                      aria-label={`Remove ${med} from favourites`}
                    >
                      <Star className="h-4 w-4 fill-current" aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t-2 border-slate-200 pt-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-800">
                Configure Selected Medication
              </p>

              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-800">Name / Strength</span>
                <input
                  type="text"
                  value={draft.nameStrength}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDraft((prev) => ({ ...prev, nameStrength: value }));
                    setAllergyAlert(matchesAllergyTrigger(value));
                  }}
                  className={INPUT_CLASS}
                  placeholder="e.g. Paracetamol 650 mg"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-800">Dosage</span>
                  <input
                    type="text"
                    value={draft.dosage}
                    onChange={(e) => setDraft((prev) => ({ ...prev, dosage: e.target.value }))}
                    className={INPUT_CLASS}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-800">Frequency</span>
                  <input
                    type="text"
                    value={draft.frequency}
                    onChange={(e) => setDraft((prev) => ({ ...prev, frequency: e.target.value }))}
                    className={INPUT_CLASS}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-800">Duration</span>
                  <input
                    type="text"
                    value={draft.duration}
                    onChange={(e) => setDraft((prev) => ({ ...prev, duration: e.target.value }))}
                    className={INPUT_CLASS}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-800">Route</span>
                  <select
                    value={draft.route}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        route: e.target.value as MedicationRoute,
                      }))
                    }
                    className={INPUT_CLASS}
                  >
                    {ROUTES.map((route) => (
                      <option key={route} value={route}>
                        {route}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-800">
                  Special Instructions
                </span>
                <input
                  type="text"
                  value={draft.specialInstructions}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, specialInstructions: e.target.value }))
                  }
                  className={INPUT_CLASS}
                />
              </label>

              <button
                type="button"
                onClick={handleAddToRxList}
                disabled={!draft.nameStrength.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-slate-900 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add to RX List
              </button>
            </div>
          </section>

          {/* Right — live prescription preview */}
          <section
            aria-label="Live prescription sheet preview"
            className="w-full space-y-4"
          >
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase text-slate-950 hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" aria-hidden />
                Printable Prescription File
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={prescriptionLines.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-emerald-500 bg-emerald-600 px-4 py-2 text-xs font-black uppercase text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" aria-hidden />
                Finalize &amp; Transmit Digital Copy
              </button>
            </div>

            <article className="w-full rounded-xl border-2 border-slate-300 bg-white p-6 shadow-md">
              <header className="border-b-2 border-slate-200 pb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">
                  Nexora e-Prescription · Standalone Vault
                </p>
                <h3 className="mt-1 text-lg font-black text-slate-950">Outpatient Prescription Sheet</h3>
                <p className="mt-2 text-xs font-bold text-slate-800">
                  Patient · {PATIENT.initials} · UHID {PATIENT.uhid}
                </p>
                <p className="text-xs font-bold text-slate-950">Date · 13 Jul 2026</p>
              </header>

              <div className="mt-5 min-h-[220px] space-y-3">
                {prescriptionLines.length === 0 ? (
                  <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-800">
                    No medications added · build Rx lines using the formulary panel
                  </p>
                ) : (
                  prescriptionLines.map((line, index) => (
                    <div
                      key={line.id}
                      className="flex gap-3 border-b-2 border-slate-100 pb-3 last:border-b-0"
                    >
                      <span className="font-black text-slate-950">{index + 1}.</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-950">{line.nameStrength}</p>
                        <p className="mt-1 text-xs font-bold text-slate-800">
                          {line.dosage} · {line.frequency} · {line.duration} · {line.route}
                        </p>
                        <p className="text-xs font-bold text-slate-950">{line.specialInstructions}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="shrink-0 text-[10px] font-black uppercase text-rose-700 hover:text-rose-900"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              <footer className="mt-6 flex flex-col items-center gap-2 border-t-2 border-slate-200 pt-4 sm:flex-row sm:justify-between">
                <div className="inline-flex items-center gap-2 rounded-lg border-2 border-emerald-400 bg-emerald-50 px-3 py-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-800" aria-hidden />
                  <span className="text-xs font-black uppercase text-emerald-950">
                    Digital Signature Verified
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-800">
                  {prescriptionLines.length} active line(s) · sandbox transmission only
                </p>
              </footer>
            </article>
          </section>
        </div>
      </div>
    </div>
  );
}
