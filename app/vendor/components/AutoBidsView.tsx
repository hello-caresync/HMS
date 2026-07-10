'use client';
import React from 'react';

interface AutoBidsViewProps {
  smartAlerts: any[];
  onBidSubmit: (alertId: string, price: number) => void;
}

export default function AutoBidsView({ smartAlerts, onBidSubmit }: AutoBidsViewProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      {smartAlerts.map((alertItem) => (
        <div key={alertItem.alertId} className="bg-[#EBF1F1] border border-[#CBD6D6] rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
          <div>
            <span className="text-[10px] font-mono font-black uppercase text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">⚡ Low-Stock Signal</span>
            <h3 className="text-base font-black text-[#2C393A] mt-2">{alertItem.hospitalName}</h3>
            <p className="text-xs text-slate-800 font-bold mt-0.5">Deficit Target: <span className="text-[#4A5D5E]">{alertItem.itemNeeded}</span></p>
          </div>
          <div className="flex justify-between items-center text-xs font-bold text-slate-800 pt-2 border-t border-[#CBD6D6]">
            <div>Deficit: <span className="text-slate-900 font-black">{alertItem.estimatedDeficit} units</span></div>
            {!alertItem.fillSubmitted ? (
              <button onClick={() => onBidSubmit(alertItem.alertId, 3.25)} className="bg-[#4A5D5E] text-white text-[11px] font-black px-4 py-2 rounded-xl shadow-xs cursor-pointer">Transmit Quote (1-Click)</button>
            ) : (
              <span className="text-emerald-700 font-black bg-white border border-emerald-200 px-3 py-1 rounded text-[11px] uppercase tracking-wider">✓ Transmitted</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}