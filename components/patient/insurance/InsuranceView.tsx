'use client';

import { useMemo, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  CreditCard,
  FileCheck2,
  Shield,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { patientClasses } from '@/lib/patient/theme';
import { patientUi } from '@/lib/patient/ui-tokens';

type PreAuthStatus = 'approved' | 'pending' | 'denied';

type PreAuthRow = {
  id: string;
  procedure: string;
  provider: string;
  submitted: string;
  status: PreAuthStatus;
  reference: string;
};

const PRIMARY_POLICY = {
  payer: 'Star Health · Gold Family Floater',
  memberId: 'SH-8842-9921',
  group: 'NEXORA CORP · GRP-4410',
  effective: '01 Apr 2025 – 31 Mar 2026',
  copay: '₹500 OPD · 10% IPD',
  sumInsured: '₹25,00,000',
};

const PRE_AUTH: PreAuthRow[] = [
  {
    id: 'pa-1',
    procedure: 'Cardiac MRI with contrast',
    provider: 'Nexora Imaging · Block C',
    submitted: '10 Jul 2026',
    status: 'approved',
    reference: 'PA-NX-2026-1182',
  },
  {
    id: 'pa-2',
    procedure: 'Laparoscopic cholecystectomy',
    provider: 'Nexora Surgical Centre',
    submitted: '02 Jul 2026',
    status: 'pending',
    reference: 'PA-NX-2026-1094',
  },
  {
    id: 'pa-3',
    procedure: 'Home physiotherapy (12 sessions)',
    provider: 'CareSync Rehab Partners',
    submitted: '18 Jun 2026',
    status: 'approved',
    reference: 'PA-NX-2026-0881',
  },
];

const STATUS_LABEL: Record<PreAuthStatus, string> = {
  approved: 'Approved',
  pending: 'Under review',
  denied: 'Not covered',
};

function statusChip(status: PreAuthStatus) {
  if (status === 'approved') {
    return 'border-patient-success/40 bg-patient-success/15 text-patient-plum';
  }
  if (status === 'pending') {
    return 'border-patient-warning/40 bg-patient-warning/20 text-patient-plum';
  }
  return 'border-patient-error/35 bg-patient-error/10 text-patient-plum';
}

export function InsuranceView() {
  const [showCardBack, setShowCardBack] = useState(false);

  const approvedCount = useMemo(
    () => PRE_AUTH.filter((row) => row.status === 'approved').length,
    [],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={patientUi.pageTitle}>Insurance &amp; Coverage</h1>
          <p className={`mt-1 ${patientUi.bodyMuted}`}>
            Digital ID cards, active policies, and pre-authorization tracking · verified with TPA
            gateway · 14 Jul 2026
          </p>
        </div>
        <span className={patientUi.badgeAccent}>
          <BadgeCheck className="mr-1 inline h-3.5 w-3.5" aria-hidden />
          Eligibility verified today
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <section className={`${patientUi.panel} space-y-4`} aria-label="Active coverage">
          <div className="flex items-center gap-2">
            <Shield className={`h-5 w-5 ${patientUi.icon}`} aria-hidden />
            <h2 className={patientUi.sectionTitle}>Primary policy</h2>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className={patientUi.cardMuted}>
              <dt className="text-[10px] font-black uppercase tracking-wide text-patient-text/60">Payer plan</dt>
              <dd className="mt-1 text-sm font-bold text-patient-text">{PRIMARY_POLICY.payer}</dd>
            </div>
            <div className={patientUi.cardMuted}>
              <dt className="text-[10px] font-black uppercase tracking-wide text-patient-text/60">Member ID</dt>
              <dd className="mt-1 font-mono text-sm font-bold text-patient-primary">{PRIMARY_POLICY.memberId}</dd>
            </div>
            <div className={patientUi.cardMuted}>
              <dt className="text-[10px] font-black uppercase tracking-wide text-patient-text/60">Group / corporate</dt>
              <dd className="mt-1 text-sm font-bold text-patient-text">{PRIMARY_POLICY.group}</dd>
            </div>
            <div className={patientUi.cardMuted}>
              <dt className="text-[10px] font-black uppercase tracking-wide text-patient-text/60">Sum insured</dt>
              <dd className="mt-1 text-lg font-black tabular-nums text-patient-text">{PRIMARY_POLICY.sumInsured}</dd>
            </div>
          </dl>
          <p className={`text-xs ${patientUi.bodyMuted}`}>
            Policy period {PRIMARY_POLICY.effective} · Copay {PRIMARY_POLICY.copay}
          </p>
          <button
            type="button"
            className={patientClasses.btnSecondary}
            onClick={() => toast.success('Coverage PDF queued to secure downloads')}
          >
            <FileCheck2 className="mr-2 inline h-4 w-4" aria-hidden />
            Download policy schedule
          </button>
        </section>

        <section className={patientUi.panelMauve} aria-label="Digital insurance card">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CreditCard className={`h-5 w-5 ${patientUi.icon}`} aria-hidden />
              <h2 className={`${patientUi.sectionTitle} text-patient-text`}>Digital ID card</h2>
            </div>
            <button
              type="button"
              className={patientUi.link}
              onClick={() => setShowCardBack((v) => !v)}
            >
              {showCardBack ? 'Front' : 'Back'}
            </button>
          </div>
          <div
            className={`mt-4 rounded-2xl border border-patient-lavender/30 p-5 shadow-inner ${
              showCardBack ? 'bg-patient-plum text-white' : 'bg-white text-patient-text'
            }`}
          >
            {showCardBack ? (
              <>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#F3E8EE]">Claims &amp; TPA</p>
                <p className="mt-3 text-sm font-medium text-white/90">
                  TPA helpline 1800-425-STAR · Pre-auth fax NX-TPA-4410
                </p>
                <p className="mt-2 font-mono text-xs text-[#F3E8EE]">QR · ABDM consent linked</p>
              </>
            ) : (
              <>
                <p className="text-[10px] font-black uppercase tracking-widest text-patient-text/60">Nexora Patient</p>
                <p className="mt-2 text-lg font-black">{PRIMARY_POLICY.payer.split('·')[0]?.trim()}</p>
                <p className="mt-4 font-mono text-xl font-black text-patient-primary">{PRIMARY_POLICY.memberId}</p>
                <p className="mt-2 text-xs font-bold text-patient-text/70">{PRIMARY_POLICY.effective}</p>
              </>
            )}
          </div>
          <button
            type="button"
            className={`mt-4 w-full ${patientClasses.btnPrimary}`}
            onClick={() => toast.message('Wallet pass export — connect Apple / Google Wallet in settings')}
          >
            Add to phone wallet
          </button>
        </section>
      </div>

      <section className={patientUi.panel} aria-label="Pre-authorizations">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className={`h-5 w-5 ${patientUi.icon}`} aria-hidden />
            <h2 className={patientUi.sectionTitle}>Pre-authorizations</h2>
          </div>
          <p className={`text-xs font-bold ${patientUi.bodyMuted}`}>
            {approvedCount} of {PRE_AUTH.length} approved this quarter
          </p>
        </div>
        <ul className="space-y-3">
          {PRE_AUTH.map((row) => (
            <li key={row.id} className={patientUi.card}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-patient-text">{row.procedure}</p>
                  <p className={`mt-0.5 ${patientUi.bodyMuted}`}>{row.provider}</p>
                  <p className="mt-1 font-mono text-[10px] font-bold text-patient-primary">{row.reference}</p>
                </div>
                <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${statusChip(row.status)}`}>
                  {STATUS_LABEL[row.status]}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-patient-text/60">Submitted {row.submitted}</p>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={`mt-4 ${patientClasses.btnSecondary}`}
          onClick={() => toast.success('Pre-auth intake form opened in secure portal')}
        >
          <Upload className="mr-2 inline h-4 w-4" aria-hidden />
          Submit new pre-authorization
        </button>
      </section>
    </div>
  );
}
