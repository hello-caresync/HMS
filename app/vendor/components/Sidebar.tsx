'use client';
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const links = [
    { name: 'Home Command Menu', id: 'Menu' },
    { name: 'Transaction Dashboard', id: 'OverviewDashboard' },
    { name: 'Incoming Orders Pipeline', id: 'Orders' },
    { name: 'Hospital PO Visibility', id: 'POs' },
    { name: 'Invoice & Payment Ledger', id: 'BillingLedger' },
    { name: 'Smart Alerts (Bidding)', id: 'AutoBids' },
    { name: 'My Supplies Analysis', id: 'FulfillmentLog' },
    { name: 'Suggestions & Complaints', id: 'ComplaintsHub' },
    { name: 'Vendor Profile', id: 'Profile' }
  ];

  return (
    <aside className="hidden md:flex w-64 bg-[#4A5D5E] border-r border-slate-200 flex flex-col shrink-0 h-full z-50 shadow-md">
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-white text-sm">CS</div>
        <h2 className="text-base font-black tracking-tight text-white leading-none">CuraSync</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
        {links.map((link) => (
          <button
            key={link.id}
            onClick={() => setActiveTab(link.id)}
            className={`w-full flex items-center px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-left ${
              activeTab === link.id ? 'bg-white text-[#4A5D5E] shadow-sm' : 'text-slate-100 hover:bg-white/10'
            }`}
          >
            {link.name}
          </button>
        ))}
      </nav>
    </aside>
  );
}