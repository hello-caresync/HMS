'use client';

import React from 'react';

import {
  ChatMessage,
  NotificationItem,
  RolePermissions,
} from '../types/procurement';
import {
  alertInfoClassName,
  alertWarningClassName,
  btnOutlineClassName,
  btnPrimaryClassName,
  chatCanvasClassName,
  chatInputClassName,
  chatReceivedClassName,
  chatSentClassName,
  featureHeaderClassName,
  monoDataClassName,
  panelClassName,
  statusBadgeClass,
  workspaceClassName,
} from './hospitalUi';

type LiveMessagingViewProps = {
  chatThreads: ChatMessage[];
  notifications: NotificationItem[];
  chatInput: string;
  setChatInput: (value: string) => void;
  onSendChat: (event: React.FormEvent) => void;
  onMarkNotificationRead: (id: string) => void;
  permissions: RolePermissions;
};

export default function LiveMessagingView({
  chatThreads,
  notifications,
  chatInput,
  setChatInput,
  onSendChat,
  onMarkNotificationRead,
  permissions,
}: LiveMessagingViewProps) {
  return (
    <div className={`${workspaceClassName} grid gap-8 lg:grid-cols-2`}>
      <section className={`${panelClassName} space-y-4`}>
        <h3 className={featureHeaderClassName}>Notifications Desk</h3>

        {notifications.map((note) => (
          <div
            key={note.id}
            className={
              note.read
                ? `${alertInfoClassName} opacity-60`
                : note.severity === 'Warning' || note.severity === 'Critical'
                  ? alertWarningClassName
                  : alertInfoClassName
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-inherit">{note.title}</p>
                <p className="mt-1 text-xs font-semibold">{note.body}</p>
                <p className={`mt-1 text-[10px] ${monoDataClassName} text-slate-800`}>
                  {note.timestamp}
                </p>
              </div>
              <span className={statusBadgeClass(note.severity)}>
                {note.severity}
              </span>
            </div>
            {!note.read && (
              <button
                type="button"
                onClick={() => onMarkNotificationRead(note.id)}
                className={`${btnOutlineClassName} mt-3 border-[#F5D5CF] text-[#A65E53] hover:bg-[#FCEEEB]`}
              >
                Mark Read
              </button>
            )}
          </div>
        ))}
      </section>

      <section className={`${panelClassName} space-y-4`}>
        <h3 className={featureHeaderClassName}>Vendor Clarification Panel</h3>

        <div className={chatCanvasClassName}>
          {chatThreads.length === 0 ? (
            <p className="text-center text-xs font-semibold text-slate-800">
              No messages yet. Start a vendor thread below.
            </p>
          ) : (
            chatThreads.map((msg) => (
              <div
                key={msg.id}
                className={
                  msg.sender === 'Hospital' ? chatSentClassName : chatReceivedClassName
                }
              >
                <p>{msg.text}</p>
                <p
                  className={`mt-1 text-[10px] font-mono font-black ${
                    msg.sender === 'Hospital' ? 'text-white/80' : 'text-slate-800'
                  }`}
                >
                  {msg.sender} · {msg.timestamp}
                </p>
              </div>
            ))
          )}
        </div>

        {permissions.canSendMessages ? (
          <form onSubmit={onSendChat} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Type clarification message..."
              className={chatInputClassName}
            />
            <button type="submit" className={`${btnPrimaryClassName} shrink-0`}>
              Send
            </button>
          </form>
        ) : (
          <p className={alertWarningClassName}>
            Messaging locked for Department Staff accounts.
          </p>
        )}
      </section>
    </div>
  );
}
