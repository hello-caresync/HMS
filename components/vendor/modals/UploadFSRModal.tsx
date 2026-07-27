'use client';

import { useMemo } from 'react';

import { vendorFieldClass, vendorLabelClass, VendorModal } from '@/components/vendor/ui/VendorModal';
import { FSR_FALLBACK_TICKETS, isDemoTicketId } from '@/lib/vendor/fallbacks';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_VENDOR_ID } from '@/lib/vendor-supabase/constants';
import type { ServiceTicketRow } from '@/lib/vendor-supabase/types';

export type FsrFormState = {
  ticket_id: string;
  resolution_details: string;
  fsr_file_url: string;
};

type UploadFSRModalProps = {
  open: boolean;
  onClose: () => void;
  tickets: Pick<ServiceTicketRow, 'id' | 'equipment_name' | 'status'>[];
  form: FsrFormState;
  onFormChange: (next: FsrFormState) => void;
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
  onSuccess: () => void;
  onSuccessMessage: (message: string) => void;
  onErrorMessage: (message: string) => void;
};

export function UploadFSRModal({
  open,
  onClose,
  tickets,
  form,
  onFormChange,
  isSubmitting,
  setIsSubmitting,
  onSuccess,
  onSuccessMessage,
  onErrorMessage,
}: UploadFSRModalProps) {
  const ticketOptions = useMemo(() => {
    const fromDb = (tickets ?? []).filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED');
    if (fromDb.length > 0) {
      return fromDb.map((t) => ({
        id: t.id,
        label: `${t.id.slice(0, 8)}… · ${t.equipment_name}`,
      }));
    }
    return FSR_FALLBACK_TICKETS.map((t) => ({
      id: t.id,
      label: `${t.id} (${t.equipment_name})`,
    }));
  }, [tickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ticket_id) {
      window.alert('Select a service ticket.');
      return;
    }
    setIsSubmitting(true);

    if (isDemoTicketId(form.ticket_id)) {
      setIsSubmitting(false);
      onSuccessMessage(`FSR attached · ${form.ticket_id} marked RESOLVED (demo).`);
      onSuccess();
      onClose();
      return;
    }

    const { error } = await supabase
      .from('service_tickets')
      .update({
        resolution_details: form.resolution_details.trim(),
        fsr_file_url: form.fsr_file_url.trim() || null,
        status: 'RESOLVED',
      })
      .eq('id', form.ticket_id)
      .eq('vendor_id', DEFAULT_VENDOR_ID);

    setIsSubmitting(false);

    if (error) {
      onErrorMessage(error.message);
      window.alert(`Error: ${error.message}`);
      return;
    }

    onSuccessMessage('Field service report attached · ticket resolved.');
    onSuccess();
    onClose();
  };

  return (
    <VendorModal
      title="Upload field service report"
      open={open}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-bold">
            Cancel
          </button>
          <button
            type="submit"
            form="upload-fsr-form"
            disabled={isSubmitting}
            className="rounded-lg bg-vendor-secondary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Uploading…' : 'Attach FSR'}
          </button>
        </>
      }
    >
      <form id="upload-fsr-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
        <label className={vendorLabelClass}>
          Service ticket ID
          <select
            required
            value={form.ticket_id}
            onChange={(e) => onFormChange({ ...form, ticket_id: e.target.value })}
            className={vendorFieldClass}
          >
            <option value="">Select ticket…</option>
            {ticketOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className={vendorLabelClass}>
          Resolution details
          <textarea
            required
            rows={4}
            value={form.resolution_details}
            onChange={(e) => onFormChange({ ...form, resolution_details: e.target.value })}
            className={vendorFieldClass}
          />
        </label>
        <label className={vendorLabelClass}>
          FSR document URL
          <input
            type="url"
            value={form.fsr_file_url}
            onChange={(e) => onFormChange({ ...form, fsr_file_url: e.target.value })}
            placeholder="https://…"
            className={vendorFieldClass}
          />
        </label>
      </form>
    </VendorModal>
  );
}
