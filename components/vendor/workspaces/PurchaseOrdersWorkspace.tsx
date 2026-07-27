'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_VENDOR_ID } from '@/lib/vendor-supabase/constants';
import { Check, CheckCheck, RefreshCw, X } from 'lucide-react';

interface PurchaseOrder {
  id: string;
  po_number: string;
  hospital_name: string;
  total_amount: number;
  status: 'ISSUED' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  created_at?: string;
}

export default function PurchaseOrdersWorkspace() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('vendor_id', DEFAULT_VENDOR_ID)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching POs:', error.message);
    } else if (data) {
      setOrders(data as PurchaseOrder[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 2. Individual Accept / Reject Action Handler
  const handleUpdateStatus = async (id: string, newStatus: 'ACCEPTED' | 'REJECTED') => {
    setUpdating(true);
    const { error } = await supabase
      .from('purchase_orders')
      .update({ status: newStatus })
      .eq('id', id)
      .eq('vendor_id', DEFAULT_VENDOR_ID);

    if (error) {
      alert(`Error updating order: ${error.message}`);
    } else {
      setOrders((prev) =>
        prev.map((po) => (po.id === id ? { ...po, status: newStatus } : po))
      );
    }
    setUpdating(false);
  };

  // 3. Bulk Acceptance Handler for Checked Items
  const handleBulkAccept = async () => {
    if (selectedIds.length === 0) {
      return alert('Please select at least one purchase order using the checkboxes.');
    }

    setUpdating(true);
    const { error } = await supabase
      .from('purchase_orders')
      .update({ status: 'ACCEPTED' })
      .in('id', selectedIds)
      .eq('vendor_id', DEFAULT_VENDOR_ID);

    if (error) {
      alert(`Bulk accept failed: ${error.message}`);
    } else {
      alert(`Successfully accepted ${selectedIds.length} order(s)!`);
      setOrders((prev) =>
        prev.map((po) =>
          selectedIds.includes(po.id) ? { ...po, status: 'ACCEPTED' } : po
        )
      );
      setSelectedIds([]);
    }
    setUpdating(false);
  };

  // Checkbox Selection Logic
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 4. Tab Filtering Logic
  const filteredOrders = orders.filter((po) => {
    if (activeTab === 'New / Issued') return po.status === 'ISSUED';
    if (activeTab === 'Accepted') return po.status === 'ACCEPTED';
    if (activeTab === 'Rejected') return po.status === 'REJECTED';
    if (activeTab === 'Completed') return po.status === 'COMPLETED';
    return true; // 'All'
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Bulk Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2B2B2B]">Purchase Orders</h1>
          <p className="text-xs text-[#2B2B2B]/70">
            Hospital PO feed · line items · lifecycle timeline · accept, reject, and bulk workflows.
          </p>
        </div>

        <button
          onClick={handleBulkAccept}
          disabled={updating || selectedIds.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FFB703] hover:bg-[#F77F00] text-gray-900 font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
        >
          <CheckCheck className="w-4 h-4" />
          Bulk accept selected {selectedIds.length > 0 && `(${selectedIds.length})`}
        </button>
      </div>

      {/* Filter Tabs & Refresh */}
      <div className="flex items-center justify-between border-b border-[#F4A261]/20 pb-2">
        <div className="flex gap-2">
          {['All', 'New / Issued', 'Accepted', 'Rejected', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-[#FFB703] text-gray-900 shadow-sm'
                  : 'bg-[#FFF7E8] text-gray-600 hover:bg-[#F4A261]/20'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          onClick={fetchOrders}
          className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Data Table */}
      <div className="w-full overflow-hidden rounded-xl border border-[#F4A261]/20 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#F4A261]/20 bg-[#FFF7E8] text-[11px] font-bold uppercase tracking-wider text-[#2B2B2B]/70">
                <th className="px-4 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredOrders.length > 0 &&
                      selectedIds.length === filteredOrders.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded text-[#FFB703] focus:ring-[#FFB703]"
                  />
                </th>
                <th className="px-4 py-3">PO</th>
                <th className="px-4 py-3">Hospital</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4A261]/10 text-[#2B2B2B]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-500">
                    Loading Purchase Orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-500">
                    No purchase orders found matching '{activeTab}'.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-[#FFF7E8]/50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(po.id)}
                        onChange={() => toggleSelectOne(po.id)}
                        className="rounded text-[#FFB703] focus:ring-[#FFB703]"
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {po.po_number}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {po.hospital_name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          po.status === 'ISSUED'
                            ? 'bg-amber-100 text-amber-800'
                            : po.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : po.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-xs">
                      ₹{po.total_amount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {po.status === 'ISSUED' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdateStatus(po.id, 'ACCEPTED')}
                            disabled={updating}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded"
                          >
                            <Check className="w-3 h-3" /> Accept
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(po.id, 'REJECTED')}
                            disabled={updating}
                            className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No pending action</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export { PurchaseOrdersWorkspace };