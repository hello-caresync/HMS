'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  FileText,
  History,
  Search,
  Stethoscope,
  Timer,
  UserCheck,
} from 'lucide-react';

type Specialty =
  | 'All'
  | 'General Medicine'
  | 'Cardiology'
  | 'Dermatology'
  | 'Pediatrics'
  | 'Orthopedics'
  | 'Endocrinology';

type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'Rescheduled';

type TimeSlot = {
  id: string;
  dateLabel: string;
  timeLabel: string;
  doctorName: string;
  specialty: Exclude<Specialty, 'All'>;
  department: string;
};

type UpcomingAppointment = {
  id: string;
  doctorName: string;
  specialty: string;
  department: string;
  slotDate: string;
  slotTime: string;
  status: AppointmentStatus;
};

type PhysicianAvailability = {
  id: string;
  name: string;
  specialty: string;
  isAvailable: boolean;
  nextSlot: string;
};

type VisitHistoryEntry = {
  id: string;
  date: string;
  doctorName: string;
  specialty: string;
  diagnosisSummary: string;
  completionStatus: 'Completed' | 'Follow-up Required';
};

type QueueStatus = {
  currentToken: number;
  yourToken: number;
  estimatedWaitMins: number;
  department: string;
  isActiveToday: boolean;
};

const SPECIALTY_FILTERS: Specialty[] = [
  'All',
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Endocrinology',
];

const PANEL_CLASS = 'rounded-2xl border border-patient-lavender/30 bg-white p-6 shadow-sm';

const QUEUE_STATUS: QueueStatus = {
  currentToken: 4,
  yourToken: 7,
  estimatedWaitMins: 12,
  department: 'OPD Block A · General Medicine',
  isActiveToday: true,
};

const AVAILABLE_SLOTS: TimeSlot[] = [
  {
    id: 'slot-1',
    dateLabel: 'Mon · 14 Jul',
    timeLabel: '09:00 AM',
    doctorName: 'Dr. Meera Nair',
    specialty: 'General Medicine',
    department: 'OPD Block A · Cabin C-12',
  },
  {
    id: 'slot-2',
    dateLabel: 'Mon · 14 Jul',
    timeLabel: '11:30 AM',
    doctorName: 'Dr. Rajesh Kumar',
    specialty: 'Cardiology',
    department: 'Cardiac Wing · CW-04',
  },
  {
    id: 'slot-3',
    dateLabel: 'Tue · 15 Jul',
    timeLabel: '10:00 AM',
    doctorName: 'Dr. Ananya Pillai',
    specialty: 'Dermatology',
    department: 'Skin Clinic · D-07',
  },
  {
    id: 'slot-4',
    dateLabel: 'Tue · 15 Jul',
    timeLabel: '02:30 PM',
    doctorName: 'Dr. Kavitha Rao',
    specialty: 'Pediatrics',
    department: 'Child Health · P-03',
  },
  {
    id: 'slot-5',
    dateLabel: 'Wed · 16 Jul',
    timeLabel: '09:45 AM',
    doctorName: 'Dr. Meera Nair',
    specialty: 'General Medicine',
    department: 'OPD Block A · C-12',
  },
  {
    id: 'slot-6',
    dateLabel: 'Wed · 16 Jul',
    timeLabel: '03:30 PM',
    doctorName: 'Dr. Vikram S.',
    specialty: 'Orthopedics',
    department: 'Bone & Joint · O-02',
  },
  {
    id: 'slot-7',
    dateLabel: 'Thu · 17 Jul',
    timeLabel: '11:00 AM',
    doctorName: 'Dr. Rajesh Kumar',
    specialty: 'Cardiology',
    department: 'Cardiac Wing · CW-04',
  },
  {
    id: 'slot-8',
    dateLabel: 'Fri · 18 Jul',
    timeLabel: '10:30 AM',
    doctorName: 'Dr. Priya Menon',
    specialty: 'Endocrinology',
    department: 'Metabolic Clinic · E-05',
  },
];

const PHYSICIANS: PhysicianAvailability[] = [
  { id: 'phy-1', name: 'Dr. Meera Nair', specialty: 'General Medicine', isAvailable: true, nextSlot: '09:45 AM today' },
  { id: 'phy-2', name: 'Dr. Rajesh Kumar', specialty: 'Cardiology', isAvailable: true, nextSlot: '11:30 AM today' },
  { id: 'phy-3', name: 'Dr. Ananya Pillai', specialty: 'Dermatology', isAvailable: false, nextSlot: 'Tue 10:00 AM' },
  { id: 'phy-4', name: 'Dr. Kavitha Rao', specialty: 'Pediatrics', isAvailable: true, nextSlot: '02:30 PM today' },
  { id: 'phy-5', name: 'Dr. Vikram S.', specialty: 'Orthopedics', isAvailable: false, nextSlot: 'Wed 03:30 PM' },
  { id: 'phy-6', name: 'Dr. Priya Menon', specialty: 'Endocrinology', isAvailable: true, nextSlot: 'Thu 01:15 PM' },
];

const VISIT_HISTORY: VisitHistoryEntry[] = [
  {
    id: 'vis-1',
    date: '08 Jul 2026',
    doctorName: 'Dr. Meera Nair',
    specialty: 'General Medicine',
    diagnosisSummary: 'Essential hypertension · stable · continue Amlodipine 5 mg',
    completionStatus: 'Completed',
  },
  {
    id: 'vis-2',
    date: '22 Jun 2026',
    doctorName: 'Dr. Rajesh Kumar',
    specialty: 'Cardiology',
    diagnosisSummary: 'Mild LVH on echo · lipid panel ordered · lifestyle counselling',
    completionStatus: 'Follow-up Required',
  },
  {
    id: 'vis-3',
    date: '04 Jun 2026',
    doctorName: 'Dr. Ananya Pillai',
    specialty: 'Dermatology',
    diagnosisSummary: 'Contact dermatitis · topical steroid course · resolved',
    completionStatus: 'Completed',
  },
  {
    id: 'vis-4',
    date: '15 May 2026',
    doctorName: 'Dr. Kavitha Rao',
    specialty: 'Pediatrics',
    diagnosisSummary: 'Well-child visit · growth chart normal · vaccinations updated',
    completionStatus: 'Completed',
  },
];

const SEED_APPOINTMENTS: UpcomingAppointment[] = [
  {
    id: 'apt-201',
    doctorName: 'Dr. Meera Nair',
    specialty: 'General Medicine',
    department: 'OPD Block A',
    slotDate: '14 Jul 2026',
    slotTime: '10:30 AM',
    status: 'Confirmed',
  },
  {
    id: 'apt-202',
    doctorName: 'Dr. Rajesh Kumar',
    specialty: 'Cardiology',
    department: 'Cardiac Wing',
    slotDate: '18 Jul 2026',
    slotTime: '02:00 PM',
    status: 'Scheduled',
  },
  {
    id: 'apt-203',
    doctorName: 'Dr. Ananya Pillai',
    specialty: 'Dermatology',
    department: 'Skin Clinic',
    slotDate: '22 Jul 2026',
    slotTime: '11:15 AM',
    status: 'Scheduled',
  },
];

export default function PatientAppointmentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<Specialty>('All');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>(SEED_APPOINTMENTS);
  const [actionNote, setActionNote] = useState<string | null>(null);

  const filteredSlots = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return AVAILABLE_SLOTS.filter((slot) => {
      const matchesSpecialty =
        specialtyFilter === 'All' || slot.specialty === specialtyFilter;
      const matchesSearch =
        !query ||
        slot.doctorName.toLowerCase().includes(query) ||
        slot.specialty.toLowerCase().includes(query) ||
        slot.department.toLowerCase().includes(query) ||
        slot.dateLabel.toLowerCase().includes(query) ||
        slot.timeLabel.toLowerCase().includes(query);
      return matchesSpecialty && matchesSearch;
    });
  }, [searchQuery, specialtyFilter]);

  const selectedSlot = useMemo(
    () => AVAILABLE_SLOTS.find((slot) => slot.id === selectedSlotId) ?? null,
    [selectedSlotId],
  );

  const showActionNote = useCallback((message: string) => {
    setActionNote(message);
    window.setTimeout(() => setActionNote(null), 3500);
  }, []);

  const handleConfirmAppointment = useCallback(() => {
    if (!selectedSlot) {
      showActionNote('Select an available time slot before confirming');
      return;
    }

    const newAppointment: UpcomingAppointment = {
      id: `apt-${Date.now()}`,
      doctorName: selectedSlot.doctorName,
      specialty: selectedSlot.specialty,
      department: selectedSlot.department.split(' · ')[0] ?? selectedSlot.department,
      slotDate: `${selectedSlot.dateLabel.replace(' · ', ' ')} 2026`,
      slotTime: selectedSlot.timeLabel,
      status: 'Confirmed',
    };

    setAppointments((prev) => [newAppointment, ...prev]);
    setSelectedSlotId(null);
    showActionNote(
      `Appointment confirmed · ${selectedSlot.doctorName} · ${selectedSlot.dateLabel} · ${selectedSlot.timeLabel}`,
    );
  }, [selectedSlot, showActionNote]);

  const handleReschedule = useCallback(
    (id: string) => {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === id ? { ...apt, status: 'Rescheduled' as const } : apt,
        ),
      );
      showActionNote('Appointment marked for reschedule · select a new slot below');
    },
    [showActionNote],
  );

  const handleCancel = useCallback(
    (id: string) => {
      setAppointments((prev) => prev.filter((apt) => apt.id !== id));
      showActionNote('Appointment cancelled · removed from active ledger');
    },
    [showActionNote],
  );

  const handleViewSummary = useCallback((entry: VisitHistoryEntry) => {
    showActionNote(`Visit summary document · ${entry.date} · ${entry.doctorName} · sandbox preview`);
  }, [showActionNote]);

  return (
    <div className="min-h-screen w-full space-y-6 bg-patient-canvas p-6 font-sans text-patient-charcoal">
      {/* Logistical hub header */}
      <header>
        <h1 className="text-2xl font-black text-patient-plum">
          Consultation Booking &amp; Encounter Ledger
        </h1>
        <p className="mt-1 text-sm font-medium text-patient-lavender">
          Active medical appointment operations · live queue tracking · slot booking · encounter
          archive · 14 Jul 2026
        </p>
      </header>

      {actionNote ? (
        <p className="rounded-xl border border-patient-lavender/30 bg-patient-card px-4 py-2 text-sm font-bold text-patient-primary">
          {actionNote}
        </p>
      ) : null}

      {/* Top highlight bar — live queue tracker */}
      {QUEUE_STATUS.isActiveToday ? (
        <section
          aria-label="Live queue tracker"
          className="flex flex-col gap-4 rounded-xl border border-patient-lavender/30 border-l-4 border-l-[#572E54] bg-gradient-to-r from-white to-patient-lavender/10 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-patient-lavender/30 bg-patient-card p-2.5 text-patient-primary">
              <Timer className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-patient-plum">
                Live Queue · {QUEUE_STATUS.department}
              </p>
              <p className="mt-0.5 text-sm font-medium text-patient-lavender">
                Today&apos;s OPD token stream active
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-patient-lavender">
                Current Token
              </p>
              <p className="text-xl font-black tabular-nums text-patient-primary">
                {QUEUE_STATUS.currentToken}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-patient-lavender">
                Your Token
              </p>
              <p className="text-xl font-black tabular-nums text-patient-plum">
                {QUEUE_STATUS.yourToken}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-patient-lavender">
                Est. Wait Time
              </p>
              <p className="text-xl font-black tabular-nums text-patient-plum">
                {QUEUE_STATUS.estimatedWaitMins}
                <span className="text-sm font-medium text-patient-lavender"> mins</span>
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Main grid layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,60fr)_minmax(0,40fr)]">
        {/* Left column — active scheduling (60%) */}
        <div className="space-y-6">
          {/* Book appointment module */}
          <section aria-label="Book appointment" className={PANEL_CLASS}>
            <div className="mb-5 flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-lg font-black text-patient-plum">Book Appointment</h2>
            </div>

            <div className="relative mb-4">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search physicians or specialties…"
                aria-label="Search physicians or specialties"
                className="w-full rounded-xl border border-patient-lavender/30 bg-white py-2.5 pl-10 pr-4 text-sm font-medium focus:border-patient-lavender/30 focus:outline-none focus:ring-2 focus:ring-[#572E54]/20"
              />
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {SPECIALTY_FILTERS.map((specialty) => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => setSpecialtyFilter(specialty)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                    specialtyFilter === specialty
                      ? 'bg-patient-primary text-white shadow-sm'
                      : 'bg-patient-card text-patient-primary hover:bg-patient-lavender/25'
                  }`}
                >
                  {specialty}
                </button>
              ))}
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-patient-lavender">
              Open slots · {filteredSlots.length} available
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSlots.map((slot) => {
                const selected = selectedSlotId === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`rounded-xl border px-3 py-3 text-left transition-all ${
                      selected
                        ? 'border-patient-primary bg-patient-primary text-white shadow-sm'
                        : 'border-patient-lavender/30 bg-patient-card text-patient-primary hover:bg-patient-lavender/25'
                    }`}
                  >
                    <p className="text-xs font-black">{slot.dateLabel}</p>
                    <p className={`mt-0.5 text-sm font-black ${selected ? 'text-white' : ''}`}>
                      {slot.timeLabel}
                    </p>
                    <p className={`mt-1 text-[11px] font-bold ${selected ? 'text-white/90' : 'text-patient-charcoal'}`}>
                      {slot.doctorName}
                    </p>
                    <p className={`mt-0.5 text-[10px] ${selected ? 'text-white/80' : 'text-patient-lavender'}`}>
                      {slot.specialty}
                    </p>
                  </button>
                );
              })}
            </div>

            {filteredSlots.length === 0 ? (
              <p className="mt-4 text-sm font-medium text-patient-lavender">
                No slots match your filters.
              </p>
            ) : null}

            {selectedSlot ? (
              <div className="mt-4 rounded-xl border border-patient-lavender/30 bg-patient-card p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-patient-plum">
                  Selected slot
                </p>
                <p className="mt-1 text-sm font-black text-patient-charcoal">
                  {selectedSlot.doctorName} · {selectedSlot.specialty}
                </p>
                <p className="text-xs font-medium text-patient-lavender">
                  {selectedSlot.dateLabel} · {selectedSlot.timeLabel} · {selectedSlot.department}
                </p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleConfirmAppointment}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-patient-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-patient-plum sm:w-auto"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Confirm Appointment
            </button>
          </section>

          {/* Upcoming appointments list */}
          <section aria-label="Upcoming appointments" className={PANEL_CLASS}>
            <div className="mb-5 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-lg font-black text-patient-plum">Upcoming Appointments</h2>
            </div>

            <ul className="space-y-3">
              {appointments.length === 0 ? (
                <li className="rounded-xl border border-dashed border-patient-lavender/30 px-4 py-8 text-center text-sm font-medium text-patient-lavender">
                  No upcoming appointments scheduled.
                </li>
              ) : (
                appointments.map((apt) => (
                  <li
                    key={apt.id}
                    className="rounded-xl border border-patient-lavender/30 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-patient-charcoal">{apt.doctorName}</p>
                        <p className="mt-0.5 text-xs font-bold text-patient-primary">{apt.specialty}</p>
                      </div>
                      <span className="inline-flex shrink-0 rounded-full border border-patient-lavender/30 bg-patient-card px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-patient-primary">
                        {apt.status}
                      </span>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <dt className="font-bold text-patient-lavender">Date</dt>
                        <dd className="font-black text-patient-plum">{apt.slotDate}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-patient-lavender">Time</dt>
                        <dd className="font-black text-patient-primary">{apt.slotTime}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="font-bold text-patient-lavender">Department</dt>
                        <dd className="font-bold text-patient-text">{apt.department}</dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex gap-4 border-t border-patient-lavender/30 pt-3">
                      <button
                        type="button"
                        onClick={() => handleReschedule(apt.id)}
                        className="text-xs font-bold text-patient-primary hover:underline"
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(apt.id)}
                        className="text-xs font-bold text-rose-600 hover:underline"
                      >
                        Cancel Appointment
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        {/* Right column — historical log (40%) */}
        <aside className="space-y-6">
          {/* Doctor availability engine */}
          <section aria-label="Doctor availability" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-base font-black text-patient-plum">Doctor Availability</h2>
            </div>
            <ul className="space-y-2">
              {PHYSICIANS.map((physician) => (
                <li
                  key={physician.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-patient-lavender/30 bg-patient-lavender/10/50 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-patient-charcoal">{physician.name}</p>
                    <p className="text-[10px] font-medium text-patient-lavender">{physician.specialty}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        physician.isAvailable
                          ? 'bg-patient-card text-patient-primary'
                          : 'bg-slate-200/80 text-patient-lavender'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          physician.isAvailable ? 'bg-patient-primary' : 'bg-slate-400'
                        }`}
                        aria-hidden
                      />
                      {physician.isAvailable ? 'Available' : 'Busy'}
                    </span>
                    <span className="text-[10px] font-bold text-patient-primary">{physician.nextSlot}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Visit & appointment history */}
          <section aria-label="Visit history" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-base font-black text-patient-plum">Visit &amp; Appointment History</h2>
            </div>
            <ol className="relative space-y-4 border-l-2 border-patient-lavender/30 pl-5">
              {VISIT_HISTORY.map((entry) => (
                <li key={entry.id} className="relative">
                  <span
                    className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-patient-primary"
                    aria-hidden
                  />
                  <div className="rounded-xl border border-patient-lavender/30 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-black text-patient-plum">{entry.date}</p>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          entry.completionStatus === 'Completed'
                            ? 'bg-patient-card text-patient-primary'
                            : 'bg-amber-500/10 text-amber-800'
                        }`}
                      >
                        {entry.completionStatus}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-black text-patient-charcoal">{entry.doctorName}</p>
                    <p className="text-xs font-bold text-patient-primary">{entry.specialty}</p>
                    <p className="mt-2 text-xs font-medium leading-relaxed text-patient-charcoal">
                      {entry.diagnosisSummary}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleViewSummary(entry)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-patient-primary hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" aria-hidden />
                      View Visit Summary Document
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
