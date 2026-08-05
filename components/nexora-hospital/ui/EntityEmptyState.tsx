'use client';

import { EmptyState, ui } from '@/components/nexora-hospital/ui/primitives';
import { EMPTY_STATES, type EmptyStatePreset } from '@/lib/shared/empty-states';

type PresetKey = keyof typeof EMPTY_STATES;

export function EntityEmptyState({
  preset,
  onAction,
}: {
  preset: PresetKey;
  onAction?: () => void;
}) {
  const p: EmptyStatePreset = EMPTY_STATES[preset];
  return (
    <EmptyState
      title={p.title}
      description={p.description}
      action={
        onAction ? (
          <button type="button" className={ui.btnPrimary} onClick={onAction}>
            {p.actionLabel}
          </button>
        ) : undefined
      }
    />
  );
}
