'use client';

import { patientClasses } from '@/lib/patient/theme';

type PatientModulePlaceholderProps = {
  title: string;
  subtitle: string;
};

export function PatientModulePlaceholder({ title, subtitle }: PatientModulePlaceholderProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className={`${patientClasses.card} p-6`}>
        <h1 className={patientClasses.pageHeading}>{title}</h1>
        <p className={`mt-2 ${patientClasses.subheading}`}>{subtitle}</p>
        <p className="mt-4 text-sm text-patient-text/80">
          This module is wired into the Nexora Patient shell with the luxury plum &amp; beige design system. Connect Supabase
          and hospital APIs for live data.
        </p>
      </div>
    </div>
  );
}
