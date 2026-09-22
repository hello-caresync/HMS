'use client';

import { Download, Printer, Stethoscope } from 'lucide-react';

import type { NormalizedPrescription } from '@/lib/patient/prescriptions-feed';
import { formatHospitalBadge } from '@/lib/utils/formatters';

type PrescriptionSheetProps = {
  rx: NormalizedPrescription;
};

function formatIssuedAt(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function doctorBadge(rx: NormalizedPrescription): string {
  return formatHospitalBadge({
    doctor_id: rx.doctor_id,
    name: rx.doctor_name,
  });
}

export function PrescriptionSheet({ rx }: PrescriptionSheetProps) {
  const medicineList = rx.medicines.length > 0 ? rx.medicines : rx.medications;
  const doctorAdvice =
    rx.doctor_advice ||
    rx.dietary_instructions ||
    rx.instructions ||
    '';
  const reportedSymptoms = rx.reported_symptoms?.trim() ?? '';

  return (
    <article className="rounded-2xl border border-sky-100 bg-white/90 p-6 shadow-sm backdrop-blur-sm print:break-inside-avoid">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[#F3ECE4] pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E6CCB2] bg-[#FAF6F0]">
            <Stethoscope className="h-5 w-5 text-[#8C5A3C]" aria-hidden />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#2B1810]">{rx.doctor_name || 'Treating physician'}</h3>
            <p className="text-[11px] font-medium text-[#7C5C48]">
              {rx.department || 'General Medicine'} · Badge{' '}
              <span className="font-semibold text-[#8C5A3C]">{doctorBadge(rx)}</span>
            </p>
            <p className="mt-0.5 text-[10px] text-[#7C5C48]">
              {rx.hospital_name || 'Regal Hospital · HOSP-01 (Bengaluru)'}
            </p>
          </div>
        </div>
        <time className="shrink-0 text-[11px] font-semibold text-[#7C5C48]" dateTime={rx.created_at}>
          {formatIssuedAt(rx.issued_at || rx.created_at)}
        </time>
      </header>

      {reportedSymptoms ? (
        <div className="mb-4 rounded-xl border border-[#EADBCE] bg-[#FAF6F0] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C5A3C]">
            Reported symptoms
          </p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-[#2B1810]">{reportedSymptoms}</p>
        </div>
      ) : null}

      {medicineList.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-[#EADBCE]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6F0] text-[11px] font-bold uppercase tracking-wider text-[#7C5C48]">
              <tr>
                <th className="px-3 py-2.5">Medicine</th>
                <th className="px-3 py-2.5">Dosage</th>
                <th className="px-3 py-2.5">Instruction / Frequency</th>
                <th className="px-3 py-2.5">Duration</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {medicineList.map((med, idx) => (
                <tr
                  key={`${rx.id}-med-${idx}`}
                  className={`border-t border-[#F3ECE4] ${idx % 2 === 1 ? 'bg-[#FAF6F0]/50' : 'bg-white'}`}
                >
                  <td className="px-3 py-2.5 font-semibold text-[#2B1810]">{med.name}</td>
                  <td className="px-3 py-2.5 text-[#7C5C48]">{med.dosage || '—'}</td>
                  <td className="px-3 py-2.5 text-[#7C5C48]">
                    {med.instructions || med.frequency || '—'}
                  </td>
                  <td className="px-3 py-2.5 text-[#7C5C48]">{med.duration || '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {doctorAdvice ? (
        <div className={`rounded-xl border border-[#E6CCB2] bg-[#FAF6F0] p-4 ${medicineList.length > 0 || reportedSymptoms ? 'mt-4' : ''}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C5A3C]">
            Doctor&apos;s advice
          </p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-[#2B1810]">{doctorAdvice}</p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#F3ECE4] pt-4 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#EADBCE] bg-white px-3 py-2 text-xs font-semibold text-[#7F5539] hover:bg-[#FAF6F0]"
        >
          <Printer className="h-3.5 w-3.5" />
          Print Slip
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#EADBCE] bg-white px-3 py-2 text-xs font-semibold text-[#7F5539] hover:bg-[#FAF6F0]"
        >
          <Download className="h-3.5 w-3.5" />
          Download PDF
        </button>
      </div>
    </article>
  );
}

export default PrescriptionSheet;
