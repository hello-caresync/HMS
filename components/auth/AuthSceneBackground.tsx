import { MedicalDoodleBackdrop } from '@/components/auth/MedicalDoodleBackdrop';

const WASH = {
  vault:
    'radial-gradient(900px 500px at 50% -10%, rgba(139,92,246,0.28), transparent 55%), radial-gradient(700px 420px at 100% 100%, rgba(88,28,135,0.32), transparent 50%), linear-gradient(180deg, #12081c 0%, #1a1030 55%, #0d0714 100%)',
  hospital:
    'radial-gradient(900px 500px at 50% -10%, rgba(34,211,238,0.22), transparent 55%), radial-gradient(700px 420px at 0% 100%, rgba(14,116,144,0.32), transparent 50%), linear-gradient(180deg, #062033 0%, #0a2e47 60%, #061a2b 100%)',
  doctor:
    'radial-gradient(900px 500px at 50% -10%, rgba(45,212,191,0.2), transparent 55%), radial-gradient(700px 420px at 100% 100%, rgba(15,118,110,0.28), transparent 50%), linear-gradient(180deg, #06241f 0%, #0b2a28 60%, #071614 100%)',
  patient:
    'radial-gradient(900px 500px at 50% -10%, rgba(251,113,133,0.18), transparent 55%), radial-gradient(700px 420px at 100% 100%, rgba(254,243,226,0.7), transparent 50%), linear-gradient(180deg, #fff7f4 0%, #fde8e4 45%, #fbf7f2 100%)',
  vendor:
    'radial-gradient(900px 500px at 50% -10%, rgba(250,204,21,0.16), transparent 55%), radial-gradient(700px 420px at 100% 100%, rgba(91,33,182,0.22), transparent 50%), linear-gradient(180deg, #1a0b2e 0%, #2e1053 55%, #1b0d2d 100%)',
} as const;

const DOODLE = {
  vault: { tint: 'violet' as const, intensity: 0.95 },
  hospital: { tint: 'cyan' as const, intensity: 0.9 },
  doctor: { tint: 'teal' as const, intensity: 0.95 },
  patient: { tint: 'navy' as const, intensity: 0.75 },
  vendor: { tint: 'gold' as const, intensity: 0.9 },
} as const;

export type AuthSceneTone = keyof typeof WASH;

export function AuthSceneBackground({ tone }: { tone: AuthSceneTone }) {
  const doodle = DOODLE[tone];

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
        style={{ background: WASH[tone] }}
      />
      <MedicalDoodleBackdrop tint={doodle.tint} intensity={doodle.intensity} />
    </>
  );
}
