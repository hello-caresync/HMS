'use client';

import { Brain, BookOpen, TrendingUp } from 'lucide-react';
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

import type { AiFinanceInsight } from '../lib/billingMockData';
import {
  CASH_FLOW,
  MOCK_GL_ACCOUNTS,
  MOCK_GST_ITC,
  MOCK_JOURNAL_ENTRIES,
  PL_SUMMARY,
  formatInr,
} from '../lib/billingMockData';
import type { AiFinanceInsightStatus } from '../billingNav.types';
import {
  AiStatusPill,
  FinPanel,
  FraudPill,
  SecureFinancialPlaceholder,
} from '../components/billingUi';

type AccountingAiTabProps = {
  aiInsights: AiFinanceInsight[];
  onUpdateAiStatus: (id: string, status: AiFinanceInsightStatus) => void;
};

export default function AccountingAiTab({ aiInsights, onUpdateAiStatus }: AccountingAiTabProps) {
  const pendingAi = aiInsights.filter((i) => i.status === 'Pending Review');
  const suspicious = aiInsights.filter((i) => i.riskLevel === 'Suspicious').length;
  const trialBalance = MOCK_GL_ACCOUNTS.reduce((s, a) => s + Math.abs(a.balance), 0);

  return (
    <div className="space-y-2">
      {suspicious > 0 && (
        <div className="rounded-md border-2 border-red-500 bg-red-600 px-3 py-2 text-white animate-pulse">
          <span className="text-[11px] font-bold uppercase">Fraud Detection — {suspicious} suspicious activity flag{suspicious !== 1 ? 's' : ''} under review</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <FinPanel title="Chart of Accounts" subtitle="Asset · liability · revenue · expense balances" icon={BookOpen} secure>
          <SecureFinancialPlaceholder verified />
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Code', 'Account', 'Type', 'Balance'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_GL_ACCOUNTS.map((a) => (
                <tr key={a.id} className="border-b border-slate-50">
                  <td className="px-1.5 py-1 font-mono text-[8px] text-[#2563EB]">{a.code}</td>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{a.name}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{a.type}</td>
                  <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${a.type === 'Revenue' ? 'text-emerald-600' : a.type === 'Expense' ? 'text-red-600' : 'text-[#0F172A]'}`}>
                    {formatInr(a.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[9px] font-bold text-slate-600">Trial Balance (absolute sum): {formatInr(trialBalance)}</p>
        </FinPanel>

        <FinPanel title="Journal Entries & GST ITC" subtitle="Immutable ledger · input tax credit tracking">
          <p className="mb-1 text-[8px] font-bold uppercase text-slate-500">Recent Journal Entries</p>
          <table className="mb-3 w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Entry', 'Date', 'Description', 'Debit/Credit', 'Posted'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_JOURNAL_ENTRIES.map((j) => (
                <tr key={j.id} className="border-b border-slate-50">
                  <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{j.entryId}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{j.date}</td>
                  <td className="max-w-[120px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={j.description}>{j.description}</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{formatInr(j.debit)}</td>
                  <td className="px-1.5 py-1">{j.posted ? <span className="text-[8px] font-bold text-emerald-600">Posted</span> : <span className="text-[8px] text-amber-600">Draft</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mb-1 text-[8px] font-bold uppercase text-slate-500">GST Input Tax Credit</p>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Period', 'Output GST', 'Input ITC', 'Net Payable', 'Filed'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_GST_ITC.map((g) => (
                <tr key={g.id} className={`border-b border-slate-50 ${!g.filed ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{g.period}</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{formatInr(g.outputGst)}</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums text-emerald-600">{formatInr(g.inputItc)}</td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{formatInr(g.netPayable)}</td>
                  <td className="px-1.5 py-1">{g.filed ? <span className="text-[8px] font-bold text-emerald-600">Filed</span> : <span className="text-[8px] font-bold text-amber-600">Pending</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </FinPanel>
      </div>

      <FinPanel title="AI-Based Finance Intelligence Hub" subtitle="Revenue forecasts · fraud detection · cost optimization" icon={Brain} secure>
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Type', 'Insight', 'Detail', 'Action', 'Impact / Risk', 'Conf.', 'Status', ''].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aiInsights.map((i) => (
              <tr key={i.id} className={`border-b border-slate-50 ${i.riskLevel === 'Suspicious' ? 'bg-red-50/40' : i.status === 'Pending Review' ? 'bg-indigo-50/20' : ''}`}>
                <td className="px-1.5 py-1 text-[8px] font-bold text-indigo-700">{i.insightType}</td>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{i.title}</td>
                <td className="max-w-[120px] truncate px-1.5 py-1 text-[8px] text-slate-500" title={i.detail}>{i.detail}</td>
                <td className="max-w-[130px] truncate px-1.5 py-1 text-[8px] text-[#2563EB]" title={i.suggestedAction}>{i.suggestedAction}</td>
                <td className="px-1.5 py-1 text-[8px]">
                  {i.impact && <span className="font-bold text-emerald-700">{i.impact}</span>}
                  {i.riskLevel && <FraudPill level={i.riskLevel} />}
                </td>
                <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{i.confidence}%</td>
                <td className="px-1.5 py-1"><AiStatusPill status={i.status} /></td>
                <td className="px-1.5 py-1">
                  {i.status === 'Pending Review' && (
                    <div className="flex gap-0.5">
                      <button type="button" onClick={() => onUpdateAiStatus(i.id, 'Accepted')} className="rounded bg-emerald-600 px-1 py-0.5 text-[7px] font-bold text-white">Accept</button>
                      <button type="button" onClick={() => onUpdateAiStatus(i.id, 'Rejected')} className="rounded border border-slate-300 px-1 py-0.5 text-[7px] font-bold text-slate-600">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </FinPanel>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
        <FinPanel title="Profit & Loss Trend" icon={TrendingUp}>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={PL_SUMMARY} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} tickFormatter={(v) => `₹${(v / 10000000).toFixed(1)}Cr`} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} formatter={(v: number) => formatInr(v)} />
                <Legend wrapperStyle={{ fontSize: 8 }} />
                <Bar dataKey="revenue" fill="#059669" name="Revenue" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expense" fill="#DC2626" name="Expense" radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={0} dot={false} legendType="none" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </FinPanel>

        <FinPanel title="Balance Sheet Snapshot" subtitle="Assets vs liabilities">
          <div className="space-y-1">
            {[
              { label: 'Total Assets', value: 16840000, color: 'text-emerald-600' },
              { label: 'Total Liabilities', value: 6280000, color: 'text-red-600' },
              { label: 'Net Equity (Est.)', value: 10560000, color: 'text-[#2563EB]' },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between rounded border border-[#E2E8F0] px-2 py-1.5">
                <span className="text-[9px] font-semibold text-slate-600">{r.label}</span>
                <span className={`text-[11px] font-bold tabular-nums ${r.color}`}>{formatInr(r.value)}</span>
              </div>
            ))}
          </div>
        </FinPanel>

        <FinPanel title="Cash Flow Metrics" subtitle="Operating · investing · financing">
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CASH_FLOW} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} formatter={(v: number) => formatInr(v)} />
                <Legend wrapperStyle={{ fontSize: 8 }} />
                <Bar dataKey="operating" fill="#059669" name="Operating" stackId="a" />
                <Bar dataKey="investing" fill="#DC2626" name="Investing" stackId="a" />
                <Bar dataKey="financing" fill="#6366F1" name="Financing" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FinPanel>
      </div>
    </div>
  );
}
