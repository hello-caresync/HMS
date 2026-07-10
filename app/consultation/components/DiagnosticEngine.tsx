'use client';

import { useMemo, useState } from 'react';
import { BookOpen, Plus, Search, Sparkles, Trash2, X } from 'lucide-react';

import { useConsultation } from '../context/ConsultationProvider';
import { lookupIcd10 } from '../lib/icd10Lookup';
import { CLINICAL } from '../lib/theme';

export default function DiagnosticEngine() {
  const { encounter, addDiagnosis, removeDiagnosis, setPrimaryDiagnosis, isLocked } =
    useConsultation();
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const match = useMemo(() => lookupIcd10(query), [query]);

  const handleAdd = () => {
    if (!match || isLocked) return;
    addDiagnosis({
      term: match.term,
      icd10Code: match.code,
      icd10Description: match.description,
      isPrimary: encounter.diagnoses.length === 0,
    });
    setQuery('');
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-3">
      {/* Input with ICD-10 inline indicator */}
      <div
        className="rounded-xl border p-3"
        style={{ borderColor: CLINICAL.border, backgroundColor: CLINICAL.panel }}
      >
        <label className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: CLINICAL.mint }}>
          <Search className="h-3.5 w-3.5" />
          Diagnosis Entry · ICD-10 Auto-Match
        </label>
        <div className="relative">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            disabled={isLocked}
            placeholder='Type diagnosis e.g. "Essential Hypertension"'
            className="w-full rounded-lg border px-3 py-2.5 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5ebda8]/40 disabled:opacity-60"
            style={{ borderColor: CLINICAL.border, color: CLINICAL.charcoal }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-800 hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {match && query.length >= 3 && (
          <div
            className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5"
            style={{ borderColor: '#c8ebe0', backgroundColor: CLINICAL.mintSoft }}
          >
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" style={{ color: CLINICAL.mint }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: CLINICAL.text }}>
                  {match.term}
                </p>
                <p className="font-mono text-[11px] font-bold" style={{ color: CLINICAL.mint }}>
                  ICD-10: {match.code}
                </p>
                <p className="text-[10px]" style={{ color: CLINICAL.textSubtle }}>
                  {match.description}
                </p>
              </div>
            </div>
            {!isLocked && (
              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white"
                style={{ backgroundColor: CLINICAL.mint }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            )}
          </div>
        )}
      </div>

      {/* Diagnosis list */}
      {encounter.diagnoses.length > 0 ? (
        <ul className="space-y-2">
          {encounter.diagnoses.map((dx) => (
            <li
              key={dx.id}
              className="flex items-start gap-3 rounded-xl border px-3 py-2.5"
              style={{ borderColor: CLINICAL.border, backgroundColor: CLINICAL.panel }}
            >
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0" style={{ color: CLINICAL.mint }} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: CLINICAL.text }}>
                    {dx.term}
                  </p>
                  {dx.isPrimary && (
                    <span className="rounded bg-[#d4f0e4] px-1.5 py-0.5 text-[8px] font-bold uppercase text-[#2d6a58]">
                      Primary
                    </span>
                  )}
                </div>
                <p className="font-mono text-[11px] font-bold" style={{ color: CLINICAL.mint }}>
                  ICD-10: {dx.icd10Code}
                </p>
                <p className="text-[10px]" style={{ color: CLINICAL.textSubtle }}>
                  {dx.icd10Description}
                </p>
              </div>
              {!isLocked && (
                <div className="flex shrink-0 gap-1">
                  {!dx.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimaryDiagnosis(dx.id)}
                      className="rounded px-2 py-1 text-[9px] font-semibold hover:bg-[#edf8f3]"
                      style={{ color: CLINICAL.mint }}
                    >
                      Set Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeDiagnosis(dx.id)}
                    className="rounded p-1 text-slate-800 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p
          className="rounded-xl border border-dashed px-4 py-8 text-center text-xs"
          style={{ borderColor: CLINICAL.border, color: CLINICAL.textSubtle }}
        >
          No diagnoses recorded. Type a clinical term above to auto-match ICD-10 codes.
        </p>
      )}
    </div>
  );
}
