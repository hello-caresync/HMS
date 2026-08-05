'use client';

import { Download, Printer } from 'lucide-react';

import { opdUi } from '@/lib/opd/design-tokens';
import { downloadOpdSlipPdf } from '@/lib/opd/slip-pdf';
import type { EcosystemAppointment, EcosystemDoctor, HospitalBranch } from '@/lib/ecosystem/types';

type Props = {
  appointment: EcosystemAppointment;
  doctor?: EcosystemDoctor;
  branch?: HospitalBranch;
};

export function OpdSlipActions({ appointment, doctor, branch }: Props) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => downloadOpdSlipPdf(appointment, doctor, branch)}
        className={opdUi.btnPrimary}
      >
        <Download className="h-4 w-4" /> Download PDF Slip
      </button>
      <button type="button" onClick={() => window.print()} className={opdUi.btnSecondary}>
        <Printer className="h-4 w-4" /> Print Thermal Slip
      </button>
    </div>
  );
}
