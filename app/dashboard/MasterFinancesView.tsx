'use client';

import { useState } from 'react';
import { CreditCard, Landmark, Percent, ShieldCheck } from 'lucide-react';

import {
  MasterDataTable,
  MasterField,
  MasterPanel,
  MasterTabBar,
  MasterViewHeader,
  masterBtnPrimary,
  masterInputClass,
} from './_masterLightUi';

type FinanceTab = 'tax' | 'insurance' | 'payments';

const TAX_PROFILES = [
  { bracket: 'GST Exempt (0%)', cgst: '0%', sgst: '0%', igst: '0%', services: 'Essential diagnostics' },
  { bracket: 'Healthcare Standard (5%)', cgst: '2.5%', sgst: '2.5%', igst: '5%', services: 'Life-saving drugs' },
  { bracket: 'General Pharma (12%)', cgst: '6%', sgst: '6%', igst: '12%', services: 'Formulary SKUs' },
  { bracket: 'Premium Services (18%)', cgst: '9%', sgst: '9%', igst: '18%', services: 'Non-clinical add-ons' },
];

const INSURANCE_CONTRACTS = [
  {
    tpa: 'Star Health TPA',
    clearance: 'Pre-auth within 4h',
    corporateCap: '₹5,00,000',
    status: 'Active',
  },
  {
    tpa: 'MediAssist Corporate',
    clearance: 'Cashless · 24h SLA',
    corporateCap: '₹10,00,000',
    status: 'Active',
  },
  {
    tpa: 'FHPL — PSU Panel',
    clearance: 'Manual review queue',
    corporateCap: '₹2,50,000',
    status: 'Review',
  },
];

const PAYMENT_MODES = [
  { mode: 'Cash', gateway: 'Counter POS', protocol: 'Manual receipt · Shift close', enabled: true },
  { mode: 'Card', gateway: 'Razorpay Terminal', protocol: 'EMV · 3DS enabled', enabled: true },
  { mode: 'UPI', gateway: 'NPCI UPI Switch', protocol: 'QR + VPA collect', enabled: true },
  { mode: 'Corporate Credit Ledger', gateway: 'Internal AR Module', protocol: 'Credit limit · 30d terms', enabled: true },
];

export default function MasterFinancesView() {
  const [tab, setTab] = useState<FinanceTab>('tax');
  const [interestRate, setInterestRate] = useState('1.5');
  const [gatewayTimeout, setGatewayTimeout] = useState('30');

  return (
    <div className="space-y-6">
      <MasterViewHeader
        title="Global Finance Settings"
        subtitle="Tax master profiles, insurance contracts, payment modes, and gateway protocol variables."
        icon={Landmark}
      />

      <MasterTabBar
        tabs={[
          { id: 'tax', label: 'Tax Master' },
          { id: 'insurance', label: 'Insurance Master' },
          { id: 'payments', label: 'Payment Modes' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'tax' && (
        <>
          <MasterPanel title="GST / CGST / SGST Brackets" description="Healthcare tax tier configuration">
            <MasterDataTable
              columns={['Profile', 'CGST', 'SGST', 'IGST', 'Applicable Services']}
              rows={TAX_PROFILES.map((t) => [
                <span key="p" className="font-semibold text-slate-800">
                  {t.bracket}
                </span>,
                t.cgst,
                t.sgst,
                t.igst,
                t.services,
              ])}
            />
          </MasterPanel>
          <MasterPanel title="Base Interest Variables" description="Late payment and credit surcharge parameters">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <MasterField label="Monthly Interest Rate (%)">
                <input
                  type="number"
                  step="0.1"
                  className={masterInputClass}
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
              </MasterField>
              <MasterField label="Grace Period (days)">
                <input type="number" className={masterInputClass} defaultValue={15} />
              </MasterField>
            </div>
            <button type="button" className={`${masterBtnPrimary} mt-4`}>
              <Percent className="h-3.5 w-3.5" />
              Save Tax Parameters
            </button>
          </MasterPanel>
        </>
      )}

      {tab === 'insurance' && (
        <MasterPanel title="Insurance & TPA Contracts" description="Corporate caps and clearance parameters">
          <MasterDataTable
            columns={['TPA / Insurer', 'Clearance SLA', 'Corporate Cap', 'Status']}
            rows={INSURANCE_CONTRACTS.map((c) => [
              <span key="t" className="font-semibold text-slate-800">
                {c.tpa}
              </span>,
              c.clearance,
              <span key="cap" className="font-semibold tabular-nums text-blue-600">
                {c.corporateCap}
              </span>,
              <span
                key="s"
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${
                  c.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : 'bg-amber-50 text-amber-700 ring-amber-200'
                }`}
              >
                {c.status}
              </span>,
            ])}
          />
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            TPA clearance rules propagate to billing pre-authorization workflows.
          </p>
        </MasterPanel>
      )}

      {tab === 'payments' && (
        <>
          <MasterPanel title="Accepted Payment Modes" description="Counter and digital collection channels">
            <MasterDataTable
              columns={['Mode', 'Gateway', 'Protocol', 'Status']}
              rows={PAYMENT_MODES.map((p) => [
                <span key="m" className="font-semibold text-slate-800">
                  {p.mode}
                </span>,
                p.gateway,
                p.protocol,
                p.enabled ? (
                  <span key="e" className="text-[10px] font-bold uppercase text-emerald-600">
                    Enabled
                  </span>
                ) : (
                  'Disabled'
                ),
              ])}
            />
          </MasterPanel>
          <MasterPanel title="Gateway Protocol Settings" description="Timeout and retry configuration">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <MasterField label="Gateway Timeout (seconds)">
                <input
                  type="number"
                  className={masterInputClass}
                  value={gatewayTimeout}
                  onChange={(e) => setGatewayTimeout(e.target.value)}
                />
              </MasterField>
              <MasterField label="Auto-retry Attempts">
                <input type="number" className={masterInputClass} defaultValue={3} />
              </MasterField>
            </div>
            <button type="button" className={`${masterBtnPrimary} mt-4`}>
              <CreditCard className="h-3.5 w-3.5" />
              Save Gateway Protocol
            </button>
          </MasterPanel>
        </>
      )}
    </div>
  );
}
