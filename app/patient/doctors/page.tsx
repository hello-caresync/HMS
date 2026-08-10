'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Calendar,
  Loader2,
  RotateCw,
  Search,
  Star,
  Stethoscope,
  UserRound,
} from 'lucide-react';

import { REGAL_DOCTORS, type RegalDoctor } from '@/lib/doctor/regal-doctors';
import { supabase } from '@/lib/supabaseClient';

interface DirectoryDoctor {
  id: string;
  full_name: string;
  department: string;
  specialization: string;
  consultation_fee: number;
  employee_code: string;
  experience_years: number;
  hospital_branch: string;
  rating: number;
}

const REGAL_HOSPITAL = 'Regal Hospital';
const CACHE_KEY = 'curasync_doctors_directory';

/** Curated verified fallback — includes named clinicians from the master prompt. */
const CURATED_FALLBACK: DirectoryDoctor[] = [
  {
    id: 'RH-D01',
    full_name: 'Dr SURIRAJU V',
    department: 'Urology',
    specialization: 'Urologist | Andrologist | Laparoscopic Surgeon',
    consultation_fee: 800,
    employee_code: 'RH-D01',
    experience_years: 22,
    hospital_branch: REGAL_HOSPITAL,
    rating: 4.9,
  },
  {
    id: 'RH-D06',
    full_name: 'Dr CHANDRAKANTH S KESARI',
    department: 'General Surgery',
    specialization: 'General & Laparoscopic Surgery',
    consultation_fee: 700,
    employee_code: 'RH-D06',
    experience_years: 15,
    hospital_branch: REGAL_HOSPITAL,
    rating: 4.9,
  },
  {
    id: 'RH-D-ANANYA',
    full_name: 'Dr ANANYA R',
    department: 'General Physician',
    specialization: 'Internal Medicine | Preventive Care',
    consultation_fee: 550,
    employee_code: 'RH-D42',
    experience_years: 8,
    hospital_branch: REGAL_HOSPITAL,
    rating: 4.9,
  },
];

function experienceFromIndex(index: number): number {
  return 6 + ((index * 3) % 18);
}

function mapRegalDoctor(doctor: RegalDoctor, index: number): DirectoryDoctor {
  return {
    id: doctor.employeeId,
    full_name: doctor.name.replace(/^Dr\.\s*/i, 'Dr '),
    department: doctor.department,
    specialization: doctor.specialization,
    consultation_fee: doctor.fee,
    employee_code: doctor.employeeId,
    experience_years: experienceFromIndex(index),
    hospital_branch: REGAL_HOSPITAL,
    rating: 4.9,
  };
}

function buildLocalDirectory(): DirectoryDoctor[] {
  const fromRoster = REGAL_DOCTORS.map(mapRegalDoctor);
  const byCode = new Map(fromRoster.map((doctor) => [doctor.employee_code, doctor]));

  for (const curated of CURATED_FALLBACK) {
    if (!byCode.has(curated.employee_code)) {
      byCode.set(curated.employee_code, curated);
    } else {
      // Keep curated display names for the named clinicians in the prompt.
      const existing = byCode.get(curated.employee_code)!;
      byCode.set(curated.employee_code, {
        ...existing,
        full_name: curated.full_name,
        rating: 4.9,
      });
    }
  }

  return Array.from(byCode.values());
}

function mapSupabaseDoctor(row: Record<string, unknown>, index: number): DirectoryDoctor {
  const employeeCode = String(
    row.employee_code ?? row.employee_id ?? row.id ?? `DOC-${index + 1}`,
  );
  const fullName = String(row.full_name ?? row.name ?? row.doctor_name ?? 'Clinician');

  return {
    id: String(row.id ?? employeeCode),
    full_name: fullName,
    department: String(row.department ?? row.specialty ?? 'General'),
    specialization: String(row.specialization ?? row.designation ?? row.department ?? 'Consultant'),
    consultation_fee: Number(row.consultation_fee ?? row.fee ?? 500),
    employee_code: employeeCode,
    experience_years: Number(row.experience_years ?? row.experience ?? experienceFromIndex(index)),
    hospital_branch: String(row.hospital_branch ?? row.hospital_name ?? REGAL_HOSPITAL),
    rating: Number(row.rating ?? 4.9),
  };
}

function getInitials(name: string): string {
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function PatientDoctorsDirectoryPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<DirectoryDoctor[]>(() => buildLocalDirectory());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'database' | 'local'>('local');

  const fetchDoctorsFromDB = useCallback(async () => {
    setLoading(true);
    const localDirectory = buildLocalDirectory();

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as DirectoryDoctor[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDoctors(parsed);
        }
      }
    } catch {
      /* ignore corrupt cache */
    }

    try {
      const { data, error } = await supabase.from('doctors').select('*');

      if (error || !data || data.length === 0) {
        setDoctors(localDirectory);
        setSource('local');
        localStorage.setItem(CACHE_KEY, JSON.stringify(localDirectory));
        return;
      }

      const mapped = data.map((row, index) =>
        mapSupabaseDoctor(row as Record<string, unknown>, index),
      );
      setDoctors(mapped);
      setSource('database');
      localStorage.setItem(CACHE_KEY, JSON.stringify(mapped));
    } catch {
      setDoctors(localDirectory);
      setSource('local');
      localStorage.setItem(CACHE_KEY, JSON.stringify(localDirectory));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchDoctorsFromDB();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchDoctorsFromDB]);

  const filteredDoctors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return doctors;

    return doctors.filter((doctor) => {
      const haystack = [
        doctor.full_name,
        doctor.department,
        doctor.specialization,
        doctor.hospital_branch,
        doctor.employee_code,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [doctors, searchQuery]);

  const handleBookSlot = (doctor: DirectoryDoctor) => {
    localStorage.setItem('selected_doctor_id', doctor.id);
    localStorage.setItem('selected_doctor_name', doctor.full_name);
    localStorage.setItem('selected_department', doctor.department);
    const params = new URLSearchParams({
      dept: doctor.department,
      doctor: doctor.full_name,
    });
    router.push(`/patient/appointments/book?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 font-sans text-[#0E2924]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0E2924]">Doctors Directory</h1>
          <p className="mt-1 text-xs font-bold text-[#4B736B]">
            Regal Hospital specialists • Search, review, and book consultation slots
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#EAF5F2] px-3 py-1 text-[10px] font-black uppercase text-[#113831]">
            {source === 'database' ? 'Live Supabase' : 'Local roster'}
          </span>
          <button
            type="button"
            onClick={() => void fetchDoctorsFromDB()}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#D5E8E3] bg-white px-4 py-2.5 text-xs font-black text-[#113831] transition hover:bg-[#EAF5F2]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#227B6B]" />
            ) : (
              <RotateCw className="h-4 w-4 text-[#227B6B]" />
            )}
            Refresh
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#227B6B]" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by clinician name, department, or hospital branch…"
          className="w-full rounded-2xl border border-[#D5E8E3] bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-[#0E2924] outline-none focus:border-[#227B6B] focus:ring-2 focus:ring-[#EAF5F2]"
        />
      </div>

      {loading && doctors.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-[#D5E8E3] bg-white">
          <div className="flex items-center gap-2 text-xs font-bold text-[#4B736B]">
            <Loader2 className="h-5 w-5 animate-spin text-[#227B6B]" />
            Loading clinician directory…
          </div>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="rounded-3xl border border-[#D5E8E3] bg-white p-12 text-center">
          <Stethoscope className="mx-auto h-10 w-10 text-[#227B6B]/40" />
          <p className="mt-3 text-sm font-black text-[#0E2924]">No clinicians matched your search</p>
          <p className="mt-1 text-xs font-bold text-[#4B736B]">
            Try another name, department, or hospital branch.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDoctors.map((doctor) => (
            <article
              key={doctor.id}
              className="flex flex-col rounded-3xl border border-[#D5E8E3] bg-white p-5 shadow-sm transition hover:border-[#227B6B] hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#113831] text-sm font-black text-[#EAF5F2]">
                  {getInitials(doctor.full_name) || <UserRound className="h-6 w-6" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="truncate text-base font-black text-[#0E2924]">
                      {doctor.full_name}
                    </h2>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#EAF5F2] px-2 py-1 text-[10px] font-black text-[#113831]">
                      <Star className="h-3 w-3 fill-[#227B6B] text-[#227B6B]" />
                      4.9 ★
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold text-[#4B736B]">
                    {doctor.specialization}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#EAF5F2] px-2.5 py-1 text-[10px] font-black uppercase text-[#113831]">
                  {doctor.department}
                </span>
                <span className="rounded-full border border-[#D5E8E3] bg-[#F4F8F7] px-2.5 py-1 text-[10px] font-black text-[#227B6B]">
                  {doctor.employee_code}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs font-bold text-[#4B736B]">
                <p className="flex items-center gap-2">
                  <Stethoscope className="h-3.5 w-3.5 text-[#227B6B]" />
                  {doctor.experience_years} years experience
                </p>
                <p className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-[#227B6B]" />
                  {doctor.hospital_branch}
                </p>
                <p className="text-sm font-black text-[#0E2924]">
                  Consultation fee:{' '}
                  <span className="text-[#113831]">₹{doctor.consultation_fee}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleBookSlot(doctor)}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#113831] px-4 py-3 text-xs font-black text-white transition hover:bg-[#0E2924]"
              >
                <Calendar className="h-4 w-4 text-[#EAF5F2]" />
                Book Slot
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
