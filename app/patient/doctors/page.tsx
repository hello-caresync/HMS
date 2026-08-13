'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Search, Calendar, RotateCw, Building2, Star, Award, Loader2 } from 'lucide-react';

interface DoctorProfile {
  id: string;
  doctor_name: string;
  department: string;
  hospital_name: string;
  experience: string;
  rating: string;
  fee: string;
}

export default function DoctorsDirectoryPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fallback41Doctors: DoctorProfile[] = [
    { id: 'RH-D01', doctor_name: 'Dr. Suriraju V', department: 'Urology', hospital_name: 'Regal Hospital', experience: '14+ Years Experience', rating: '4.9 ★', fee: '₹700' },
    { id: 'RH-D02', doctor_name: 'Dr. Chandrakanth S. Kesari', department: 'General Surgery', hospital_name: 'Regal Hospital', experience: '12+ Years Experience', rating: '4.8 ★', fee: '₹800' },
    { id: 'RH-D03', doctor_name: 'Dr. Ananya R', department: 'General Medicine', hospital_name: 'Regal Hospital', experience: '9+ Years Experience', rating: '4.7 ★', fee: '₹600' },
    { id: 'RH-D04', doctor_name: 'Dr. Vikramaditya Rao', department: 'Cardiology', hospital_name: 'Regal Hospital', experience: '15+ Years Experience', rating: '4.9 ★', fee: '₹900' },
    { id: 'RH-D05', doctor_name: 'Dr. Meera Nambiar', department: 'Cardiology', hospital_name: 'Regal Hospital', experience: '10+ Years Experience', rating: '4.8 ★', fee: '₹850' },
    { id: 'RH-D06', doctor_name: 'Dr. Rajesh Kumar Hegde', department: 'Orthopedics', hospital_name: 'Regal Hospital', experience: '16+ Years Experience', rating: '4.9 ★', fee: '₹850' },
    { id: 'RH-D07', doctor_name: 'Dr. Shalini Deshmukh', department: 'Orthopedics', hospital_name: 'Regal Hospital', experience: '11+ Years Experience', rating: '4.7 ★', fee: '₹750' },
    { id: 'RH-D08', doctor_name: 'Dr. Arvind Swamy', department: 'Neurology', hospital_name: 'Regal Hospital', experience: '13+ Years Experience', rating: '4.9 ★', fee: '₹950' },
    { id: 'RH-D09', doctor_name: 'Dr. Kavitha Reddy', department: 'Neurosurgery', hospital_name: 'Regal Hospital', experience: '18+ Years Experience', rating: '5.0 ★', fee: '₹1200' },
    { id: 'RH-D10', doctor_name: 'Dr. Pradeep Verma', department: 'Gastroenterology', hospital_name: 'Regal Hospital', experience: '12+ Years Experience', rating: '4.8 ★', fee: '₹800' },
  ];

  useEffect(() => {
    fetchDoctorsFromDB();
  }, []);

  const fetchDoctorsFromDB = async () => {
    setLoading(true);
    let list: DoctorProfile[] = [];
    try {
      const { data, error } = await supabase.from('doctors').select('*');
      if (!error && data && data.length > 0) list = data;
    } catch (err) {
      console.warn('Fallback loading');
    } finally {
      if (list.length === 0) list = fallback41Doctors;
      setDoctors(list);
      setLoading(false);
    }
  };

  const handleBookSlot = (doc: DoctorProfile) => {
    const params = new URLSearchParams({
      doctor: doc.doctor_name,
      department: doc.department,
      fee: doc.fee,
    });
    router.push(`/patient/appointments/book?${params.toString()}`);
  };

  const filteredDoctors = doctors.filter(
    (doc) =>
      doc.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans text-[#0E2924]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#D5E8E3] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#0E2924]">Clinician & Doctor Directory</h1>
          <p className="text-xs font-bold text-[#227B6B]">Select a consultant to book an OPD slot directly.</p>
        </div>
        <button onClick={fetchDoctorsFromDB} className="flex items-center gap-2 rounded-2xl border border-[#D5E8E3] bg-white px-5 py-3 text-xs font-black text-[#113831]">
          <RotateCw className="h-4 w-4 text-[#227B6B]" /> Refresh Directory
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#227B6B]" />
        <input
          type="text"
          placeholder="Search doctor or specialty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-[#D5E8E3] bg-white py-3.5 pl-10 pr-4 text-xs font-bold text-[#0E2924] focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center font-bold text-xs"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDoctors.map((doc) => (
            <div key={doc.id} className="rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#EAF5F2] pb-2">
                  <span className="rounded-full bg-[#EAF5F2] px-3 py-1 text-[10px] font-black text-[#113831] uppercase">{doc.department}</span>
                  <span className="flex items-center gap-1 text-xs font-black text-amber-700"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {doc.rating}</span>
                </div>
                <h3 className="text-base font-black text-[#0E2924]">{doc.doctor_name}</h3>
                <p className="text-xs font-bold text-[#227B6B] flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {doc.hospital_name}</p>
                <p className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Award className="h-3.5 w-3.5 text-[#227B6B]" /> {doc.experience}</p>
              </div>
              <div className="flex items-center justify-between border-t border-[#EAF5F2] pt-4 text-xs font-bold">
                <div>
                  <span className="text-[10px] uppercase text-[#227B6B] block">Fee</span>
                  <span className="text-base font-black">{doc.fee}</span>
                </div>
                <button onClick={() => handleBookSlot(doc)} className="flex items-center gap-2 rounded-2xl bg-[#113831] px-5 py-3 text-xs font-black text-white hover:bg-[#227B6B] transition">
                  <Calendar className="h-4 w-4 text-[#A6E2D8]" /> Book Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}