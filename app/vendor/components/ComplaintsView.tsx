'use client';
import React from 'react';

interface ComplaintsViewProps {
  supportTickets: any[];
  ticketForm: any;
  setTicketForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ComplaintsView({ supportTickets, ticketForm, setTicketForm, onSubmit }: ComplaintsViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fadeIn w-full">
      <div className="bg-[#EBF1F1] border border-[#CBD6D6] rounded-2xl p-5 shadow-xs space-y-4 lg:col-span-1">
        <h3 className="text-base font-black text-[#2C393A] border-b pb-2 border-[#CBD6D6]">Log New B2B Ticket</h3>
        <form onSubmit={onSubmit} className="space-y-3 text-xs font-bold text-slate-900">
          <div className="flex flex-col gap-1">
            <label>Classification Category</label>
            <select value={ticketForm.category} onChange={e => setTicketForm({...ticketForm, category: e.target.value})} className="rounded-xl border p-2.5 bg-white focus:outline-none focus:border-[#4A5D5E]">
              <option value="Billing Deficit">Billing Deficit</option>
              <option value="Logistics Delay">Logistics Delay</option>
              <option value="Stock Discrepancy">Stock Discrepancy</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label>Subject Summary</label>
            <input type="text" required placeholder="Brief title heading" value={ticketForm.subject} onChange={e => setTicketForm({...ticketForm, subject: e.target.value})} className="rounded-xl border p-2.5 bg-white focus:outline-none text-black" />
          </div>
          <div className="flex flex-col gap-1">
            <label>Issue Description</label>
            <textarea required placeholder="Elaborate details for review..." rows={4} value={ticketForm.message} onChange={e => setTicketForm({...ticketForm, message: e.target.value})} className="rounded-xl border p-2.5 bg-white focus:outline-none resize-none text-black" />
          </div>
          <button type="submit" className="w-full text-center py-2.5 bg-[#4A5D5E] text-white font-black rounded-xl cursor-pointer">Transmit Ticket</button>
        </form>
      </div>

      <div className="lg:col-span-2 space-y-3">
        {supportTickets.map((t, i) => (
          <div key={i} className="bg-[#EBF1F1] border border-[#CBD6D6] rounded-xl p-4 shadow-2xs space-y-2">
            <div className="flex justify-between items-center border-b pb-2 border-[#CBD6D6]/60">
              <div>
                <span className="text-[10px] font-mono font-bold bg-white border p-1 rounded text-stone-500">{t.ticketId}</span>
                <strong className="text-xs font-black text-[#2C393A] ml-2">{t.subject}</strong>
              </div>
              <span className="text-[10px] font-black uppercase text-amber-700 bg-white border border-amber-200 px-2 py-0.5 rounded">{t.status}</span>
            </div>
            <p className="text-xs font-medium text-slate-800 bg-white/60 p-2.5 rounded-lg border border-dashed">"{t.message}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}