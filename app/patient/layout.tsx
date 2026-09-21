import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { REGAL_HMS_DESCRIPTION, REGAL_HOSPITAL_FULL_NAME } from '@/lib/regal/brand';

import PatientLayoutClient from './PatientLayoutClient';

export const metadata: Metadata = {
  title: REGAL_HOSPITAL_FULL_NAME,
  description: REGAL_HMS_DESCRIPTION,
};

export default function PatientLayout({ children }: { children: ReactNode }) {
  return <PatientLayoutClient>{children}</PatientLayoutClient>;
}
