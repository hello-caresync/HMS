"use client";
import React, { useState } from 'react';
import { Search, Pill, CheckCircle2, AlertCircle, ShoppingCart, RefreshCw, ClipboardList } from 'lucide-react';

export default function PharmacyDeskPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Sandbox data with deep text weights and maximum contrast styles
  const mockPrescriptions = [
    { id: "RX-9081", initials: "A.K.", item: "Paracetamol 650mg", batch: "B-PR26", qty: "10 Tabs", status: "Awaiting Dispensation" },
    { id: "RX-9082", initials: "S.M.", item: "Amoxicillin 500mg", batch: "B-AM25", qty: "15 Caps", status: "Dispensed" },
    { id: "RX-9083", initials: "P.N.", item: "Metformin 500mg", batch: "B-MT26", qty: "30 Tabs", status: "Awaiting Dispensation" }
  ];

  const filteredPrescriptions = mockPrescriptions.filter(rx =>
    rx.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rx.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-900 bg-slate-50 min-h-screen font-sans selection:bg-slate-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Pharmacy Fulfillment Desk</h1>
          <p className="text-sm text-slate-700 font-medium">Verify electronic medical prescriptions, check stock batches, and issue drug orders.</p>
        </div>
        <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
          Sandbox Mode Active
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Pending Refills</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">12 Orders</h3>
          </div>
          <div className="bg-slate-100 p-2.5 rounded-lg text-slate-900 border border-slate-200"><ShoppingCart size={18} /></div>
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Narcotics Log</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">Locked</h3>
          </div>
          <div className="bg-slate-100 p-2.5 rounded-lg text-slate-900 border border-slate-200"><AlertCircle size={18} /></div>
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Dispensed Today</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">148 Prescriptions</h3>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-800 border border-emerald-200"><CheckCircle2 size={18} /></div>
        </div>
      </div>

      {/* Main Framework Grid Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Roster View */}
        <div className="lg:col-span-2 bg-white rounded-xl border-2 border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Live Prescription Worklist</h3>
          
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-800" size={16} />
            <input 
              type="text" 
              placeholder="Search active drug formulas or order token keys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-slate-400"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-100 text-slate-900 font-black tracking-wider uppercase">
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Initials</th>
                  <th className="p-3">Prescribed Item</th>
                  <th className="p-3">Batch String</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3 text-right">Status State</th>
                </tr>
              </thead>
              <tbody className="font-bold">
                {filteredPrescriptions.map((rx, idx) => (
                  <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono text-slate-900 font-black">{rx.id}</td>
                    <td className="p-3 text-slate-900 font-black">{rx.initials}</td>
                    <td className="p-3 text-slate-900 font-extrabold">{rx.item}</td>
                    <td className="p-3 text-slate-800 font-mono font-medium">{rx.batch}</td>
                    <td className="p-3 text-slate-900">{rx.qty}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                        rx.status === 'Dispensed' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {rx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Interactive Simulator form */}
        <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Dispense Validation Gate</h3>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-3 text-xs font-bold text-slate-800">
            <div className="space-y-1">
              <label className="block text-slate-900">Pharmacist Token ID</label>
              <input type="text" defaultValue="PHAR-CORE-04" className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg p-2.5 text-slate-900 font-semibold focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-900">Regulatory Verification Card</label>
              <input type="text" disabled value="[PHARMACY REGULATION DATA SECURED FOR SANDBOX]" className="w-full bg-slate-100 border-2 border-slate-200 rounded-lg p-2.5 text-slate-700 font-mono text-[10px] select-none cursor-not-allowed" />
            </div>
            <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black p-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm text-xs">
              <Pill size={14} />
              Confirm Dispensation Packet
            </button>
          </form>

          <div className="pt-4 border-t-2 border-slate-100 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">Fulfillment Audit Summary</span>
            <div className="space-y-1.5 text-xs text-slate-900 font-bold">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <ClipboardList size={14} className="text-slate-900" />
                <span>Text Contrast Validation: Forced</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}