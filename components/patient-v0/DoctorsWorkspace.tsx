'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, Loader2, Search, Star } from 'lucide-react';

import { DoctorProfileDrawer } from '@/components/patient-v0/DoctorProfileDrawer';
import { opdUi } from '@/lib/opd/design-tokens';
import { v0Ui } from '@/components/patient-v0/ui';
import { DEPARTMENTS } from '@/lib/ecosystem/seed';
import { filterDoctors } from '@/lib/patient/doctors/fetchDoctors';
import { useRealtimeDoctors } from '@/lib/patient/doctors/useRealtimeDoctors';
import { PATIENT_ROUTES } from '@/lib/patient/navigation';

const ALL_DEPARTMENTS = 'All departments';

export function DoctorsWorkspace() {
  const searchParams = useSearchParams();
  const preselectId = searchParams.get('doctor');

  const { doctors, loading, source, error, refreshDoctors } = useRealtimeDoctors();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(ALL_DEPARTMENTS);
  const [selectedDoctor, setSelectedDoctor] = useState<(typeof doctors)[0] | null>(null);

  const filtered = useMemo(
    () => filterDoctors(doctors, searchQuery, selectedDepartment),
    [doctors, searchQuery, selectedDepartment],
  );

  useEffect(() => {
    if (loading || doctors.length === 0) return;

    if (preselectId) {
      const match = doctors.find((d) => d.id === preselectId);
      if (match) {
        setSelectedDoctor(match);
        return;
      }
    }

    setSelectedDoctor((current) => {
      if (current && doctors.some((d) => d.id === current.id)) return current;
      return filtered[0] ?? doctors[0] ?? null;
    });
  }, [loading, doctors, filtered, preselectId]);

  useEffect(() => {
    if (!selectedDoctor) return;
    if (!filtered.some((d) => d.id === selectedDoctor.id)) {
      setSelectedDoctor(filtered[0] ?? null);
    }
  }, [filtered, selectedDoctor]);

  return (
    <div className={`${v0Ui.page} ${opdUi.canvas} min-h-full rounded-2xl p-1`}>
      <header className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className={v0Ui.pageTitle}>Doctors Directory</h1>
            <p className={v0Ui.pageSubtitle}>Live specialists · book in one tap</p>
          </div>
          {source === 'supabase' && (
            <span className="rounded-full bg-[#5E8B7E]/15 px-3 py-1 text-xs font-bold text-[#5E8B7E]">
              Real-time · Supabase
            </span>
          )}
        </div>
      </header>

      {error && (
        <p className="mb-4 rounded-xl bg-[#D8A657]/20 px-4 py-2 text-sm text-[#482A41]">
          {error} — showing cached directory.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E7692]" />
              <input
                className={`${v0Ui.input} pl-10`}
                placeholder="Search name or specialty…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className={`${v0Ui.select} min-w-[180px]`}
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value={ALL_DEPARTMENTS}>{ALL_DEPARTMENTS}</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void refreshDoctors()}
              className={opdUi.btnSecondary}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[#8E7692]/40 bg-white/60 py-16 text-sm text-[#8E7692]">
              <Loader2 className="h-5 w-5 animate-spin text-[#572E54]" />
              Loading doctors from Supabase…
            </div>
          ) : filtered.length === 0 ? (
            <div className={v0Ui.empty}>
              <p className="text-sm text-patient-lavender">No doctors match your filters.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((d) => (
                <article
                  key={d.id}
                  className={`${v0Ui.cardHover} cursor-pointer transition ${
                    selectedDoctor?.id === d.id
                      ? 'ring-2 ring-[#572E54]/50 shadow-md'
                      : 'border-[#8E7692]/30'
                  }`}
                  onClick={() => setSelectedDoctor(d)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedDoctor(d)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#572E54] text-lg font-black text-white">
                      {d.photoInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-[#482A41]">{d.name}</p>
                      <p className="text-xs font-bold text-[#572E54]">{d.department}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-[#8E7692]">{d.specialization}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 font-bold text-[#D8A657]">
                          <Star className="h-3 w-3 fill-current" /> {d.rating}
                        </span>
                        <span className="font-bold text-[#572E54]">₹{d.consultationFee}</span>
                        {d.availableToday && (
                          <span className={opdUi.badgeOnTime}>Available</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`${PATIENT_ROUTES.appointments}?book=${d.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className={`${v0Ui.btnPrimary} mt-4 w-full`}
                  >
                    <CalendarDays className="h-4 w-4" /> Book Appointment
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>

        {selectedDoctor ? (
          <DoctorProfileDrawer
            doctor={selectedDoctor}
            liveSource={source === 'supabase' ? 'supabase' : 'local'}
            onClose={() => setSelectedDoctor(null)}
          />
        ) : (
          <aside className={`${v0Ui.card} flex h-48 items-center justify-center lg:h-fit lg:min-h-[320px]`}>
            <p className="text-center text-sm text-[#8E7692]">Select a doctor to view profile</p>
          </aside>
        )}
      </div>
    </div>
  );
}
