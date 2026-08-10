'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  Calendar,
  ChevronDown,
  Clock,
  Loader2,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react';

import { AppointmentPass } from '@/components/opd/AppointmentPass';
import { opdUi } from '@/lib/opd/design-tokens';
import { DEPARTMENTS } from '@/lib/ecosystem/seed';
import {
  formatTimeLabel,
  useBranches,
  useDoctors,
  useFamilyMembers,
} from '@/lib/ecosystem/hooks';
import { useEcosystemStore } from '@/lib/ecosystem/store';
import { recommendAiSlot } from '@/lib/opd/scheduling-ai';
import { hubPatientBookAppointment } from '@/lib/ecosystem/ecosystem-hub';
import { useRealTimeSlots } from '@/lib/patient/booking/useRealTimeSlots';
import { useRealtimeDoctors } from '@/lib/patient/doctors/useRealtimeDoctors';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { EcosystemAppointment, EcosystemDoctor } from '@/lib/ecosystem/types';

type VisitCategory = 'OPD' | 'Telehealth' | 'Emergency' | 'Follow-up';

type Props = {
  patientId: string;
  initialDoctorId?: string | null;
  onBooked?: (appointment: EcosystemAppointment) => void;
  onNotice?: (message: string) => void;
};

const bookUi = {
  shell: 'overflow-hidden rounded-2xl border border-[#8E7692]/30 bg-[#CEB2C0]/25 shadow-sm',
  header: 'bg-[#1A332F] px-6 py-4 text-white',
  body: 'bg-[#BDE2F5]/40 p-6',
  label: 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#8E7692]',
  input:
    'w-full rounded-xl border border-[#8E7692]/35 bg-white px-4 py-2.5 text-sm font-medium text-[#1A332F] placeholder:text-[#8E7692]/70 focus:border-[#3B8C7E] focus:outline-none focus:ring-2 focus:ring-[#3B8C7E]/20',
  select:
    'w-full appearance-none rounded-xl border border-[#8E7692]/35 bg-white px-4 py-2.5 text-sm font-medium text-[#1A332F] focus:border-[#3B8C7E] focus:outline-none focus:ring-2 focus:ring-[#3B8C7E]/20',
  textarea:
    'min-h-[120px] w-full resize-y rounded-xl border border-[#8E7692]/35 bg-white px-4 py-3 text-sm font-medium text-[#1A332F] placeholder:text-[#8E7692]/70 focus:border-[#3B8C7E] focus:outline-none focus:ring-2 focus:ring-[#3B8C7E]/20',
  error: 'mt-1 text-xs font-semibold text-[#B85C5C]',
  familyPanel: 'mt-3 rounded-xl border border-[#8E7692]/30 bg-white/80 p-4',
  slotGrid: 'grid grid-cols-3 gap-2 sm:grid-cols-4',
  slotBtn:
    'rounded-xl border border-[#8E7692]/35 bg-white px-2 py-2.5 text-center text-xs font-bold text-[#1A332F] transition hover:border-[#3B8C7E]/50 hover:bg-[#CEB2C0]/30',
  slotBtnActive: 'border-[#3B8C7E] bg-[#3B8C7E] text-white shadow-sm ring-2 ring-[#3B8C7E]/25',
  slotBtnAi: 'border-[#BDE2F5] bg-[#BDE2F5]/15 ring-1 ring-[#BDE2F5]/40',
  cta: 'mt-2 w-full rounded-xl bg-[#3B8C7E] px-4 py-3.5 text-sm font-black text-white shadow-md transition hover:bg-[#1A332F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B8C7E]/40 disabled:cursor-not-allowed disabled:opacity-60',
  costCard: 'rounded-xl border border-[#8E7692]/30 bg-white/70 px-4 py-3',
} as const;

function visitCategoryToStoreType(category: VisitCategory): 'OPD' | 'Teleconsult' {
  return category === 'Telehealth' ? 'Teleconsult' : 'OPD';
}

function buildReason(category: VisitCategory, reason: string): string {
  const trimmed = reason.trim();
  if (category === 'Emergency') return `[Emergency] ${trimmed}`;
  if (category === 'Follow-up') return `[Follow-up] ${trimmed}`;
  return trimmed;
}

export function BookAppointmentForm({ patientId, initialDoctorId, onBooked, onNotice }: Props) {
  useRealtimeDoctors();

  const bookAppointment = useEcosystemStore((s) => s.bookAppointment);
  const ecosystemAppointments = useEcosystemStore((s) => s.appointments);
  const allDoctors = useEcosystemStore((s) => s.doctors);
  const branches = useBranches();
  const familyMembers = useFamilyMembers(patientId);

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [branchId, setBranchId] = useState('all');
  /** Explicit selection — not derived from filtered list (avoids losing doctor when filters change) */
  const [selectedDoctor, setSelectedDoctor] = useState<EcosystemDoctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [bookForFamily, setBookForFamily] = useState(false);
  const [familyMemberId, setFamilyMemberId] = useState('');
  const [visitCategory, setVisitCategory] = useState<VisitCategory>('OPD');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastBooked, setLastBooked] = useState<EcosystemAppointment | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const appliedInitialDoctorRef = useRef(false);
  const doctors = useDoctors(search, department, branchId);

  const selectedDoctorId = selectedDoctor?.id ?? null;

  const {
    availableTimeSlots,
    openSlots,
    loadingSlots,
    slotSource,
    slotError,
    refreshSlots,
  } = useRealTimeSlots(selectedDoctorId, selectedDate, {
    fallbackSlotTimes: selectedDoctor?.slots ?? [],
  });

  /** Render AI slots when BOTH doctor and date have values */
  const showSlots = Boolean(selectedDoctorId && selectedDate);

  const aiSlot = useMemo(() => {
    if (!showSlots || !selectedDoctor || openSlots.length === 0) return null;
    const doctorWithLiveSlots = {
      ...selectedDoctor,
      slots: openSlots.map((s) => s.slotTime),
    };
    return recommendAiSlot(doctorWithLiveSlots, selectedDate, ecosystemAppointments);
  }, [showSlots, selectedDoctor, selectedDate, openSlots, ecosystemAppointments]);

  /** Pre-fill doctor when navigating from Doctors directory (?book=) */
  useEffect(() => {
    if (!initialDoctorId || appliedInitialDoctorRef.current || allDoctors.length === 0) return;
    const doc = allDoctors.find((d) => d.id === initialDoctorId);
    if (!doc) return;
    appliedInitialDoctorRef.current = true;
    setSelectedDoctor(doc);
    setSearch(doc.name);
    setDepartment(doc.department);
    if (doc.branchId) setBranchId(doc.branchId);
  }, [initialDoctorId, allDoctors]);

  /** Keep selected doctor object fresh after store rehydrate */
  useEffect(() => {
    setSelectedDoctor((current) => {
      if (!current) return null;
      return allDoctors.find((d) => d.id === current.id) ?? current;
    });
  }, [allDoctors]);

  const dropdownDoctors = useMemo(() => {
    if (!search.trim()) return doctors.slice(0, 6);
    return doctors.slice(0, 8);
  }, [doctors, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDoctorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectDoctor = (doctor: EcosystemDoctor) => {
    setSelectedDoctor(doctor);
    setSearch(doctor.name);
    setShowDoctorDropdown(false);
    setErrors((prev) => ({ ...prev, doctor: '' }));
  };

  const clearDoctorSelection = () => {
    setSelectedDoctor(null);
    setSearch('');
    setTime('');
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setShowDoctorDropdown(true);
    if (
      selectedDoctor &&
      !selectedDoctor.name.toLowerCase().includes(value.trim().toLowerCase())
    ) {
      setSelectedDoctor(null);
      setTime('');
      return;
    }
    // Auto-select when search exactly matches one doctor in filtered results
    const q = value.trim().toLowerCase();
    if (q && !selectedDoctor) {
      const exact = doctors.filter(
        (d) =>
          d.name.toLowerCase() === q ||
          d.name.toLowerCase().includes(q) && q.length >= 4,
      );
      if (exact.length === 1) setSelectedDoctor(exact[0]!);
    }
  };

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setTime('');
    setErrors((prev) => ({ ...prev, date: '' }));
  };

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!selectedDoctor) e.doctor = 'Select a doctor from search results';
    if (!selectedDate) e.date = 'Choose a visit date';
    if (!time) e.time = 'Select an available time slot';
    if (!reason.trim()) e.reason = 'Please describe your reason for visit';
    if (bookForFamily && !familyMemberId) e.family = 'Select a family member profile';
    if (selectedDate && selectedDate < new Date().toISOString().slice(0, 10)) {
      e.date = 'Date must be today or later';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [selectedDoctor, selectedDate, time, reason, bookForFamily, familyMemberId]);

  const handleBook = async () => {
    if (!selectedDoctor || !validate()) return;

    const appt = bookAppointment({
      patientId,
      doctorId: selectedDoctor.id,
      date: selectedDate,
      time,
      reason: buildReason(visitCategory, reason),
      type: visitCategoryToStoreType(visitCategory),
      familyMemberId: bookForFamily && familyMemberId ? familyMemberId : undefined,
      branchId: branchId !== 'all' ? branchId : selectedDoctor.branchId,
    });

    const supabase = getSupabaseBrowserClient();
    try {
      await hubPatientBookAppointment(appt);
      if (supabase) await refreshSlots();
    } catch {
      /* local booking succeeded; hub sync optional */
    }

    setLastBooked(appt);
    onBooked?.(appt);
    onNotice?.(`Appointment requested with ${selectedDoctor.name}. Token ${appt.token} · QR pass ready.`);
    setReason('');
    setTime('');
  };

  return (
    <section className={bookUi.shell}>
      <div className={bookUi.header}>
        <h2 className="flex items-center gap-2 text-lg font-black">
          <Stethoscope className="h-5 w-5" /> Book Appointment
        </h2>
        <p className="mt-1 text-sm text-white/75">
          Enterprise scheduling with AI-optimized slot recommendations
        </p>
      </div>

      <div className={bookUi.body}>
        <div className="grid gap-8 lg:grid-cols-2">
          {/* ── Left column ── */}
          <div className="space-y-5">
            <div ref={searchRef} className="relative">
              <label className={bookUi.label} htmlFor="doctor-search">
                Search Doctors
              </label>
              <div className="relative">
                <Stethoscope className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E7692]" />
                <input
                  id="doctor-search"
                  className={`${bookUi.input} pl-10 pr-10`}
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowDoctorDropdown(true)}
                  placeholder="Search by name, specialty, or department…"
                  autoComplete="off"
                />
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E7692]" />
              </div>

              {showDoctorDropdown && dropdownDoctors.length > 0 && (
                <ul
                  className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[#8E7692]/35 bg-white py-1 shadow-lg"
                  role="listbox"
                >
                  {dropdownDoctors.map((d) => (
                    <li key={d.id} role="option" aria-selected={selectedDoctor?.id === d.id}>
                      <button
                        type="button"
                        onClick={() => selectDoctor(d)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[#CEB2C0]/25"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1A332F] text-xs font-black text-white">
                          {d.photoInitials}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-[#1A332F]">{d.name}</span>
                          <span className="block truncate text-xs text-[#8E7692]">{d.specialization}</span>
                          <span className="mt-0.5 block text-xs font-semibold text-[#3B8C7E]">
                            ₹{d.consultationFee} · {d.roomNumber}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {selectedDoctor && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#3B8C7E]/30 bg-white/90 px-4 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3B8C7E] text-sm font-black text-white">
                    {selectedDoctor.photoInitials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-[#1A332F]">{selectedDoctor.name}</p>
                    <p className="truncate text-xs text-[#8E7692]">{selectedDoctor.department}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#5E8B7E]/15 px-2 py-0.5 text-[10px] font-bold text-[#5E8B7E]">
                    {selectedDoctor.rating}★
                  </span>
                  <button
                    type="button"
                    onClick={clearDoctorSelection}
                    className="shrink-0 text-xs font-bold text-[#8E7692] hover:text-[#B85C5C]"
                    aria-label="Clear selected doctor"
                  >
                    ✕
                  </button>
                </div>
              )}
              {errors.doctor && <p className={bookUi.error}>{errors.doctor}</p>}
            </div>

            <div>
              <label className={bookUi.label} htmlFor="branch-select">
                Hospital Branch
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E7692]" />
                <select
                  id="branch-select"
                  className={`${bookUi.select} pl-10`}
                  value={branchId}
                  onChange={(e) => {
                    setBranchId(e.target.value);
                    clearDoctorSelection();
                  }}
                >
                  <option value="all">All Nexora branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} · {b.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={bookUi.label} htmlFor="dept-select">
                Department
              </label>
              <select
                id="dept-select"
                className={bookUi.select}
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  clearDoctorSelection();
                }}
              >
                <option value="all">All departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={bookUi.label} htmlFor="reason-input">
                Reason for Visit
              </label>
              <textarea
                id="reason-input"
                className={bookUi.textarea}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe symptoms, routine check-up, or follow-up notes..."
              />
              {errors.reason && <p className={bookUi.error}>{errors.reason}</p>}
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-5">
            <div className="rounded-xl border border-[#8E7692]/30 bg-white/60 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={bookForFamily}
                  onChange={(e) => {
                    setBookForFamily(e.target.checked);
                    if (!e.target.checked) setFamilyMemberId('');
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-[#8E7692]/50 text-[#3B8C7E] focus:ring-[#3B8C7E]/30"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-[#1A332F]">
                    <Users className="h-4 w-4 text-[#3B8C7E]" /> Book for family member
                  </span>
                  <span className="mt-0.5 block text-xs text-[#8E7692]">
                    Schedule on behalf of a linked dependent or parent profile
                  </span>
                </span>
              </label>

              {bookForFamily && (
                <div className={bookUi.familyPanel}>
                  <label className={bookUi.label} htmlFor="family-select">
                    Select Family Profile
                  </label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E7692]" />
                    <select
                      id="family-select"
                      className={`${bookUi.select} pl-10`}
                      value={familyMemberId}
                      onChange={(e) => setFamilyMemberId(e.target.value)}
                    >
                      <option value="">Choose family member</option>
                      {familyMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} · {m.relation}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.family && <p className={bookUi.error}>{errors.family}</p>}
                </div>
              )}
            </div>

            <div>
              <label className={bookUi.label} htmlFor="visit-type">
                Visit Type
              </label>
              <select
                id="visit-type"
                className={bookUi.select}
                value={visitCategory}
                onChange={(e) => setVisitCategory(e.target.value as VisitCategory)}
              >
                <option value="OPD">OPD — In-person hospital visit</option>
                <option value="Telehealth">Telehealth — Video consultation</option>
                <option value="Emergency">Emergency — Urgent same-day care</option>
                <option value="Follow-up">Follow-up — Scheduled review visit</option>
              </select>
            </div>

            <div>
              <label className={bookUi.label} htmlFor="visit-date">
                Visit Date
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E7692]" />
                <input
                  id="visit-date"
                  type="date"
                  className={`${bookUi.input} pl-10`}
                  value={selectedDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>
              {errors.date && <p className={bookUi.error}>{errors.date}</p>}
            </div>

            {/* AI Smart Slot Widget */}
            <div className="rounded-2xl border border-[#8E7692]/35 bg-white/80 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#3B8C7E]" />
                  <h3 className="text-sm font-black text-[#1A332F]">AI Smart Slot Recommendation</h3>
                </div>
                {showSlots && (
                  <span className="rounded-full bg-[#5E8B7E]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#5E8B7E]">
                    {loadingSlots ? 'Syncing…' : slotSource === 'supabase' ? 'Live · Supabase' : 'Local cache'}
                  </span>
                )}
              </div>

              {!showSlots ? (
                <p className="rounded-xl border border-dashed border-[#8E7692]/40 bg-[#BDE2F5]/30 px-4 py-6 text-center text-xs text-[#8E7692]">
                  {!selectedDoctor && !selectedDate
                    ? 'Select a doctor and date to view AI-optimized time slots'
                    : !selectedDoctor
                      ? 'Select a doctor to view available time slots'
                      : 'Pick a visit date to view AI-optimized time slots'}
                </p>
              ) : loadingSlots && availableTimeSlots.length === 0 ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#8E7692]/40 bg-[#BDE2F5]/30 px-4 py-8 text-sm text-[#8E7692]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#3B8C7E]" />
                  Fetching live slots from Supabase…
                </div>
              ) : (
                <>
                  {slotError && (
                    <p className="mb-3 rounded-lg bg-[#BDE2F5]/20 px-3 py-2 text-xs text-[#1A332F]">
                      {slotError} — showing cached availability.
                    </p>
                  )}

                  {aiSlot && (
                    <button
                      type="button"
                      onClick={() => setTime(aiSlot.slot)}
                      disabled={availableTimeSlots.some((s) => s.slotTime === aiSlot.slot && s.isBooked)}
                      className={`${opdUi.aiSlot} mb-4 flex w-full items-center gap-3 px-4 py-3 text-left transition hover:ring-[#3B8C7E]/35 disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <span className="text-lg" aria-hidden>
                        ⭐
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-[#1A332F]">
                          AI Recommended Slot: {formatTimeLabel(aiSlot.slot)} (Lowest Waiting Time)
                        </span>
                        <span className="mt-0.5 block text-xs font-medium text-[#8E7692]">
                          ~{aiSlot.estimatedWaitMinutes} min estimated wait · {aiSlot.queueDepth} patients ahead
                        </span>
                      </span>
                    </button>
                  )}

                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#8E7692]">
                    <Clock className="h-3.5 w-3.5" /> Available Slots
                    {loadingSlots && <Loader2 className="h-3 w-3 animate-spin" />}
                  </p>

                  {availableTimeSlots.length === 0 ? (
                    <p className="rounded-xl border border-[#8E7692]/30 bg-[#BDE2F5]/20 px-4 py-4 text-center text-xs text-[#8E7692]">
                      No slots configured for this day. Try another date or branch.
                    </p>
                  ) : (
                    <div className={bookUi.slotGrid}>
                      {availableTimeSlots.map((slot) => {
                        const isSelected = time === slot.slotTime;
                        const isAi = aiSlot?.slot === slot.slotTime;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={slot.isBooked}
                            onClick={() => setTime(slot.slotTime)}
                            className={`${bookUi.slotBtn} ${isSelected ? bookUi.slotBtnActive : ''} ${isAi && !isSelected ? bookUi.slotBtnAi : ''} ${slot.isBooked ? 'cursor-not-allowed opacity-40 line-through' : ''}`}
                          >
                            {isAi && !slot.isBooked && (
                              <span className="mb-0.5 block text-[10px] text-[#BDE2F5]">★ AI</span>
                            )}
                            {slot.isBooked ? (
                              <span className="text-[10px] text-[#B85C5C]">Booked</span>
                            ) : (
                              formatTimeLabel(slot.slotTime)
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {errors.time && <p className={`${bookUi.error} mt-2`}>{errors.time}</p>}
                </>
              )}
            </div>

            {selectedDoctor && (
              <div className={bookUi.costCard}>
                <p className="text-xs font-bold uppercase tracking-wide text-[#8E7692]">
                  Estimated Consultation Cost
                </p>
                <p className="mt-1 text-2xl font-black text-[#3B8C7E]">₹{selectedDoctor.consultationFee}</p>
                <p className="mt-0.5 text-xs text-[#8E7692]">Excludes diagnostics, pharmacy &amp; procedures</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleBook}
              disabled={!selectedDoctor}
              className={bookUi.cta}
            >
              Book Appointment
            </button>
          </div>
        </div>

        {lastBooked && (
          <div className="mt-8 border-t border-[#8E7692]/25 pt-6">
            <AppointmentPass appointment={lastBooked} />
          </div>
        )}
      </div>
    </section>
  );
}
