'use client';

import { useCallback, useState } from 'react';
import { Scissors } from 'lucide-react';

import {
  DEFAULT_INSTRUMENT_CHECKLIST,
  SEED_OT_SLOTS,
  type InstrumentChecklistItem,
  type OtScheduleSlot,
} from '../../../lib/patientcare';
import OtSchedulingCalendar from './OtSchedulingCalendar';
import PreSurgeryChecklistModal from './PreSurgeryChecklistModal';

export default function OtCoordinationWorkbench() {
  const [slots, setSlots] = useState<OtScheduleSlot[]>(SEED_OT_SLOTS);
  const [checklistSlot, setChecklistSlot] = useState<OtScheduleSlot | null>(null);
  const [checklistItems, setChecklistItems] = useState<InstrumentChecklistItem[]>(
    DEFAULT_INSTRUMENT_CHECKLIST.map((i) => ({ ...i })),
  );

  const openChecklist = useCallback((slot: OtScheduleSlot) => {
    setChecklistSlot(slot);
    setChecklistItems(DEFAULT_INSTRUMENT_CHECKLIST.map((i) => ({ ...i, verified: false })));
  }, []);

  const handleToggleInstrument = useCallback((itemId: string) => {
    setChecklistItems((prev) =>
      prev.map((i) => (i.itemId === itemId ? { ...i, verified: !i.verified } : i)),
    );
  }, []);

  const handleConfirmChecklist = useCallback(() => {
    if (!checklistSlot) return;
    const allVerified = checklistItems.every((i) => i.verified);
    if (!allVerified) return;

    setSlots((prev) =>
      prev.map((s) =>
        s.slotId === checklistSlot.slotId ? { ...s, status: 'In Surgery' as const } : s,
      ),
    );
    setChecklistSlot(null);
  }, [checklistSlot, checklistItems]);

  const handleSlotClick = useCallback(
    (slot: OtScheduleSlot) => {
      if (slot.status === 'Pre-Op Checklist Pending') {
        openChecklist(slot);
      }
    },
    [openChecklist],
  );

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Scissors className="h-5 w-5 text-sky-700" />
          <div>
            <h1 className="text-lg font-black text-slate-900">
              Operation Theatre Scheduling &amp; Safety
            </h1>
            <p className="text-xs text-slate-800">
              Phase 4 · Module 13 · Theater calendar · pre-op instrument validation
            </p>
          </div>
        </div>
      </header>

      <OtSchedulingCalendar slots={slots} onSlotClick={handleSlotClick} />

      <PreSurgeryChecklistModal
        open={checklistSlot !== null}
        slot={checklistSlot}
        items={checklistItems}
        onToggle={handleToggleInstrument}
        onConfirm={handleConfirmChecklist}
        onClose={() => setChecklistSlot(null)}
      />
    </div>
  );
}
