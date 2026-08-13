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

const ALL_41_DOCTORS: DoctorProfile[] = [
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
  { id: 'RH-D11', doctor_name: 'Dr. Sunitha Gopal', department: 'Gastroenterology', hospital_name: 'Regal Hospital', experience: '10+ Years Experience', rating: '4.7 ★', fee: '₹750' },
  { id: 'RH-D12', doctor_name: 'Dr. Anand Kulkarni', department: 'Nephrology', hospital_name: 'Regal Hospital', experience: '14+ Years Experience', rating: '4.9 ★', fee: '₹850' },
  { id: 'RH-D13', doctor_name: 'Dr. Archana Bhat', department: 'Pediatrics', hospital_name: 'Regal Hospital', experience: '8+ Years Experience', rating: '4.8 ★', fee: '₹650' },
  { id: 'RH-D14', doctor_name: 'Dr. Rohan D\'Souza', department: 'Pediatrics', hospital_name: 'Regal Hospital', experience: '9+ Years Experience', rating: '4.7 ★', fee: '₹650' },
  { id: 'RH-D15', doctor_name: 'Dr. Deepa Shankar', department: 'Obstetrics & Gynecology', hospital_name: 'Regal Hospital', experience: '15+ Years Experience', rating: '4.9 ★', fee: '₹800' },
  { id: 'RH-D16', doctor_name: 'Dr. Priyanka Murthy', department: 'Obstetrics & Gynecology', hospital_name: 'Regal Hospital', experience: '11+ Years Experience', rating: '4.8 ★', fee: '₹750' },
  { id: 'RH-D17', doctor_name: 'Dr. Harish Prasad', department: 'Pulmonology', hospital_name: 'Regal Hospital', experience: '12+ Years Experience', rating: '4.8 ★', fee: '₹700' },
  { id: 'RH-D18', doctor_name: 'Dr. Nandini Sen', department: 'Dermatology', hospital_name: 'Regal Hospital', experience: '9+ Years Experience', rating: '4.7 ★', fee: '₹600' },
  { id: 'RH-D19', doctor_name: 'Dr. Karthik Subramanian', department: 'ENT', hospital_name: 'Regal Hospital', experience: '10+ Years Experience', rating: '4.8 ★', fee: '₹650' },
  { id: 'RH-D20', doctor_name: 'Dr. Smita Joshi', department: 'Ophthalmology', hospital_name: 'Regal Hospital', experience: '13+ Years Experience', rating: '4.9 ★', fee: '₹700' },
  { id: 'RH-D21', doctor_name: 'Dr. Manoj Kumar', department: 'Ophthalmology', hospital_name: 'Regal Hospital', experience: '11+ Years Experience', rating: '4.7 ★', fee: '₹700' },
  { id: 'RH-D22', doctor_name: 'Dr. Sangeetha Iyengar', department: 'Endocrinology', hospital_name: 'Regal Hospital', experience: '14+ Years Experience', rating: '4.9 ★', fee: '₹800' },
  { id: 'RH-D23', doctor_name: 'Dr. Rakesh Nair', department: 'Oncology', hospital_name: 'Regal Hospital', experience: '16+ Years Experience', rating: '4.9 ★', fee: '₹1000' },
  { id: 'RH-D24', doctor_name: 'Dr. Gautham Pai', department: 'Oncology', hospital_name: 'Regal Hospital', experience: '15+ Years Experience', rating: '4.8 ★', fee: '₹1000' },
  { id: 'RH-D25', doctor_name: 'Dr. Vani S. Rao', department: 'Psychiatry', hospital_name: 'Regal Hospital', experience: '10+ Years Experience', rating: '4.8 ★', fee: '₹750' },
  { id: 'RH-D26', doctor_name: 'Dr. Ashok Patel', department: 'Rheumatology', hospital_name: 'Regal Hospital', experience: '12+ Years Experience', rating: '4.8 ★', fee: '₹800' },
  { id: 'RH-D27', doctor_name: 'Dr. Varun Sundaram', department: 'Vascular Surgery', hospital_name: 'Regal Hospital', experience: '13+ Years Experience', rating: '4.9 ★', fee: '₹900' },
  { id: 'RH-D28', doctor_name: 'Dr. Rashmi Kulkarni', department: 'Anaesthesiology', hospital_name: 'Regal Hospital', experience: '15+ Years Experience', rating: '4.9 ★', fee: '₹700' },
  { id: 'RH-D29', doctor_name: 'Dr. Sumeet Bhalla', department: 'Plastic Surgery', hospital_name: 'Regal Hospital', experience: '14+ Years Experience', rating: '4.9 ★', fee: '₹1100' },
  { id: 'RH-D30', doctor_name: 'Dr. Nithya Srinivas', department: 'Pathology', hospital_name: 'Regal Hospital', experience: '8+ Years Experience', rating: '4.7 ★', fee: '₹500' },
  { id: 'RH-D31', doctor_name: 'Dr. Jayakrishnan Nair', department: 'Radiology', hospital_name: 'Regal Hospital', experience: '11+ Years Experience', rating: '4.8 ★', fee: '₹600' },
  { id: 'RH-D32', doctor_name: 'Dr. Bhavana Shah', department: 'Radiology', hospital_name: 'Regal Hospital', experience: '10+ Years Experience', rating: '4.7 ★', fee: '₹600' },
  { id: 'RH-D33', doctor_name: 'Dr. Santosh Shetty', department: 'Emergency Medicine', hospital_name: 'Regal Hospital', experience: '12+ Years Experience', rating: '4.9 ★', fee: '₹800' },
  { id: 'RH-D34', doctor_name: 'Dr. Madhavi Latha', department: 'Nuclear Medicine', hospital_name: 'Regal Hospital', experience: '13+ Years Experience', rating: '4.8 ★', fee: '₹900' },
  { id: 'RH-D35', doctor_name: 'Dr. Chethan Gowda', department: 'Physical Medicine & Rehab', hospital_name: 'Regal Hospital', experience: '9+ Years Experience', rating: '4.7 ★', fee: '₹650' },
  { id: 'RH-D36', doctor_name: 'Dr. Anushree Roy', department: 'Clinical Immunology', hospital_name: 'Regal Hospital', experience: '10+ Years Experience', rating: '4.8 ★', fee: '₹750' },
  { id: 'RH-D37', doctor_name: 'Dr. Girish Menon', department: 'Cardiothoracic Surgery', hospital_name: 'Regal Hospital', experience: '17+ Years Experience', rating: '5.0 ★', fee: '₹1300' },
  { id: 'RH-D38', doctor_name: 'Dr. Lavanya Krishnan', department: 'Pediatric Surgery', hospital_name: 'Regal Hospital', experience: '12+ Years Experience', rating: '4.8 ★', fee: '₹850' },
  { id: 'RH-D39', doctor_name: 'Dr. Hemanth Kumar', department: 'Geriatrics', hospital_name: 'Regal Hospital', experience: '11+ Years Experience', rating: '4.7 ★', fee: '₹700' },
  { id: 'RH-D40', doctor_name: 'Dr. Aparna Nair', department: 'Infectious Diseases', hospital_name: 'Regal Hospital', experience: '10+ Years Experience', rating: '4.8 ★', fee: '₹750' },
  { id: 'RH-D41', doctor_name: 'Dr. Balaji Venkat', department: 'Pain Management', hospital_name: 'Regal Hospital', experience: '13+ Years Experience', rating: '4.9 ★', fee: '₹800' },
];

function mapDoctorRow(row: Record<string, unknown>): DoctorProfile {
  const feeRaw = row.fee ?? row.consultation_fee;
  const fee =
    typeof feeRaw === 'number'
      ? `₹${feeRaw}`
      : String(feeRaw ?? '₹700');

  return {
    id: String(row.id ?? row.doctor_code ?? row.doctor_id ?? ''),
    doctor_name: String(row.doctor_name ?? row.full_name ?? 'Doctor'),
    department: String(row.department ?? row.specialization ?? 'General Medicine'),
    hospital_name: String(row.hospital_name ?? 'Regal Hospital'),
    experience: String(row.experience ?? row.years_experience ?? '10+ Years Experience'),
    rating: String(row.rating ?? '4.8 ★'),
    fee,
  };
}

export default function DoctorsDirectoryPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<DoctorProfile[]>(ALL_41_DOCTORS);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    void fetchDoctorsFromDB();
  }, []);

  const fetchDoctorsFromDB = async () => {
    setLoading(true);
    let list: DoctorProfile[] = [];

    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('doctor_id, doctor_code, full_name, doctor_name, department, specialization, hospital_name, experience, years_experience, rating, fee, consultation_fee')
        .order('full_name', { ascending: true });

      if (!error && data && data.length > 0) {
        list = (data as Record<string, unknown>[]).map((row) => mapDoctorRow(row));
      }
    } catch (err) {
      console.warn('Doctors directory fallback active:', err);
    } finally {
      setDoctors(list.length > 0 ? list : ALL_41_DOCTORS);
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
      doc.department.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8 font-sans text-[#0E2924]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#D5E8E3] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#0E2924]">Clinician & Doctor Directory</h1>
          <p className="text-xs font-bold text-[#227B6B]">
            Select a consultant to book an OPD slot directly — {doctors.length} specialists available.
          </p>
        </div>
        <button
          onClick={() => void fetchDoctorsFromDB()}
          className="flex items-center gap-2 rounded-2xl border border-[#D5E8E3] bg-white px-5 py-3 text-xs font-black text-[#113831]"
        >
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
        <div className="flex h-40 items-center justify-center text-xs font-bold">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading directory...
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="rounded-3xl border border-[#D5E8E3] bg-white p-12 text-center text-xs font-bold text-[#227B6B]">
          No doctors match your search. Try a different name or specialty.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col justify-between space-y-4 rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#EAF5F2] pb-2">
                  <span className="rounded-full bg-[#EAF5F2] px-3 py-1 text-[10px] font-black uppercase text-[#113831]">
                    {doc.department}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-black text-amber-700">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {doc.rating}
                  </span>
                </div>
                <h3 className="text-base font-black text-[#0E2924]">{doc.doctor_name}</h3>
                <p className="flex items-center gap-1 text-xs font-bold text-[#227B6B]">
                  <Building2 className="h-3.5 w-3.5" /> {doc.hospital_name}
                </p>
                <p className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                  <Award className="h-3.5 w-3.5 text-[#227B6B]" /> {doc.experience}
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-[#EAF5F2] pt-4 text-xs font-bold">
                <div>
                  <span className="block text-[10px] uppercase text-[#227B6B]">Fee</span>
                  <span className="text-base font-black">{doc.fee}</span>
                </div>
                <button
                  onClick={() => handleBookSlot(doc)}
                  className="flex items-center gap-2 rounded-2xl bg-[#113831] px-5 py-3 text-xs font-black text-white transition hover:bg-[#227B6B]"
                >
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
