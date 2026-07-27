'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMemo, useState } from 'react';

import { VendorFeedbackBanner, useVendorFeedback } from '@/components/vendor/ui/useVendorFeedback';
import { VendorModuleHeader } from '@/components/vendor/ui/VendorModuleHeader';
import { vendorClasses } from '@/lib/vendor/theme';
import { MOCK_ANALYTICS_SERIES } from '@/lib/vendor/mock/data';

const CHART_TOOLTIP = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid rgba(244, 162, 97, 0.35)',
    fontSize: 12,
  },
};

function AnalyticsWorkspace() {
  const s = MOCK_ANALYTICS_SERIES;
  const { feedback, showSuccess } = useVendorFeedback();
  const [exporting, setExporting] = useState(false);

  const salesData = useMemo(
    () => s.salesMonths.map((month, i) => ({ month, sales: s.salesValues[i] ?? 0 })),
    [s.salesMonths, s.salesValues],
  );

  const fulfillmentData = useMemo(
    () => s.salesMonths.map((month, i) => ({ month, pct: s.fulfillmentPct[i] ?? 0 })),
    [s.salesMonths, s.fulfillmentPct],
  );

  const qualityData = useMemo(
    () => s.salesMonths.map((month, i) => ({ month, rating: s.qualityRating[i] ?? 0 })),
    [s.salesMonths, s.qualityRating],
  );

  const handleExportReport = () => {
    setExporting(true);
    const rows = [
      ['Month', 'Sales_Lakh_INR', 'OnTime_Fulfillment_Pct', 'Quality_Rating'],
      ...s.salesMonths.map((month, i) => [
        month,
        String(s.salesValues[i] ?? 0),
        String(s.fulfillmentPct[i] ?? 0),
        String(s.qualityRating[i] ?? 0),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nexora_vendor_business_analytics.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setExporting(false);
    showSuccess('Business analytics CSV downloaded.');
  };

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Business Analytics"
        description="Sales trends, on-time fulfillment, quality ratings · procurement performance only."
        actions={
          <button
            type="button"
            disabled={exporting}
            onClick={handleExportReport}
            className={vendorClasses.btnPrimary}
          >
            {exporting ? 'Exporting…' : 'Export report'}
          </button>
        }
      />

      <VendorFeedbackBanner feedback={feedback} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={`${vendorClasses.card} p-5`}>
          <h2 className="text-sm font-black text-vendor-charcoal">Sales trend (₹L)</h2>
          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,162,97,0.25)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip {...CHART_TOOLTIP} />
                <Bar dataKey="sales" fill="#FFB703" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={`${vendorClasses.card} p-5`}>
          <h2 className="text-sm font-black text-vendor-charcoal">On-time fulfillment %</h2>
          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fulfillmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,162,97,0.25)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[90, 100]} tick={{ fontSize: 11 }} />
                <Tooltip {...CHART_TOOLTIP} />
                <Line type="monotone" dataKey="pct" stroke="#F77F00" strokeWidth={3} dot={{ fill: '#2A9D8F' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={`${vendorClasses.card} p-5 lg:col-span-2`}>
          <h2 className="text-sm font-black text-vendor-charcoal">Quality rating trend</h2>
          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qualityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,162,97,0.25)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[4, 5]} tick={{ fontSize: 11 }} />
                <Tooltip {...CHART_TOOLTIP} />
                <Line type="monotone" dataKey="rating" stroke="#2A9D8F" strokeWidth={3} dot={{ fill: '#FFB703' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AnalyticsWorkspace;
export { AnalyticsWorkspace };
