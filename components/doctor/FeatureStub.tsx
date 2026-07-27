import { DoctorModuleShell } from '@/components/doctor/doctor-ui';

export function DoctorFeatureStub({
  title,
  subtitle,
  bullets,
}: {
  title: string;
  subtitle: string;
  bullets: string[];
}) {
  return (
    <DoctorModuleShell title={title} subtitle={subtitle}>
      <ul className="space-y-2 rounded-2xl border border-brand-light/60 bg-brand-surface p-6 shadow-sm">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2 text-sm text-slate-700">
            <span className="font-bold text-[#008588]">•</span>
            {b}
          </li>
        ))}
      </ul>
    </DoctorModuleShell>
  );
}
