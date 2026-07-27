'use client';

import { useCallback, useEffect, useState } from 'react';

import { UploadFSRModal, type FsrFormState } from '@/components/vendor/modals/UploadFSRModal';
import { VendorFeedbackBanner, useVendorFeedback } from '@/components/vendor/ui/useVendorFeedback';
import { VendorDataTable } from '@/components/vendor/ui/VendorDataTable';
import { VendorModuleHeader, VendorStatusPill } from '@/components/vendor/ui/VendorModuleHeader';
import { vendorClasses } from '@/lib/vendor/theme';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_VENDOR_ID } from '@/lib/vendor-supabase/constants';
import type { ServiceTicketRow } from '@/lib/vendor-supabase/types';

const emptyFsr: FsrFormState = { ticket_id: '', resolution_details: '', fsr_file_url: '' };

function priorityTone(p: ServiceTicketRow['priority']) {
  return p === 'CRITICAL' || p === 'HIGH' ? 'danger' : 'neutral';
}

function ServiceRequestsWorkspace() {
  const { feedback, showSuccess, showError } = useVendorFeedback();
  const [fsrOpen, setFsrOpen] = useState(false);
  const [form, setForm] = useState<FsrFormState>(emptyFsr);
  const [tickets, setTickets] = useState<ServiceTicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_tickets')
      .select('id, vendor_id, equipment_name, status, priority, issue_description, created_at, resolution_details, fsr_file_url')
      .eq('vendor_id', DEFAULT_VENDOR_ID)
      .order('created_at', { ascending: false });

    if (error) {
      showError(error.message);
      setTickets([]);
    } else {
      setTickets((data as ServiceTicketRow[]) ?? []);
    }
    setLoading(false);
  }, [showError]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const openFsr = () => {
    setForm({ ...emptyFsr, ticket_id: tickets[0]?.id ?? '' });
    setFsrOpen(true);
  };

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Service Requests"
        description="Installation, preventive maintenance, breakdown tickets, AMC, and field service reports."
        actions={
          <button type="button" onClick={openFsr} className={vendorClasses.btnSecondary}>
            Upload field report
          </button>
        }
      />

      <VendorFeedbackBanner feedback={feedback} />

      {loading ? (
        <p className="text-sm text-vendor-muted">Loading service tickets…</p>
      ) : (
        <VendorDataTable<ServiceTicketRow>
          rows={tickets}
          rowKey={(t) => t.id}
          columns={[
            {
              key: 'id',
              header: 'Ticket',
              render: (t) => <span className="font-mono text-xs">{t.id.slice(0, 8)}…</span>,
            },
            { key: 'equip', header: 'Equipment', render: (t) => t.equipment_name },
            {
              key: 'priority',
              header: 'Priority',
              render: (t) => <VendorStatusPill label={t.priority} tone={priorityTone(t.priority)} />,
            },
            {
              key: 'status',
              header: 'Status',
              render: (t) => <VendorStatusPill label={t.status} tone={t.status === 'OPEN' ? 'info' : 'neutral'} />,
            },
            {
              key: 'issue',
              header: 'Issue',
              render: (t) => (
                <span className="line-clamp-2 max-w-xs text-xs">{t.issue_description}</span>
              ),
            },
            {
              key: 'when',
              header: 'Created',
              render: (t) => new Date(t.created_at).toLocaleString('en-IN'),
            },
          ]}
        />
      )}

      <UploadFSRModal
        open={fsrOpen}
        onClose={() => setFsrOpen(false)}
        tickets={tickets}
        form={form}
        onFormChange={setForm}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        onSuccess={() => void loadTickets()}
        onSuccessMessage={showSuccess}
        onErrorMessage={showError}
      />
    </div>
  );
}

export default ServiceRequestsWorkspace;
export { ServiceRequestsWorkspace };
