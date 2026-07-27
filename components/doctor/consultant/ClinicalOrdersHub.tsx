'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';

import { ClinicalDrawer } from '@/components/doctor/modules/ClinicalDrawer';
import { ClinicalPageHeader } from '@/components/doctor/doctor-ui';
import { useStatLabOrder } from '@/lib/doctor/hooks/useClinicalQueries';
import { sageUi } from '@/lib/doctor/ui-tokens';

type OrderTab = 'lab' | 'rad' | 'procedure' | 'surgery' | 'ipd';

type OrderStatus = 'Requested' | 'Sample Collected' | 'In Lab' | 'Report Ready';

type OrderRow = {
  id: string;
  type: string;
  description: string;
  status: OrderStatus;
  at: string;
  results?: { analyte: string; value: string; unit: string; flag?: 'high' | 'low' | 'normal' }[];
};

const STATUS_STEPS: OrderStatus[] = ['Requested', 'Sample Collected', 'In Lab', 'Report Ready'];

const ORDER_BUNDLES = [
  { id: 'cardiac', label: 'STAT Cardiac Workup', tests: ['Troponin', 'BMP', 'ECG'] },
  { id: 'postop', label: 'Post-Op Fever Panel', tests: ['CBC', 'CRP', 'Blood culture'] },
  { id: 'diabetic', label: 'Routine Diabetic Check', tests: ['HbA1c', 'Lipid panel', 'Urine microalbumin'] },
];

const MOCK_ORDERS: OrderRow[] = [
  {
    id: 'o1',
    type: 'Lab',
    description: 'CBC · Aishwarya D S',
    status: 'In Lab',
    at: '10:12',
    results: [
      { analyte: 'WBC', value: '11.2', unit: '×10³/µL', flag: 'high' },
      { analyte: 'Hb', value: '12.8', unit: 'g/dL', flag: 'normal' },
    ],
  },
  {
    id: 'o2',
    type: 'Lab',
    description: 'Troponin · K. Venkatesh',
    status: 'Report Ready',
    at: '09:48',
    results: [{ analyte: 'Troponin I', value: '0.02', unit: 'ng/mL', flag: 'normal' }],
  },
  {
    id: 'o3',
    type: 'Radiology',
    description: 'CT Chest · ER Bay 3',
    status: 'Report Ready',
    at: '09:30',
    results: [{ analyte: 'Impression', value: 'No acute infiltrate', unit: '', flag: 'normal' }],
  },
  {
    id: 'o4',
    type: 'Procedure',
    description: 'Echo · ward 3A',
    status: 'Requested',
    at: '11:00',
  },
  {
    id: 'o5',
    type: 'Lab',
    description: 'Potassium · ICU-04',
    status: 'Report Ready',
    at: '08:00',
    results: [{ analyte: 'Potassium', value: '6.1', unit: 'mmol/L', flag: 'high' }],
  },
  {
    id: 'o6',
    type: 'IPD Med',
    description: 'IV Piperacillin · ICU-04',
    status: 'In Lab',
    at: '10:05',
  },
];

const TABS: { id: OrderTab; label: string }[] = [
  { id: 'lab', label: 'Laboratory' },
  { id: 'rad', label: 'Radiology' },
  { id: 'procedure', label: 'Procedures' },
  { id: 'surgery', label: 'Surgeries' },
  { id: 'ipd', label: 'IPD medications' },
];

function StatusProgressBar({ status }: { status: OrderStatus }) {
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-0.5">
      {STATUS_STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-0.5">
          <div
            className={`h-1.5 w-8 rounded-full ${i <= idx ? 'bg-[#A39E75]' : 'bg-[#E6E3C5]'}`}
            title={s}
          />
          {i < STATUS_STEPS.length - 1 ? (
            <span className={`text-[8px] ${i < idx ? 'text-[#A39E75]' : 'text-[#C7C39E]'}`}>›</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function OrdersHubInner() {
  const params = useSearchParams();
  const initialTab = (params.get('tab') as OrderTab) || 'lab';
  const [tab, setTab] = useState<OrderTab>(TABS.some((t) => t.id === initialTab) ? initialTab : 'lab');
  const [drawerOrder, setDrawerOrder] = useState<OrderRow | null>(null);
  const statLab = useStatLabOrder();

  const filtered = MOCK_ORDERS.filter((o) => {
    if (tab === 'lab') return o.type === 'Lab';
    if (tab === 'rad') return o.type === 'Radiology';
    if (tab === 'procedure') return o.type === 'Procedure';
    if (tab === 'surgery') return o.type === 'Surgery';
    return o.type === 'IPD Med';
  });

  const placeBundle = (bundle: (typeof ORDER_BUNDLES)[0]) => {
    statLab.mutate(
      { statLabTests: bundle.tests },
      {
        onSuccess: () => toast.success(`Bundle ordered · ${bundle.label}`),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <div className={sageUi.page}>
      <ClinicalPageHeader title="Clinical orders" subtitle="Order bundles · live tracker · results drawer" />

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
              tab === t.id ? sageUi.segmentActive : `border border-[#C7C39E] bg-white ${sageUi.segmentIdle}`
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {ORDER_BUNDLES.map((b) => (
          <button key={b.id} type="button" className={sageUi.btnSecondary} onClick={() => placeBundle(b)}>
            {b.label}
          </button>
        ))}
      </div>

      <div className={`${sageUi.cardSolid} overflow-x-auto p-2`}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#E6E3C5] text-xs uppercase text-[#5C5A4E]">
              {['Order', 'Description', 'Progress', 'Status', 'Time', ''].map((h) => (
                <th key={h} className="px-3 py-2 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-[#F7F6E8] hover:bg-[#FAFAF5]">
                <td className="px-3 py-3 font-semibold">{row.type}</td>
                <td className="px-3 py-3">{row.description}</td>
                <td className="px-3 py-3">
                  <StatusProgressBar status={row.status} />
                </td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-[#E6E3C5]/60 px-2 py-0.5 text-xs font-bold">{row.status}</span>
                </td>
                <td className="px-3 py-3 tabular-nums text-[#5C5A4E]">{row.at}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    className="text-xs font-bold text-[#A39E75] hover:underline"
                    onClick={() => setDrawerOrder(row)}
                  >
                    View results
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ClinicalDrawer
        open={!!drawerOrder}
        title={drawerOrder?.description ?? 'Results'}
        onClose={() => setDrawerOrder(null)}
        wide
      >
        {drawerOrder?.results?.length ? (
          <ul className="space-y-3">
            {drawerOrder.results.map((r) => (
              <li
                key={r.analyte}
                className={`rounded-xl border p-3 ${
                  r.flag === 'high' || r.flag === 'low'
                    ? 'border-rose-200 bg-rose-50'
                    : 'border-[#E6E3C5] bg-[#FAFAF5]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold">{r.analyte}</p>
                  {r.flag === 'high' ? (
                    <span className="text-xs font-black text-rose-700">▲ HIGH</span>
                  ) : r.flag === 'low' ? (
                    <span className="text-xs font-black text-sky-700">▼ LOW</span>
                  ) : null}
                </div>
                <p className="mt-1 text-lg font-black tabular-nums">
                  {r.value} <span className="text-sm font-medium">{r.unit}</span>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#5C5A4E]">Results pending · sample not yet processed.</p>
        )}
      </ClinicalDrawer>
    </div>
  );
}

export default function ClinicalOrdersHub() {
  return (
    <Suspense fallback={null}>
      <OrdersHubInner />
    </Suspense>
  );
}
