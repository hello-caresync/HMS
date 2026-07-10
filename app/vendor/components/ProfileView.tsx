'use client';
import React, { useState } from 'react';

interface ProfileState {
  firstName: string;
  lastName: string;
  businessName: string;
  businessType: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
}

interface ProfileViewProps {
  profileData: ProfileState;
  onSubmit: (updatedData: ProfileState) => void;
}

export default function ProfileView({ profileData, onSubmit }: ProfileViewProps) {
  const [formData, setFormData] = useState<ProfileState>({ ...profileData });

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-xl mx-auto bg-[#EBF1F1] border border-[#CBD6D6] rounded-2xl p-6 md:p-8 shadow-sm animate-fadeIn">
      <div className="text-center mb-6">
        <h2 className="text-xl font-black text-[#2C393A] tracking-tight">Corporate Vendor Verification</h2>
        <p className="text-xs text-slate-800 font-bold mt-1">Update profile parameters below to synchronize client metrics.</p>
      </div>

      <form onSubmit={handleLocalSubmit} className="space-y-5 text-xs font-bold text-slate-900">
        <div className="space-y-1">
          <label className="block text-slate-800 font-black">Owner Identification Name <span className="text-rose-500">*</span></label>
          <div className="grid grid-cols-2 gap-4 mt-1.5">
            <input type="text" required placeholder="First name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-none focus:border-[#4A5D5E]" />
            <input type="text" required placeholder="Last name" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-none focus:border-[#4A5D5E]" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-slate-800 font-black">Business Entity Title Name <span className="text-rose-500">*</span></label>
          <input type="text" required placeholder="Company name" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-none focus:border-[#4A5D5E]" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-slate-800 font-black">Corporate Taxonomy Classification <span className="text-rose-500">*</span></label>
          <input type="text" required placeholder="Business Type" value={formData.businessType} onChange={e => setFormData({...formData, businessType: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-none focus:border-[#4A5D5E]" />
        </div>

        <div className="space-y-2">
          <label className="block text-slate-800 font-black">Main Headquarters Address <span className="text-rose-500">*</span></label>
          <div className="space-y-3 mt-1.5">
            <input type="text" required placeholder="Street Address" value={formData.streetAddress} onChange={e => setFormData({...formData, streetAddress: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-none focus:border-[#4A5D5E]" />
            <div className="grid grid-cols-3 gap-2">
              <input type="text" required placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-none" />
              <input type="text" required placeholder="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-none" />
              <input type="text" required placeholder="Postal Code" value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-slate-800 font-black">Official Contact Phone Number <span className="text-rose-500">*</span></label>
          <input type="text" required placeholder="Phone Number" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-none focus:border-[#4A5D5E]" />
        </div>

        <button type="submit" className="w-full text-center py-3 bg-[#4A5D5E] text-white font-black rounded-xl uppercase tracking-wide text-xs cursor-pointer hover:opacity-95 transition-all">
          Overwrite Corporate Credentials
        </button>
      </form>
    </div>
  );
}