'use client';

import { BarChart3, FileWarning, Receipt, Shield } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { MOCK_MLC_CASES, MOCK_TRANSFERS, MORTALITY_TREND, RESPONSE_TIME_ANALYSIS, formatInr } from '../lib/emergencyMockData';
import { ErPanel, SecureIdentityPlaceholder, StatusPill } from '../components/emergencyUi';

export default function DispositionTab() {
  return (
    <div className="space-y-2">
      <ErPanel title="Medico-Legal Cases (MLC) Ledger" subtitle="Police notifications · incident logs · chain of custody" icon={FileWarning}>
        <SecureIdentityPlaceholder verified />
        <div className="mt-2 space-y-2">
          {MOCK_MLC_CASES.map((mlc) => (
            <div key={mlc.id} className="rounded-md border border-l-4 border-l-slate-800 border-[#E2E8F0] p-2.5">
              <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold text-[#0F172A]">
                    {mlc.caseNumber} · {mlc.patientName}
                  </p>
                  <p className="font-mono text-[8px] text-slate-500">
                    {mlc.uhid.startsWith('TMP') ? 'Temporary ID Generated' : mlc.uhid}
                  </p>
                  <p className="mt-0.5 text-[9px] text-slate-600">{mlc.incidentType}</p>
                </div>
                <StatusPill status={mlc.status} />
              </div>
              <dl className="grid grid-cols-1 gap-1 text-[8px] md:grid-cols-2">
                <div><dt className="text-slate-400">Police Station</dt><dd className="font-medium">{mlc.policeStation}</dd></div>
                <div><dt className="text-slate-400">Opened</dt><dd>{mlc.openedAt}</dd></div>
                <div className="md:col-span-2"><dt className="text-slate-400">Injury Documentation</dt><dd>{mlc.injuryDocumentation}</dd></div>
                <div className="md:col-span-2"><dt className="text-slate-400">Chain of Custody</dt><dd className="italic text-slate-600">{mlc.chainOfCustody}</dd></div>
              </dl>
            </div>
          ))}
        </div>
      </ErPanel>

      <ErPanel title="Transfer & Emergency Billing" subtitle="Admit IPD · ICU · OT · discharge · charge collection" icon={Receipt}>
        <table className="w-full min-w-[680px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Transfer ID', 'Patient', 'Disposition', 'From → To', 'Status', 'Emergency Charges'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_TRANSFERS.map((t) => (
              <tr key={t.id} className="border-b border-slate-50">
                <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{t.id}</td>
                <td className="px-1.5 py-1">
                  <p className="text-[9px] font-semibold">{t.patientName}</p>
                  <p className="font-mono text-[7px] text-slate-500">{t.uhid.startsWith('TMP') ? 'Temporary ID Generated' : t.uhid}</p>
                </td>
                <td className="px-1.5 py-1 text-[8px] font-medium text-violet-700">{t.disposition}</td>
                <td className="px-1.5 py-1 text-[8px] text-slate-600">
                  {t.fromLocation} → {t.toLocation}
                </td>
                <td className="px-1.5 py-1"><StatusPill status={t.status} /></td>
                <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{formatInr(t.charges)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ErPanel>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <ErPanel title="Response Time Analysis" subtitle="Triage-to-treatment intervals vs targets" icon={BarChart3}>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={RESPONSE_TIME_ANALYSIS} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="interval" tick={{ fontSize: 8, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                <Legend wrapperStyle={{ fontSize: 8 }} />
                <Bar dataKey="count" fill="#2563EB" radius={[3, 3, 0, 0]} name="Actual" />
                <Bar dataKey="target" fill="#E2E8F0" radius={[3, 3, 0, 0]} name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ErPanel>

        <ErPanel title="Mortality Trends" subtitle="ER visits vs mortality rate (%)" icon={Shield}>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={MORTALITY_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#64748B' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 8, fill: '#64748B' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 8, fill: '#64748B' }} unit="%" domain={[0, 3]} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                <Legend wrapperStyle={{ fontSize: 8 }} />
                <Bar yAxisId="left" dataKey="erVisits" fill="#2563EB" name="ER Visits" />
                <Line yAxisId="right" type="monotone" dataKey="mortality" stroke="#EF4444" strokeWidth={2} dot={{ r: 2 }} name="Mortality %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ErPanel>
      </div>
    </div>
  );
}
