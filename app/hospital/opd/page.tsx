'use client';

import { useState, useEffect } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Search, Stethoscope, ChevronDown, User, Calendar, Clock, Plus, Check } from 'lucide-react';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  return createSupabaseClient(url, key);
}

export interface DoctorOption {
  id: string;
  full_name: string;
  department: string;
  specialization?: string;
  consultation_fee: number;
  room_no?: string;
  is_active?: boolean;
}

export default function OPDReceptionPage() {
  const supabase = getSupabaseClient();

  // Doctor Search & Selection States
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);

  // Fetch doctors from Supabase
  useEffect(() => {
    async function fetchDoctors() {
      setLoadingDoctors(true);
      try {
        const { data, error } = await supabase
          .from('doctors')
          .select('id, full_name, department, specialization, consultation_fee, room_no, is_active')
          .order('full_name', { ascending: true });

        if (error) console.warn('Supabase fetch notice:', error.message);

        if (data && data.length > 0) {
          setDoctors(data);
        } else {
          // Default fallback list
          setDoctors([
            { id: '1', full_name: 'Dr. Aishwarya D S', department: 'Internal Medicine', specialization: 'General Physician', consultation_fee: 800, room_no: 'Room 2' },
            { id: '2', full_name: 'Dr. Rajesh Kumar', department: 'Cardiology', specialization: 'Interventional', consultation_fee: 1200, room_no: 'Room 4' },
            { id: '3', full_name: 'Dr. Meera Iyer', department: 'Orthopedic Surgery', specialization: 'Trauma', consultation_fee: 1000, room_no: 'Room 6' },
          ]);
        }
      } catch (err: any) {
        console.warn('Using default doctor list:', err?.message || err);
      } finally {
        setLoadingDoctors(false);
      }
    }

    fetchDoctors();
  }, [supabase]);

  // Filter doctors based on input
  const filteredDoctors = doctors.filter(
    (doc) =>
      doc.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.specialization && doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Generate Initials (e.g., "Dr. Aishwarya D S" -> "AD")
  const getInitials = (name: string) => {
    const cleanName = name.replace(/^Dr\.\s*/i, '').trim();
    const parts = cleanName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return cleanName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#007B8A]">OPD Operations</span>
          <h1 className="text-2xl font-black text-[#004D56] mt-0.5">Outpatient Reception & Queue Management</h1>
        </div>
        
        {selectedDoctor && (
          <div className="flex items-center gap-3 bg-[#F0F8F9] px-4 py-2.5 rounded-2xl border border-[#007B8A]/20">
            <div className="w-8 h-8 rounded-full bg-[#3D2638] text-white flex items-center justify-center font-bold text-xs">
              {getInitials(selectedDoctor.full_name)}
            </div>
            <div>
              <p className="text-xs font-bold text-[#004D56]">{selectedDoctor.full_name}</p>
              <p className="text-[10px] text-slate-500 font-medium">{selectedDoctor.department} • {selectedDoctor.room_no || 'OPD'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Search & Booking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Doctor Search Dropdown Section */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
            SEARCH DOCTORS
          </label>

          <div className="relative">
            {/* Input Trigger Field */}
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm cursor-pointer hover:border-[#007B8A] transition-all"
            >
              <Stethoscope className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search by name, specialty, or department..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </div>

            {/* Dropdown Card */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl border border-slate-100 shadow-2xl z-50 max-h-72 overflow-y-auto p-2 space-y-1">
                {loadingDoctors ? (
                  <div className="p-4 text-center text-xs font-semibold text-slate-400">Loading active doctors...</div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="p-4 text-center text-xs font-semibold text-slate-400">No doctors found</div>
                ) : (
                  filteredDoctors.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setSelectedDoctor(doc);
                        setSearchTerm(doc.full_name);
                        setIsDropdownOpen(false);
                      }}
                      className={`flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer transition-all ${
                        selectedDoctor?.id === doc.id ? 'bg-[#F0F8F9] border border-[#007B8A]/30' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Dark Avatar Badge */}
                      <div className="w-10 h-10 rounded-full bg-[#3D2638] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        {getInitials(doc.full_name)}
                      </div>

                      {/* Doctor Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-xs text-slate-900 truncate">{doc.full_name}</h4>
                        <p className="text-[11px] text-slate-500 font-medium truncate">
                          {doc.department} {doc.specialization ? `· ${doc.specialization}` : ''}
                        </p>
                        <p className="text-[11px] font-bold text-slate-700 mt-0.5">
                          ₹{doc.consultation_fee} · {doc.room_no || 'OPD Desk'}
                        </p>
                      </div>

                      {selectedDoctor?.id === doc.id && (
                        <Check className="w-4 h-4 text-[#007B8A] shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Doctor Summary Panel */}
          {selectedDoctor && (
            <div className="p-4 bg-[#F0F8F9] rounded-2xl border border-[#007B8A]/20 space-y-2">
              <span className="text-[10px] font-bold text-[#007B8A] uppercase tracking-wider block">Selected Physician</span>
              <h3 className="font-extrabold text-sm text-[#004D56]">{selectedDoctor.full_name}</h3>
              <div className="text-xs text-slate-600 font-medium space-y-1">
                <p>Department: <span className="font-bold text-slate-900">{selectedDoctor.department}</span></p>
                <p>Consultation Fee: <span className="font-bold text-emerald-700">₹{selectedDoctor.consultation_fee}</span></p>
                <p>Assigned Location: <span className="font-bold text-slate-900">{selectedDoctor.room_no || 'Room 1'}</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: OPD Queue & Token Registration Panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#004D56]">Patient Registration & Token Issuance</h3>
            <span className="text-xs font-extrabold text-[#007B8A] bg-[#F0F8F9] px-3 py-1 rounded-full">Active Desk</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Patient Full Name"
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#007B8A]"
            />
            <input
              type="tel"
              placeholder="Mobile Number"
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#007B8A]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#007B8A]">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="number"
              placeholder="Age"
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#007B8A]"
            />
          </div>

          <button
            type="button"
            className="w-full py-3 bg-[#007B8A] hover:bg-[#004D56] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> ISSUE OPD TOKEN
          </button>
        </div>

      </div>
    </div>
  );
}