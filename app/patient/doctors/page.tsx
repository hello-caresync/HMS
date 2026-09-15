'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  fetchPatientBookableDoctors,
  formatConsultationFee,
} from '@/lib/hospital/hospital-staff-roster';
import { filterBlockedPhantomDoctors } from '@/lib/hospital/doctors';
import { resolveHospitalUuid } from '@/lib/hospital/resolve-hospital-context';
import { readPatientPortalSession } from '@/lib/patient/portal-session';
import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';
import { Search, Calendar, RotateCw, Building2, Award, Loader2 } from 'lucide-react';

interface DoctorProfile {
  id: string;
  doctor_name: string;
  department: string;
  hospital_name: string;
  experience: string;
  fee: string;
}

export default function DoctorsDirectoryPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hospitalId, setHospitalId] = useState<string>(
    () => readPatientPortalSession()?.hospital_id ?? '',
  );

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const session = readPatientPortalSession();
      const resolvedHospitalId =
        session?.hospital_id ||
        (await resolveHospitalUuid(supabase, REGAL_HOSPITAL_CODE)) ||
        REGAL_HOSPITAL_CODE;
      const rows = await fetchPatientBookableDoctors(supabase, resolvedHospitalId);
      const verifiedDoctors = filterBlockedPhantomDoctors(rows);

      setDoctors(
        verifiedDoctors.map((row) => ({
          id: row.id,
          doctor_name: row.full_name,
          department: row.department,
          hospital_name: session?.hospital_name || 'Regal Hospital',
          experience: row.experience || row.qualification || 'Verified clinician',
          fee: formatConsultationFee(row.consultation_fee),
        })),
      );
    } catch (err) {
      console.warn('Doctors directory load failed:', err);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const session = readPatientPortalSession();
      const resolved = session?.hospital_id || (await resolveHospitalUuid(supabase)) || '';
      if (resolved) setHospitalId(resolved);
    })();
  }, []);

  useEffect(() => {
    void loadDoctors();

    if (!hospitalId || !supabase) return;

    const channelName = `patient_doctors_directory_${hospitalId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'doctors',
          filter: `hospital_id=eq.${hospitalId}`,
        },
        () => {
          void loadDoctors();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [hospitalId, loadDoctors]);

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
            Admin-verified consultants only — {doctors.length} specialist
            {doctors.length === 1 ? '' : 's'} available to book.
          </p>
        </div>
        <button
          onClick={() => void loadDoctors()}
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

      {!loading && doctors.length === 0 ? (
        <div className="col-span-full rounded-3xl border border-dashed border-[#D5E8E3] bg-white py-12 text-center">
          <p className="text-sm font-black text-[#0E2924]">No doctors currently provisioned for this facility.</p>
          <p className="mt-2 text-xs font-bold text-slate-500">
            Ask your hospital admin to add verified clinicians in Supabase before booking.
          </p>
        </div>
      ) : loading ? (
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
                <div className="border-b border-[#EAF5F2] pb-2">
                  <span className="rounded-full bg-[#EAF5F2] px-3 py-1 text-[10px] font-black uppercase text-[#113831]">
                    {doc.department}
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
                  <span className="block text-[10px] uppercase text-[#227B6B]">Consultation Fee</span>
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
