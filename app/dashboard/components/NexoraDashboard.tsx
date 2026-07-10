'use client';

import { Bell, Menu } from 'lucide-react';
import { useCallback, useState } from 'react';

import { INITIAL_NOTIFICATIONS } from '../lib/mockData';
import type { DashboardNotification } from '../types';
import DashboardSidebar from './DashboardSidebar';
import ExecutiveDashboard from './executive/ExecutiveDashboard';
import NotificationCenter from './NotificationCenter';

export default function NexoraDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<DashboardNotification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const handleClearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f1f5f9]">
      <DashboardSidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b-2 border-slate-200/80 bg-white/80 px-4 py-2 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-800 hover:bg-slate-100"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="relative rounded-lg p-2 text-slate-800 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-600" />
            )}
          </button>
        </div>

        <main className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
          <div className="mx-auto w-full max-w-[2400px]">
            <ExecutiveDashboard />
          </div>
        </main>
      </div>

      <NotificationCenter
        open={notificationsOpen}
        notifications={notifications}
        onClose={() => setNotificationsOpen(false)}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
