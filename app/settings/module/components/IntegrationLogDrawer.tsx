'use client';

import type { IntegrationLogId } from '../settingsNav.types';
import { INTEGRATION_LOG_DETAILS } from '../lib/settingsMockData';
import { DrawerOverlay, SecureParameterBlock, settingsType } from './settingsUi';

type IntegrationLogDrawerProps = {
  logId: IntegrationLogId;
  onClose: () => void;
};

export function IntegrationLogDrawer({ logId, onClose }: IntegrationLogDrawerProps) {
  const detail = INTEGRATION_LOG_DETAILS[logId];

  return (
    <DrawerOverlay title={detail.title} subtitle="Integration protocol ledger · reference log" onClose={onClose}>
      <dl className="space-y-3">
        {detail.rows.map((row) => (
          <div key={row.label} className="rounded-lg border border-slate-100 bg-[#F8FAFC] px-4 py-3">
            <dt className={`${settingsType.label} font-semibold uppercase tracking-wide`}>{row.label}</dt>
            <dd className="mt-1">
              {row.masked ? <SecureParameterBlock verified /> : <span className={settingsType.body}>{row.value}</span>}
            </dd>
          </div>
        ))}
      </dl>
      <p className={`mt-4 ${settingsType.bodyMuted}`}>All credential fields are masked per enterprise security policy. Access audit logged.</p>
    </DrawerOverlay>
  );
}
