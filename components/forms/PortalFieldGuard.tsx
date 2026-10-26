'use client';

import { useEffect } from 'react';

import {
  blockExtraAgeDigit,
  blockNonDigitPhoneKey,
  blockNonLetterNameKey,
  sanitizeAgeDigits,
  sanitizePersonName,
  sanitizePhoneDigits,
} from '@/lib/hospital/indian-patient';

type FieldKind = 'phone' | 'name' | 'age';

function fieldHint(input: HTMLInputElement): string {
  const parts: string[] = [
    input.name,
    input.id,
    input.placeholder,
    input.getAttribute('aria-label') ?? '',
    input.autocomplete,
  ];

  if (input.labels) {
    for (const label of input.labels) {
      parts.push(label.textContent ?? '');
    }
  }

  let node: HTMLElement | null = input.parentElement;
  for (let depth = 0; depth < 3 && node; depth += 1) {
    const label = node.querySelector(':scope > label');
    if (label) parts.push(label.textContent ?? '');
    node = node.parentElement;
  }

  return parts.join(' ').toLowerCase().replace(/[_-]+/g, ' ');
}

function classifyField(input: HTMLInputElement): FieldKind | null {
  if (input.readOnly || input.disabled) return null;
  const marked = input.dataset.field;
  if (marked === 'phone') return 'phone';
  if (marked === 'person-name') return 'name';
  if (marked === 'age') return 'age';

  const type = input.type;
  const hint = fieldHint(input);
  if (/\bage\b/.test(hint) && !/\b(page|agency|dosage|percentage|gender)\b/.test(hint)) return 'age';

  if (
    type === 'email' ||
    type === 'password' ||
    type === 'number' ||
    type === 'search' ||
    type === 'date' ||
    type === 'time' ||
    type === 'url' ||
    type === 'hidden' ||
    type === 'checkbox' ||
    type === 'radio' ||
    type === 'file' ||
    type === 'range'
  ) {
    return null;
  }

  if (/\b(search|filter|lookup)\b/.test(hint)) return null;
  if (type === 'tel' || /\b(phone|mobile)\b/.test(hint)) return 'phone';
  if (
    /\b(search|medicine|drug|dosage|item|product|sku|barcode|department|hospital|company|business|ward|role|asset|procedure|report|hsn|address|street|city|state|postal|gst|code|email|password|fee|amount|token|uhid)\b/.test(
      hint,
    )
  ) {
    return null;
  }
  const personName =
    /\b(full name|first name|last name|patient name|admin name|visitor name|display name|given name|family name|doctor name|staff name|member name|dependent|occupying patient|name)\b/.test(
      hint,
    ) ||
    input.autocomplete === 'name' ||
    input.autocomplete === 'given-name' ||
    input.autocomplete === 'family-name';
  if (personName && !/\b(vendor legal|company|business|hospital)\b/.test(hint)) return 'name';
  return null;
}

function writeInputValue(input: HTMLInputElement, next: string) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  descriptor?.set?.call(input, next);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Keeps person-name fields alphabetic and phone fields numeric on every portal. */
export function PortalFieldGuard() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      const kind = classifyField(target);
      if (kind === 'phone') blockNonDigitPhoneKey(event);
      if (kind === 'name') blockNonLetterNameKey(event);
      if (kind === 'age') blockExtraAgeDigit(event);
    };

    const onInput = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (event instanceof InputEvent && event.isComposing) return;
      const kind = classifyField(target);
      if (!kind) return;
      const next =
        kind === 'phone'
          ? sanitizePhoneDigits(target.value)
          : kind === 'age'
            ? sanitizeAgeDigits(target.value)
            : sanitizePersonName(target.value);
      if (next !== target.value) writeInputValue(target, next);
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('input', onInput, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('input', onInput, true);
    };
  }, []);

  return null;
}
