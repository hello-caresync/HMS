'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Bell, Menu, Search, UserCircle, X } from 'lucide-react';

import { hospitalHref } from '@/lib/nexora-hospital/navigation';
import { useUnreadHospitalNotifications } from '@/lib/nexora-hospital/hooks';
import { useHospitalStore } from '@/lib/nexora-hospital/store';

const NOTIF_TABS = ['All', 'Appointments', 'Billing', 'Inventory', 'Vendor', 'Emergency'] as const;

function shiftLabel(): string {
  const h = new Date().getHours();
  if (h >= 8 && h < 16) return 'Shift: Morning (08:00 - 16:00)';
  if (h >= 16 && h < 24) return 'Shift: Evening (16:00 - 00:00)';
  return 'Shift: Night (00:00 - 08:00)';
}

export function HospitalTopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const unread = useUnreadHospitalNotifications();
  const settings = useHospitalStore((s) => s.settings);
  const realtimeConnected = useHospitalStore((s) => s.realtimeConnected);
  const allNotifications = useHospitalStore((s) => s.notifications);
  const patients = useHospitalStore((s) => s.patients);

  const [search, setSearch] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<(typeof NOTIF_TABS)[number]>('All');

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    [],
  );

  const filteredNotifs = useMemo(() => {
    if (notifTab === 'All') return allNotifications.slice(0, 12);
    const cat = notifTab.toLowerCase();
    return allNotifications
      .filter((n) => n.category.includes(cat) || n.title.toLowerCase().includes(cat))
      .slice(0, 12);
  }, [allNotifications, notifTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim().toLowerCase();
    if (!q) return;
    const match = patients.find(
      (p) => p.fullName.toLowerCase().includes(q) || p.uhid.toLowerCase().includes(q),
    );
    if (match) router.push(`${hospitalHref('patients')}?q=${encodeURIComponent(match.uhid)}`);
    else router.push(`${hospitalHref('patients')}?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-20 flex min-h-[4.5rem] flex-wrap items-center gap-3 border-b border-[#B2EBF2] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex min-w-[200px] items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-[#007B8A] hover:bg-[#E0F7FA] lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          <p className="text-base font-extrabold text-[#0A2E36]">🏥 Nexora Hospital</p>
          <p className="text-sm font-medium text-[#005F6B]">Operations Hub V0</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mx-auto flex max-w-xl flex-1 items-center">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#007B8A]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search… (Ctrl+K)"
            className="w-full rounded-xl border border-[#B2EBF2] bg-[#F0F8F9] py-2.5 pl-10 pr-4 text-base font-medium text-[#0A2E36] placeholder:text-[#4A6B72]/60 focus:border-[#007B8A] focus:outline-none focus:ring-2 focus:ring-[#B2EBF2]"
          />
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <div className="hidden text-right md:block">
          <p className="text-sm font-bold text-[#0A2E36]">{todayLabel}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[#007B8A]">{shiftLabel()}</p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((o) => !o)}
            className="relative rounded-xl border border-[#B2EBF2] p-2.5 text-[#007B8A] hover:bg-[#E0F7FA]"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#007B8A] px-1 text-xs font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <>
              <button type="button" className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} aria-label="Close" />
              <div className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-[#B2EBF2] bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-[#B2EBF2] px-4 py-3">
                  <p className="font-bold text-[#0A2E36]">Alerts</p>
                  <button type="button" onClick={() => setNotifOpen(false)}><X className="h-4 w-4 text-[#005F6B]" /></button>
                </div>
                <div className="flex flex-wrap gap-1 border-b border-[#B2EBF2]/60 p-2">
                  {NOTIF_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setNotifTab(tab)}
                      className={`rounded-lg px-2 py-1 text-xs font-bold uppercase ${
                        notifTab === tab ? 'bg-[#007B8A] text-white' : 'text-[#005F6B] hover:bg-[#E0F7FA]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <ul className="max-h-64 overflow-y-auto p-2">
                  {filteredNotifs.length === 0 ? (
                    <li className="p-3 text-sm text-[#005F6B]">No alerts in this category</li>
                  ) : (
                    filteredNotifs.map((n) => (
                      <li key={n.id} className="border-b border-[#B2EBF2]/40 px-2 py-2 last:border-0">
                        <p className="text-sm font-bold text-[#0A2E36]">{n.title}</p>
                        <p className="text-xs text-[#005F6B]">{n.message}</p>
                      </li>
                    ))
                  )}
                </ul>
                <Link
                  href={hospitalHref('notifications')}
                  className="block border-t border-[#B2EBF2] p-3 text-center text-sm font-bold text-[#007B8A] hover:text-[#004D56]"
                  onClick={() => setNotifOpen(false)}
                >
                  View all notifications
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-full border border-[#B2EBF2] bg-[#E0F7FA]/50 px-3 py-2">
          <span
            className={`h-2 w-2 rounded-full ${realtimeConnected ? 'bg-[#00C49F]' : 'bg-slate-300'}`}
            title={realtimeConnected ? 'Live sync' : 'Offline'}
          />
          <UserCircle className="h-5 w-5 text-[#007B8A]" />
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-[#0A2E36]">Admin User</p>
            <p className="text-xs text-[#005F6B]">{settings.hospitalName.split(' ')[0] ?? 'Nexora'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
