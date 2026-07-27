'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Pill, ScanLine, Loader2 } from 'lucide-react';

import { OsBadge, OsBtn, OsPage, OsSegment, OsWidget } from '@/components/doctor-os/ui/OsPrimitives';
import { useClinicalOrders } from '@/lib/doctor/hooks/useClinicalQueries';
import { sageUi } from '@/lib/doctor/ui-tokens';
import { useOsColors } from '@/lib/doctor-os/store';

const ORDER_TYPES = [
  { id: 'lab', label: 'Laboratory', icon: FlaskConical },
  { id: 'rad', label: 'Radiology', icon: ScanLine },
  { id: 'rx', label: 'Pharmacy', icon: Pill },
] as const;

const QUICK_SETS = ['STAT Cardiac Workup', 'Diabetic Screen'] as const;

const PIPELINE = ['Requested', 'Sample Collected', 'Processing', 'Report Ready'] as const;

function OrdersInner({ defaultTab = 'lab' }: { defaultTab?: string }) {
  const c = useOsColors();
  const params = useSearchParams();
  const initialTab = params.get('tab') ?? defaultTab;
  const [tab, setTab] = useState(initialTab);
  const { data, isLoading, isError } = useClinicalOrders();

  const orders = data?.orders ?? [];
  const filtered = orders.filter((o) => tab === 'all' || o.type === tab);

  return (
    <OsPage>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.accent }}>Orders hub</p>
        <h1 className="text-[24px] font-bold tracking-[-0.03em]">Track every order</h1>
        <p className="mt-1 text-[13px]" style={{ color: c.textSecondary }}>
          Live lab, radiology, and pharmacy orders from PostgreSQL
        </p>
      </div>

      <OsSegment
        value={tab}
        onChange={setTab}
        options={ORDER_TYPES.map((t) => ({ id: t.id, label: t.label }))}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_SETS.map((q) => (
          <span key={q} className={sageUi.chip}>{q}</span>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-bold uppercase text-[#5A584A]">
        {PIPELINE.map((p, i) => (
          <span key={p}>
            {p}{i < PIPELINE.length - 1 ? ' →' : ''}
          </span>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: c.accent }} />
        </div>
      ) : isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Unable to load orders. Check database connection and sign in again.
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border p-8 text-center text-[13px]" style={{ borderColor: c.border, color: c.textSecondary }}>
          No {tab} orders yet. Create orders from OPD consultation or e-Prescription.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filtered.map((order) => (
            <motion.div
              key={order.id}
              layout
              className="rounded-2xl border p-4"
              style={{ backgroundColor: c.surface, borderColor: c.border }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <OsBadge tone={order.progress === 100 ? 'success' : 'info'}>{order.status}</OsBadge>
                  <p className="mt-2 font-bold">{order.test}</p>
                  <p className="text-[12px]" style={{ color: c.textSecondary }}>{order.patient}</p>
                </div>
                <span className="text-[11px] font-medium" style={{ color: c.textSecondary }}>{order.dept}</span>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[10px]" style={{ color: c.textSecondary }}>
                  <span>Progress</span>
                  <span>ETA {order.eta}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: c.muted }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: c.accent }}
                    initial={{ width: 0 }}
                    animate={{ width: `${order.progress}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <OsWidget title="New order" span={2}>
        <div className="flex flex-wrap gap-2">
          <OsBtn href="/doctor/e-prescription">From consultation</OsBtn>
          <OsBtn variant="secondary" href="/doctor/opd-consultation">From OPD workspace</OsBtn>
        </div>
      </OsWidget>
    </OsPage>
  );
}

export default function DoctorOsOrders({ defaultTab }: { defaultTab?: string }) {
  return (
    <Suspense fallback={null}>
      <OrdersInner defaultTab={defaultTab} />
    </Suspense>
  );
}
