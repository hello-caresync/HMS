'use client';

import { useState } from 'react';

import { ChannelMessagingPanel } from '@/components/ecosystem/ChannelMessagingPanel';
import { VendorFeedbackBanner, useVendorFeedback } from '@/components/vendor/ui/useVendorFeedback';
import { VendorModuleHeader } from '@/components/vendor/ui/VendorModuleHeader';
import { createClient } from '@/lib/supabase/client';
import { sendVendorProcurementMessage } from '@/lib/ecosystem/channel-messaging-service';
import { useChannelMessaging } from '@/lib/ecosystem/use-channel-messaging';
import { ALL_HOSPITALS_CODE, DEFAULT_HOSPITAL_CODE, hospitalNameForCode } from '@/lib/vendor/hospitals';
import { useActiveHospitalCode } from '@/lib/vendor/store/vendor-app-store';
import { DEFAULT_VENDOR_ID } from '@/lib/vendor-supabase/constants';

/** V0 hospital–vendor bi-directional chat · unified channel_messages + realtime. */
function CommunicationWorkspace() {
  const { feedback, showSuccess, showError } = useVendorFeedback();
  const hospitalCode = useActiveHospitalCode();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const facilityCode = hospitalCode === ALL_HOSPITALS_CODE ? DEFAULT_HOSPITAL_CODE : hospitalCode;

  const { messages, loading, error, connected, reload, upsertMessage } = useChannelMessaging({
    filter: {
      channel_type: 'vendor_procurement',
      facility_code: facilityCode,
      vendor_id: DEFAULT_VENDOR_ID,
      limit: 200,
    },
    viewerRole: 'vendor',
  });

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;

    setSending(true);
    try {
      const result = await sendVendorProcurementMessage(createClient(), {
        message: text,
        sender_role: 'vendor',
        sender_name: 'MedSupply Dispatch',
        facility_code: facilityCode,
        vendor_id: DEFAULT_VENDOR_ID,
      });

      if (!result.ok) {
        showError(result.error ?? 'Could not send message.');
        return;
      }

      showSuccess('Message sent to hospital procurement.');
      if (result.row) upsertMessage(result.row);
      setDraft('');
      await reload();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Hospital–Vendor Messages"
        description={`Live procurement chat with ${hospitalNameForCode(facilityCode)} · vendor ${DEFAULT_VENDOR_ID.slice(0, 8)}… · channel_messages`}
      />

      <VendorFeedbackBanner feedback={feedback} />

      <ChannelMessagingPanel
        title={`${hospitalNameForCode(facilityCode)} Procurement`}
        subtitle={`vendor_procurement · ${facilityCode} · Supabase Realtime`}
        messages={messages}
        loading={loading}
        error={error}
        connected={connected}
        viewerRole="vendor"
        draft={draft}
        onDraftChange={setDraft}
        onSend={handleSend}
        sending={sending}
        onRefresh={reload}
        placeholder={`Message ${hospitalNameForCode(facilityCode)} procurement desk…`}
      />
    </div>
  );
}

export default CommunicationWorkspace;
export { CommunicationWorkspace };
