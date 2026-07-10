'use client';
import React from 'react';

interface MenuGridProps {
  setActiveTab: (id: string) => void;
  revenue: number;
  activeAlerts: number;
  pendingOrdersCount: number;
}

export default function MenuGrid({ setActiveTab, revenue, activeAlerts, pendingOrdersCount }: MenuGridProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full animate-fadeIn">
      <div className="w-full lg:w-[72%] space-y-4">
        <div className="flex justify-between items-center mb-1">
          <div>
            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wide font-mono">Command Modules</span>
            <h3 className="text-lg font-black text-slate-800">Vendor Operations Grid</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => setActiveTab('OverviewDashboard')} className="bg-[#EBF1F1] border border-[#CBD6D6] rounded-2xl p-5 flex flex-col items-start justify-between text-left shadow-2xs hover:shadow-md hover:border-[#4A5D5E] transition-all h-36 relative cursor-pointer">
            <span className="absolute top-4 right-4 bg-white border border-[#CBD6D6] text-[#4A5D5E] font-black text-[10px] px-2 py-0.5 rounded-md">₹{revenue.toLocaleString('en-IN')} NET</span>
            <div className="w-10 h-10 rounded-full bg-white text-[#4A5D5E] border border-[#CBD6D6] flex items-center justify-center text-sm">📊</div>
            <div className="mt-3">
              <h4 className="text-sm font-black text-[#2C393A]">Transaction Dashboard</h4>
              <p className="text-[11px] text-[#5A6E70] font-semibold mt-0.5">Revenue streams, volume mix, and partner KPIs</p>
            </div>
          </button>

          <button onClick={() => setActiveTab('POs')} className="bg-[#EBF1F1] border border-[#CBD6D6] rounded-2xl p-5 flex flex-col items-start justify-between text-left shadow-2xs hover:shadow-md hover:border-[#4A5D5E] transition-all h-36 relative cursor-pointer">
            <span className="absolute top-4 right-4 bg-white border border-[#CBD6D6] text-[#4A5D5E] font-black text-[10px] px-2 py-0.5 rounded-md">ACTIVE</span>
            <div className="w-10 h-10 rounded-full bg-white text-[#4A5D5E] border border-[#CBD6D6] flex items-center justify-center text-sm">📋</div>
            <div className="mt-3">
              <h4 className="text-sm font-black text-[#2C393A]">PO Visibility</h4>
              <p className="text-[11px] text-[#5A6E70] font-semibold mt-0.5">Hospital bulk purchase orders and lanes</p>
            </div>
          </button>

          <button onClick={() => setActiveTab('Orders')} className="bg-[#EBF1F1] border border-[#CBD6D6] rounded-2xl p-5 flex flex-col items-start justify-between text-left shadow-2xs hover:shadow-md hover:border-[#4A5D5E] transition-all h-36 relative cursor-pointer">
            <span className="absolute top-4 right-4 bg-white border border-[#CBD6D6] text-[#4A5D5E] font-black text-[10px] px-2 py-0.5 rounded-md">{pendingOrdersCount} PENDING</span>
            <div className="w-10 h-10 rounded-full bg-white text-[#4A5D5E] border border-[#CBD6D6] flex items-center justify-center text-sm">📄</div>
            <div className="mt-3">
              <h4 className="text-sm font-black text-[#2C393A]">Invoice Status</h4>
              <p className="text-[11px] text-[#5A6E70] font-semibold mt-0.5">Prescription orders awaiting verification or dispatch</p>
            </div>
          </button>

          <button onClick={() => setActiveTab('BillingLedger')} className="bg-[#EBF1F1] border border-[#CBD6D6] rounded-2xl p-5 flex flex-col items-start justify-between text-left shadow-2xs hover:shadow-md hover:border-[#4A5D5E] transition-all h-36 relative cursor-pointer">
            <span className="absolute top-4 right-4 bg-white border border-[#CBD6D6] text-[#4A5D5E] font-black text-[10px] px-2 py-0.5 rounded-md">TAX MATRIX</span>
            <div className="w-10 h-10 rounded-full bg-white text-[#4A5D5E] border border-[#CBD6D6] flex items-center justify-center text-sm">💸</div>
            <div className="mt-3">
              <h4 className="text-sm font-black text-[#2C393A]">Payment Status & Tax</h4>
              <p className="text-[11px] text-[#5A6E70] font-semibold mt-0.5">CGST/SGST ledgers and disbursement clearance</p>
            </div>
          </button>

          <button onClick={() => setActiveTab('AutoBids')} className="bg-[#EBF1F1] border border-[#CBD6D6] rounded-2xl p-5 flex flex-col items-start justify-between text-left shadow-2xs hover:shadow-md hover:border-[#4A5D5E] transition-all h-36 relative cursor-pointer">
            <span className="absolute top-4 right-4 bg-white border border-[#CBD6D6] text-rose-600 font-black text-[10px] px-2 py-0.5 rounded-md">{activeAlerts} ACTIVE ALERTS</span>
            <div className="w-10 h-10 rounded-full bg-white text-[#4A5D5E] border border-[#CBD6D6] flex items-center justify-center text-sm">🚨</div>
            <div className="mt-3">
              <h4 className="text-sm font-black text-[#2C393A]">Smart Alerts Auto-Bidding</h4>
              <p className="text-[11px] text-[#5A6E70] font-semibold mt-0.5">Auto-bidding on critical hospital deficits</p>
            </div>
          </button>

          <button onClick={() => setActiveTab('FulfillmentLog')} className="bg-[#EBF1F1] border border-[#CBD6D6] rounded-2xl p-5 flex flex-col items-start justify-between text-left shadow-2xs hover:shadow-md hover:border-[#4A5D5E] transition-all h-36 relative cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-white text-[#4A5D5E] border border-[#CBD6D6] flex items-center justify-center text-sm">🚚</div>
            <div className="mt-3">
              <h4 className="text-sm font-black text-[#2C393A]">My Supplies & Analysis</h4>
              <p className="text-[11px] text-[#5A6E70] font-semibold mt-0.5">Delivered inventory historical throughput logs</p>
            </div>
          </button>
        </div>
      </div>

      <div className="w-full lg:w-[28%] space-y-5 shrink-0">
        <div className="bg-[#EBF1F1] border border-[#CBD6D6] rounded-2xl p-5 shadow-2xs space-y-4">
          <div>
            <span className="text-[9px] font-bold text-[#4A5D5E] font-mono uppercase tracking-wider block">Live Operations</span>
            <h4 className="text-base font-black text-slate-800 mt-0.5">Executive Snapshot</h4>
          </div>
          <div className="bg-white rounded-xl border border-[#CBD6D6] p-4 text-left">
            <span className="text-[10px] font-bold text-slate-800 font-mono uppercase block">Net Account Balance</span>
            <span className="text-2xl font-black text-[#4A5D5E] mt-1 block">₹{revenue.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}