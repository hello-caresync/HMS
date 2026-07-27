'use client';

import { Mic, MicOff } from 'lucide-react';
import { useCallback } from 'react';

import {
  TRAUMA_FIELD_CHIPS,
  TRAUMA_FIELD_LABELS,
  appendTraumaTag,
  type TraumaFormField,
} from './traumaAssessmentPresets';
import { useSpeechToText } from './useSpeechToText';

type TraumaFormState = Record<TraumaFormField, string>;

function TraumaFieldBlock({
  field,
  value,
  onChange,
}: {
  field: TraumaFormField;
  value: string;
  onChange: (next: string) => void;
}) {
  const appendPhrase = useCallback(
    (phrase: string) => {
      onChange(appendTraumaTag(value, phrase));
    },
    [onChange, value],
  );

  const { listening, toggle } = useSpeechToText(appendPhrase);

  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-[#64748B]">{TRAUMA_FIELD_LABELS[field]}</span>
        <button
          type="button"
          aria-label={listening ? `Stop dictation for ${TRAUMA_FIELD_LABELS[field]}` : `Dictate ${TRAUMA_FIELD_LABELS[field]}`}
          aria-pressed={listening}
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
            listening
              ? 'border-[#EF4444] bg-red-50 text-[#EF4444]'
              : 'border-[#E2E8F0] bg-brand-surface text-[#64748B] hover:border-[#94A3B8] hover:text-[#0F172A]'
          }`}
          onClick={toggle}
        >
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {TRAUMA_FIELD_CHIPS[field].map((tag) => (
          <button
            key={tag}
            type="button"
            className="rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#334155] transition-colors hover:border-[#0EA5E9] hover:bg-sky-50 hover:text-[#0369A1]"
            onClick={() => onChange(appendTraumaTag(value, tag))}
          >
            {tag}
          </button>
        ))}
      </div>
      <textarea
        rows={2}
        className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm text-[#0F172A] focus:border-[#0EA5E9] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]"
        value={value}
        placeholder={`Tap chips or dictate ${TRAUMA_FIELD_LABELS[field].toLowerCase()}…`}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function TraumaAssessmentFields({
  form,
  onChange,
}: {
  form: TraumaFormState;
  onChange: (field: TraumaFormField, value: string) => void;
}) {
  return (
    <>
      {(['mechanism', 'injuries', 'interventions'] as const).map((field) => (
        <TraumaFieldBlock
          key={field}
          field={field}
          value={form[field]}
          onChange={(next) => onChange(field, next)}
        />
      ))}
      <p className="mb-3 text-xs text-[#64748B]">
        Notes are optional. ICU admission can be triggered from vitals and ESI alone.
      </p>
    </>
  );
}

export function traumaFormHasContent(form: TraumaFormState): boolean {
  return form.mechanism.trim() !== '' || form.injuries.trim() !== '' || form.interventions.trim() !== '';
}

export const emptyTraumaForm = (): TraumaFormState => ({
  mechanism: '',
  injuries: '',
  interventions: '',
});
