'use client';
import React from 'react';

interface PurchaseOrdersViewProps {
  purchaseOrdersList: any[];
}

export default function PurchaseOrdersView({ purchaseOrdersList }: PurchaseOrdersViewProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      {purchaseOrdersList.map((po) => (
        <div key={po.poNumber} className="bg-[#EBF1F1] border border-[#CBD6D6] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="border-b pb-3 flex justify-between items-center border-[#CBD6D6]">
            <div>
              <span className="text-xs font-mono font-bold bg-[#4A5D5E] text-white px-2 py-0.5 rounded">{po.poNumber}</span>
              <h3 className="text-base font-black text-[#2C393A] mt-1">{po.requestingHospital}</h3>
              <p className="text-[11px] text-slate-800 font-bold mt-0.5">Issued: {po.issueDate}</p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">{po.status}</span>
          </div>
          <p className="text-xs text-slate-800 font-bold">📍 Destination: <span className="text-slate-900 font-medium">{po.deliveryAddress}</span></p>
        </div>
      ))}
    </div>
  );
}