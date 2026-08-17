'use client';

import { useState } from 'react';

import { ChannelMessagingPanel } from '@/components/ecosystem/ChannelMessagingPanel';
import { createClient } from '@/lib/supabase/client';
import {
  REGAL_FACILITY_CODE,
  sendVendorProcurementMessage,
} from '@/lib/ecosystem/channel-messaging-service';
import { useChannelMessaging } from '@/lib/ecosystem/use-channel-messaging';
import { DEFAULT_VENDOR_ID } from '@/lib/vendor-supabase/constants';

type VendorProcurementChatProps = {
  facilityCode?: string;
  vendorId?: string;
  vendorName?: string;
};

/** Regal Hospital procurement desk ↔ vendor bi-directional chat. */
export function VendorProcurementChat({
  facilityCode = REGAL_FACILITY_CODE,
  vendorId = DEFAULT_VENDOR_ID,
  vendorName = 'MedSupply Dispatch',
}: VendorProcurementChatProps) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const { messages, loading, error, connected, reload, upsertMessage } = useChannelMessaging({
    filter: {
      channel_type: 'vendor_procurement',
      facility_code: facilityCode,
      vendor_id: vendorId,
      limit: 200,
    },
    viewerRole: 'hospital_admin',
  });

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;

    setSending(true);
    setSendError(null);
    try {
      const result = await sendVendorProcurementMessage(createClient(), {
        message: text,
        sender_role: 'hospital_admin',
        sender_name: 'Regal Hospital Desk',
        facility_code: facilityCode,
        vendor_id: vendorId,
      });

      if (!result.ok) {
        setSendError(result.error ?? 'Could not send message.');
        return;
      }

      if (result.row) upsertMessage(result.row);
      setDraft('');
      await reload();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <ChannelMessagingPanel
      title="Vendor Procurement Channel"
      subtitle={`Live chat with ${vendorName} · ${facilityCode} · channel_messages · vendor_procurement`}
      messages={messages}
      loading={loading}
      error={error ?? sendError}
      connected={connected}
      viewerRole="hospital_admin"
      draft={draft}
      onDraftChange={setDraft}
      onSend={handleSend}
      sending={sending}
      onRefresh={reload}
      placeholder={`Message ${vendorName} about POs, deliveries, or invoices…`}
      emptyMessage="No vendor messages yet. Send procurement clarifications here — the Vendor App updates in real time."
    />
  );
}

export default VendorProcurementChat;
