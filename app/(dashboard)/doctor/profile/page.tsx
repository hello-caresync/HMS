'use client';

import React from 'react';

// Force dynamic rendering so Next.js skips static pre-rendering during build
export const dynamic = 'force-dynamic';

export default function DoctorProfilePage() {
  return (
    <div className="p-6 bg-[#F0F8F9] min-h-screen">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm max-w-2xl">
        <h1 className="text-2xl font-black text-[#004D56]">Doctor Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Manage physician credentials and availability.</p>

        <div className="mt-6 space-y-3 text-xs text-slate-700 font-medium">
          <p><span className="font-extrabold text-[#004D56]">Name:</span> Dr. Aishwarya D S</p>
          <p><span className="font-extrabold text-[#004D56]">Reg No:</span> KMC-88410</p>
          <p><span className="font-extrabold text-[#004D56]">Department:</span> General Medicine</p>
          <p><span className="font-extrabold text-[#004D56]">Room:</span> 302</p>
        </div>
      </div>
    </div>
  );
}