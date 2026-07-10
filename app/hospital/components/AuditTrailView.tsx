'use client';

import React from 'react';

import { AuditLogEntry } from '../types/procurement';
import {
  bodyTextClassName,
  EmptyState,
  featureHeaderClassName,
  monoDataClassName,
  PageHeader,
  panelClassName,
  workspaceClassName,
} from './hospitalUi';

type AuditTrailViewProps = {
  auditLogs: AuditLogEntry[];
};

export default function AuditTrailView({ auditLogs }: AuditTrailViewProps) {
  return (
    <div className={workspaceClassName}>
      <PageHeader
        overline="Immutable ledger"
        title="Legal Compliance Audit Trail"
        description="Read-only immutable history with timestamps for regulatory review."
      />

      {auditLogs.length === 0 ? (
        <EmptyState message="No audit events recorded yet." />
      ) : (
        auditLogs.map((log) => (
          <article
            key={log.id}
            className={`${panelClassName} flex items-start gap-4`}
          >
            <span className={`shrink-0 text-[10px] ${monoDataClassName} text-slate-800`}>
              {log.id}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${featureHeaderClassName}`}>
                {log.actionDescription}
              </p>
              <p className={`mt-1 text-[10px] ${monoDataClassName} text-slate-800`}>
                {log.timestamp} · {log.userName} ({log.userId})
              </p>
              <p className="mt-1 text-[10px] font-mono font-black text-[#A65E53]">
                {log.metadataToken}
              </p>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
