'use client';

import { RegalHospitalLogo } from '@/components/common/RegalHospitalLogo';
import { REGAL_HOSPITAL } from '@/lib/patient/hospital-context';
import { REGAL_HOSPITAL_FULL_NAME, REGAL_HOSPITAL_NODE_LABEL } from '@/lib/regal/brand';

export type PrescriptionPrintLine = {
  id: string;
  nameStrength: string;
  dosage: string;
  frequency: string;
  duration: string;
  route?: string;
  specialInstructions?: string;
};

export type PrescriptionPrintProps = {
  patientName: string;
  patientUhid: string;
  doctorName?: string;
  department?: string;
  issuedDate?: string;
  lines: PrescriptionPrintLine[];
  printRef?: React.RefObject<HTMLDivElement | null>;
};

const LICENSE_LINE = 'Clinical Establishment Reg. No. KA-REG-2024-1187 · NABH Pre-accredited';

export function PrescriptionPrint({
  patientName,
  patientUhid,
  doctorName = 'Consulting Physician',
  department = 'OPD',
  issuedDate,
  lines,
  printRef,
}: PrescriptionPrintProps) {
  const formattedDate =
    issuedDate ??
    new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <article
      id="printable-prescription"
      ref={printRef}
      className="print-prescription mx-auto w-full max-w-3xl rounded-xl border-2 border-slate-200 bg-white p-6 text-slate-900 shadow-sm"
    >
      <header className="border-b-2 border-slate-200 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col items-center sm:items-start">
            <RegalHospitalLogo heightClass="h-12" widthClass="w-auto" framed={false} priority={false} />
            <h1 className="mt-2 text-center text-lg font-black sm:text-left">{REGAL_HOSPITAL_FULL_NAME}</h1>
            <p className="mt-1 max-w-md text-center text-xs font-medium leading-relaxed text-slate-600 sm:text-left">
              {REGAL_HOSPITAL.address}
            </p>
            <p className="mt-1 text-center text-[11px] font-semibold text-slate-500 sm:text-left">
              {REGAL_HOSPITAL_NODE_LABEL}
            </p>
            <p className="mt-1 text-center text-[10px] font-medium text-slate-500 sm:text-left">{LICENSE_LINE}</p>
          </div>
          <div className="shrink-0 text-center sm:text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Outpatient Rx</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{formattedDate}</p>
          </div>
        </div>
      </header>

      <section className="mt-4 grid gap-3 border-b border-slate-100 pb-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Patient</p>
          <p className="font-bold text-slate-900">{patientName}</p>
          <p className="text-xs font-medium text-slate-600">UHID {patientUhid}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Prescriber</p>
          <p className="font-bold text-slate-900">{doctorName}</p>
          <p className="text-xs font-medium text-slate-600">{department}</p>
        </div>
      </section>

      <section className="mt-4 min-h-[180px]">
        <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Medications</p>
        {lines.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500">
            No medications prescribed
          </p>
        ) : (
          <ol className="space-y-3">
            {lines.map((line, index) => (
              <li key={line.id} className="flex gap-3 border-b border-slate-100 pb-3 last:border-b-0">
                <span className="font-black text-slate-900">{index + 1}.</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-900">{line.nameStrength}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-700">
                    {[line.dosage, line.frequency, line.duration, line.route].filter(Boolean).join(' · ')}
                  </p>
                  {line.specialInstructions ? (
                    <p className="mt-0.5 text-xs font-medium text-slate-600">{line.specialInstructions}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <footer className="mt-6 border-t border-slate-200 pt-4 text-[10px] font-medium text-slate-500">
        <p>This is a computer-generated prescription from Regal Health HMS. Valid with clinician verification.</p>
      </footer>
    </article>
  );
}

export function printPrescriptionElement(root: HTMLElement | null): void {
  if (!root || typeof window === 'undefined') return;
  window.print();
}
