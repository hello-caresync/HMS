'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Building2, Mail, Lock, LogIn, CheckCircle2, ShieldCheck } from 'lucide-react';

interface Hospital {
  id: string;
  facility_name: string;
  facility_type: string;
  address: string;
}

const FALLBACK_HOSPITALS: Hospital[] = [
  {
    id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    facility_name: 'CuraSync Multi-Specialty Hospital',
    facility_type: 'hospital',
    address: '120 Ring Road, Indiranagar, Bengaluru',
  },
  {
    id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    facility_name: 'Nextora Express OPD Clinic',
    facility_type: 'clinic',
    address: '88 Koramangala 8th Block, Bengaluru',
  },
];

export default function PatientLoginPageClient() {
  const router = useRouter();

  const [email, setEmail] = useState('aishwarya@gmail.com');
  const [password, setPassword] = useState('password123');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadHospitals() {
      try {
        const { data, error } = await supabase.from('hospitals_and_clinics').select('*');
        if (error || !data || data.length === 0) throw error;
        setHospitals(data);
        setSelectedHospital(data[0]);
      } catch (err) {
        setHospitals(FALLBACK_HOSPITALS);
        setSelectedHospital(FALLBACK_HOSPITALS[0]);
      }
    }
    loadHospitals();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospital) return;

    setLoading(true);

    // Store selected hospital context globally in localStorage
    localStorage.setItem('selected_hospital_id', selectedHospital.id);
    localStorage.setItem('selected_hospital_name', selectedHospital.facility_name);

    setTimeout(() => {
      setLoading(false);
      router.push('/patient/appointments/book');
    }, 600);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7FAF9] p-6 font-sans text-[#1A332F]">
      <div className="w-full max-w-md rounded-3xl border border-[#BDE2F5] bg-white p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3B8C7E] text-[#BDE2F5] shadow-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-[#1A332F]">Welcome Back</h1>
          <p className="mt-1 text-xs font-bold text-[#7BA89E]">Select hospital & sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="mt-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-xs font-black text-[#1A332F] uppercase tracking-wider mb-2">
              <Building2 className="h-4 w-4 text-[#3B8C7E]" /> Select Hospital / Clinic
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {hospitals.map((hospital) => {
                const isSelected = selectedHospital?.id === hospital.id;
                return (
                  <button
                    type="button"
                    key={hospital.id}
                    onClick={() => setSelectedHospital(hospital)}
                    className={`w-full flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                      isSelected
                        ? 'border-[#3B8C7E] bg-[#3B8C7E]/5 ring-2 ring-[#3B8C7E]'
                        : 'border-slate-200 hover:border-[#3B8C7E]'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-black text-[#1A332F]">{hospital.facility_name}</h4>
                      <p className="text-[11px] font-medium text-[#7BA89E]">{hospital.address}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-[#3B8C7E] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-[#1A332F] uppercase tracking-wider">Email Address</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#7BA89E]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-[#DAF0EB] py-3 pl-10 pr-4 text-xs font-bold text-[#1A332F] focus:border-[#3B8C7E] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-[#1A332F] uppercase tracking-wider">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#7BA89E]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-[#DAF0EB] py-3 pl-10 pr-4 text-xs font-bold text-[#1A332F] focus:border-[#3B8C7E] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#3B8C7E] py-3.5 text-xs font-extrabold text-white shadow-lg transition hover:bg-[#1A332F] disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Sign In to Selected Hospital'}
            <LogIn className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}