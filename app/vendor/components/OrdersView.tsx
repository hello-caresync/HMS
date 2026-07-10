'use client';

import React, { useState } from 'react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface PharmacyOrder {
  id: string;
  recipientName: string;
  contact: string;
  items: OrderItem[];
  status: 'Pending Verification' | 'Dispensed' | 'Out for Delivery';
  total: number;
  timestamp: string;
  gpsTrackingUrl?: string;
}

interface OrdersViewProps {
  ordersList: PharmacyOrder[];
  setSelectedOrder: (order: PharmacyOrder) => void;
  setIsUpdateModalOpen: (open: boolean) => void;
}

export default function OrdersView({ ordersList = [], setSelectedOrder, setIsUpdateModalOpen }: OrdersViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // 🛡️ CRASH SAFEGUARDS: Using fallbacks (|| '') ensures toLowerCase() never fires on undefined data
  const filteredOrders = ordersList.filter((order) => {
    if (!order) return false;
    
    const orderId = order.id || '';
    const name = order.recipientName || '';
    const query = searchQuery || '';

    const matchesSearch = 
      orderId.toLowerCase().includes(query.toLowerCase()) ||
      name.toLowerCase().includes(query.toLowerCase());
      
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusStyles = {
    'Pending Verification': 'bg-amber-50 text-amber-700 border-amber-200',
    'Dispensed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Out for Delivery': 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      
      {/* SEARCH DECK */}
      <div className="bg-white border border-[#CBD6D6] rounded-2xl p-4 shadow-3xs flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="w-full sm:w-72">
          <input 
            type="text"
            placeholder="Search by Order ID or Patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-[#F4F7F6] focus:outline-none focus:border-[#4A5D5E] text-slate-800"
          />
        </div>
        <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold bg-white text-slate-900 focus:outline-none focus:border-[#4A5D5E] cursor-pointer"
          >
            <option value="ALL">All Active Pipeline</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Dispensed">Dispensed</option>
            <option value="Out for Delivery">Out for Delivery</option>
          </select>
        </div>
      </div>

      {/* ORDERS DISPLAY PIPELINE */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div 
            key={order.id || Math.random().toString()} 
            className="bg-[#EBF1F1] border border-[#CBD6D6] rounded-2xl p-5 shadow-2xs space-y-4 transition-all hover:shadow-xs"
          >
            <div className="flex justify-between items-start border-b pb-3 border-[#CBD6D6]">
              <div>
                <span className="text-xs font-mono font-black text-slate-900 bg-white border border-[#CBD6D6]/80 px-2 py-0.5 rounded shadow-3xs">
                  {order.id || 'NO ID'}
                </span>
                <h3 className="text-base font-black text-[#2C393A] mt-1.5">{order.recipientName || 'Unknown Recipient'}</h3>
                <p className="text-[10px] text-slate-800 font-bold font-mono mt-0.5">{order.timestamp || 'No Timestamp'} · Contact: {order.contact || 'N/A'}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-md font-black border uppercase tracking-wider ${statusStyles[order.status] || 'bg-slate-100'}`}>
                {order.status || 'Unknown'}
              </span>
            </div>

            <div className="space-y-2">
              {order.items?.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex justify-between items-center text-xs font-bold text-slate-900 bg-white p-3 rounded-xl border border-[#CBD6D6]/50 shadow-3xs"
                >
                  <span className="text-slate-800">
                    {item.name} <strong className="text-[#4A5D5E] ml-1.5 bg-[#EBF1F1] px-2 py-0.5 rounded-md text-[10px]">x{item.quantity || 0}</strong>
                  </span>
                  <span className="font-mono text-slate-900">₹{(item.price || 0).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            {order.gpsTrackingUrl && order.status === 'Out for Delivery' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between sm:items-center text-xs gap-3 animate-fadeIn">
                <div>
                  <strong className="text-emerald-900 block font-black">📡 Live Logistics GPS Dispatch Link Active</strong>
                  <span className="text-emerald-700 font-medium">Tracking vehicle streams active.</span>
                </div>
                <a href={order.gpsTrackingUrl} target="_blank" rel="noreferrer" className="bg-[#4A5D5E] text-white text-[11px] font-black px-4 py-2 rounded-xl text-center shadow-xs">
                  Launch Tracking Map
                </a>
              </div>
            )}

            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-bold text-slate-800">
                Valuation Ledger: <span className="text-slate-950 font-black font-mono text-sm ml-1">₹{(order.total || 0).toLocaleString('en-IN')}</span>
              </span>
              
              {order.status !== 'Out for Delivery' ? (
                <button 
                  onClick={() => { setSelectedOrder(order); setIsUpdateModalOpen(true); }} 
                  className="bg-white text-[#4A5D5E] border border-[#CBD6D6] font-black text-xs px-4 py-2 rounded-xl shadow-2xs hover:bg-slate-50 cursor-pointer transition-all"
                >
                  Advance Fulfillment Phase
                </button>
              ) : (
                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider bg-white px-3 py-1.5 rounded-xl border border-emerald-100 shadow-3xs">
                  ✓ Dispatch Finalized
                </span>
              )}
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl text-slate-800 font-bold uppercase text-xs tracking-wider">
            No pipeline items found matching search filters.
          </div>
        )}
      </div>

    </div>
  );
}