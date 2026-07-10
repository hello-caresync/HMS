'use client';

import { useConsultation } from '../context/ConsultationProvider';
import { CLINICAL } from '../lib/theme';

const SOAP_FIELDS = [
  {
    key: 'subjective' as const,
    label: 'S — Subjective',
    hint: 'Chief complaint, HPI, ROS',
    placeholder: 'Patient reports intermittent chest discomfort on exertion for 3 days…',
  },
  {
    key: 'objective' as const,
    label: 'O — Objective',
    hint: 'Exam findings, vitals',
    placeholder: 'BP 142/92, pulse 84 regular. No pedal edema. Heart sounds S1 S2 normal…',
  },
  {
    key: 'assessment' as const,
    label: 'A — Assessment',
    hint: 'Diagnosis, differential',
    placeholder: 'Likely stable angina vs. musculoskeletal chest wall pain…',
  },
  {
    key: 'plan' as const,
    label: 'P — Plan',
    hint: 'Treatment, counselling',
    placeholder: 'Continue antihypertensive. Order ECG, Lipid panel. Lifestyle counselling…',
  },
];

export default function SoapNotesSection() {
  const { encounter, updateSoap, isLocked } = useConsultation();

  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
      {SOAP_FIELDS.map(({ key, label, hint, placeholder }) => (
        <div
          key={key}
          className="flex flex-col rounded-xl border"
          style={{ borderColor: CLINICAL.border, backgroundColor: CLINICAL.surface }}
        >
          <label
            htmlFor={`soap-${key}`}
            className="flex items-baseline justify-between border-b px-3 py-2"
            style={{ borderColor: CLINICAL.borderLight }}
          >
            <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: CLINICAL.mint }}>
              {label}
            </span>
            <span className="text-[9px]" style={{ color: CLINICAL.textSubtle }}>
              {hint}
            </span>
          </label>
          <textarea
            id={`soap-${key}`}
            value={encounter.soap[key]}
            onChange={(e) => updateSoap({ [key]: e.target.value })}
            disabled={isLocked}
            placeholder={placeholder}
            rows={6}
            className="min-h-[120px] flex-1 resize-y rounded-b-xl border-0 bg-transparent px-3 py-2.5 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#5ebda8]/40 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ color: CLINICAL.charcoal }}
          />
        </div>
      ))}
    </div>
  );
}
