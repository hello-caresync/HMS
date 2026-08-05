'use client';

import { HOSPITAL_COLORS } from '@/lib/nexora-hospital/design-tokens';
import { useHospitalStore } from '@/lib/nexora-hospital/store';

export function HospitalEcosystemFooter() {
  const connected = useHospitalStore((s) => s.realtimeConnected);

  return (
    <footer
      className="sticky bottom-0 z-20 border-t px-4 py-2.5 text-center text-sm font-medium backdrop-blur"
      style={{
        borderColor: `${HOSPITAL_COLORS.foam}99`,
        backgroundColor: 'rgba(255,255,255,0.95)',
        color: HOSPITAL_COLORS.textMuted,
      }}
    >
      <span className="font-bold text-[#1B5E3A]">Nexora Healthcare Ecosystem V0</span>
      <span className="mx-2 text-[#A8D5BA]">|</span>
      Connected Applications:{' '}
      <span className="text-[#1E2522]">
        {connected ? '🟢' : '⚪'} Patient App | {connected ? '🟢' : '⚪'} Doctor App | {connected ? '🟢' : '⚪'} Vendor App | 🟢 HMS Console
      </span>
    </footer>
  );
}
