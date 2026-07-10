'use client';
import React from 'react';

interface SuppliesViewProps {
  historicalSupplies: any[];
}

export default function SuppliesView({ historicalSupplies }: { historicalSupplies: any[] }) {
  return (
    <div className="bg-[#EBF1F1] border border-[#CBD6D6] rounded-2xl p-5 shadow-xs animate-fadeIn">
      <div className="border rounded-xl overflow-hidden bg-white border-[#CBD6D6]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 border-b font-black text-slate-800 uppercase">
              <th className="py-2.5 px-4">Delivery Ref ID</th>
              <th className="py-2.5 px-4">Specification Item Name</th>
              <th className="py-2.5 px-4 text-center">Net Handed Over</th>
            </tr>
          </thead>
          <tbody className="divide-y font-medium text-slate-900">
            {historicalSupplies.map((sup) => (
              <tr key={sup.id}>
                <td className="py-3 px-4 font-mono font-bold text-slate-950">{sup.id}</td>
                <td className="py-3 px-4">
                  <span className="font-black text-slate-900 block">{sup.itemName}</span>
                  <span className="text-[10px] text-slate-800 font-bold block">Received By: {sup.receivedBy}</span>
                </td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 font-mono">+{sup.quantityDelivered.toLocaleString()} units</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}