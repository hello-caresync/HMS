'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  BarChart3,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListOrdered,
  Mail,
  MessageCircle,
  Search,
  Smartphone,
  UserRound,
  XCircle,
} from 'lucide-react';

import { HospitalToastBanner, useHospitalToast } from '../_components/HospitalFeedback';
import {
  completeAppointment,
  dbAppointmentToQueueEntry,
  deleteAppointment,
  fetchAppointments,
  insertAppointment,
  updateAppointment,
} from '../_lib/hospital-db.service';

type ViewMode = 'queue' | 'calendar' | 'analytics';

type AppointmentStatus = 'Confirmed' | 'In-Queue' | 'Waiting List' | 'Completed' | 'Cancelled';

type ReminderChannels = {
  sms: boolean;
  email: boolean;
  whatsapp: boolean;
};

type QueueEntry = {
  id: string;
  token: string;
  patientName: string;
  department: string;
  provider: string;
  scheduledTime: string;
  location: string;
  channels: ReminderChannels;
  status: AppointmentStatus;
};

type ProviderBlock = {
  id: string;
  provider: string;
  room: string;
  department: string;
  status: 'Available' | 'In Session' | 'Break';
  freeSlots: number;
};

type WaitingListEntry = {
  id: string;
  token: string;
  patientName: string;
  department: string;
  priority: 'Standard' | 'Urgent';
  eta: string;
};

type CalendarDay = {
  day: number;
  inMonth: boolean;
  load: 'none' | 'low' | 'medium' | 'high';
  isToday: boolean;
  appointmentCount: number;
};

const LOCATIONS = ['All Locations', 'Main Campus', 'Annex Block', 'Satellite Clinic A'] as const;

const VIEW_MODES: { id: ViewMode; label: string; icon: typeof ListOrdered }[] = [
  { id: 'queue', label: 'Queue Registry', icon: ListOrdered },
  { id: 'calendar', label: 'Calendar View', icon: CalendarDays },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const PROVIDER_BLOCKS: ProviderBlock[] = [
  {
    id: 'pb-001',
    provider: 'Dr. Mehta',
    room: 'OPD-A · Room 204',
    department: 'General Medicine',
    status: 'In Session',
    freeSlots: 3,
  },
  {
    id: 'pb-002',
    provider: 'Dr. Sharma',
    room: 'OPD-B · Room 112',
    department: 'Cardiology',
    status: 'Available',
    freeSlots: 5,
  },
  {
    id: 'pb-003',
    provider: 'Dr. Khan',
    room: 'Annex · Room 08',
    department: 'Orthopedics',
    status: 'In Session',
    freeSlots: 2,
  },
  {
    id: 'pb-004',
    provider: 'Dr. Iyer',
    room: 'Satellite · Bay 03',
    department: 'Pediatrics',
    status: 'Available',
    freeSlots: 4,
  },
];

const WAITING_LIST: WaitingListEntry[] = [
  {
    id: 'wl-001',
    token: 'WL-014',
    patientName: 'V.D.',
    department: 'Dermatology',
    priority: 'Standard',
    eta: '~25 min',
  },
  {
    id: 'wl-002',
    token: 'WL-015',
    patientName: 'K.S.',
    department: 'General Medicine',
    priority: 'Urgent',
    eta: '~12 min',
  },
  {
    id: 'wl-003',
    token: 'WL-016',
    patientName: 'T.A.',
    department: 'ENT',
    priority: 'Standard',
    eta: '~40 min',
  },
];

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  Confirmed: 'bg-[#5EC283]/20 text-[#00758C] border border-[#5EC283]/40 font-bold',
  'In-Queue': 'bg-[#008588]/10 text-[#008588] border border-[#008588]/25 font-bold',
  'Waiting List': 'bg-amber-50 text-amber-800 border border-amber-200 font-bold',
  Completed: 'bg-slate-100 text-slate-600 border border-slate-200 font-bold',
  Cancelled: 'bg-rose-50 text-rose-700 border border-rose-200 font-bold line-through',
};

const PROVIDER_STATUS_STYLES: Record<ProviderBlock['status'], string> = {
  Available: 'text-[#00A481]',
  'In Session': 'text-[#00758C]',
  Break: 'text-slate-500',
};

const LOAD_STYLES: Record<CalendarDay['load'], string> = {
  none: 'bg-white text-slate-400',
  low: 'bg-[#5EC283]/15 text-[#00758C] border-[#5EC283]/30',
  medium: 'bg-[#008588]/15 text-[#008588] border-[#008588]/30',
  high: 'bg-[#00758C]/15 text-[#00758C] border-[#00758C]/30',
};

const PRIMARY_BTN =
  'inline-flex items-center gap-2 rounded-xl bg-[#00758C] px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition-all hover:bg-[#008588] focus:outline-none focus:ring-2 focus:ring-[#008588]/30';

const SECONDARY_BTN =
  'inline-flex items-center gap-2 rounded-xl border border-[#00A481]/30 bg-[#00A481]/10 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-[#00758C] transition-all hover:bg-[#00A481]/20 focus:outline-none focus:ring-2 focus:ring-[#00A481]/20';

const TEXT_BTN =
  'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold text-[#00758C] transition-colors hover:bg-[#00758C]/5 hover:text-[#008588]';

function buildCalendarGrid(year: number, month: number): CalendarDay[] {
  const days: CalendarDay[] = [];
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  for (let i = 0; i < 42; i += 1) {
    const dayNum = i - startPad + 1;
    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const isToday = isCurrentMonth && dayNum === today.getDate();

    let load: CalendarDay['load'] = 'none';
    let appointmentCount = 0;

    if (inMonth) {
      const mod = dayNum % 7;
      if (mod === 0 || mod === 6) {
        load = 'low';
        appointmentCount = 12 + (dayNum % 5);
      } else if (isToday) {
        load = 'high';
        appointmentCount = 47;
      } else if (dayNum % 3 === 0) {
        load = 'medium';
        appointmentCount = 28 + (dayNum % 8);
      } else {
        load = 'low';
        appointmentCount = 15 + (dayNum % 6);
      }
    }

    days.push({ day: inMonth ? dayNum : 0, inMonth, load, isToday, appointmentCount });
  }

  return days;
}

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

function ReminderChannelIcons({ channels }: { channels: ReminderChannels }) {
  return (
    <div className="flex items-center gap-1.5">
      <Smartphone
        className={`h-3.5 w-3.5 ${channels.sms ? 'text-[#00A481]' : 'text-slate-300'}`}
        aria-label={channels.sms ? 'SMS reminder active' : 'SMS reminder inactive'}
      />
      <Mail
        className={`h-3.5 w-3.5 ${channels.email ? 'text-[#008588]' : 'text-slate-300'}`}
        aria-label={channels.email ? 'Email reminder active' : 'Email reminder inactive'}
      />
      <MessageCircle
        className={`h-3.5 w-3.5 ${channels.whatsapp ? 'text-[#00758C]' : 'text-slate-300'}`}
        aria-label={channels.whatsapp ? 'WhatsApp reminder active' : 'WhatsApp reminder inactive'}
      />
    </div>
  );
}

export default function AppointmentManagementPage() {
  const { toast, showSuccess, showError } = useHospitalToast();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>(LOCATIONS[0]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [calendarAnchor, setCalendarAnchor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [bookForm, setBookForm] = useState({
    patientName: '',
    department: 'General Medicine',
    provider: 'Dr. Mehta',
    time: '11:00 AM',
  });
  const [queueLoading, setQueueLoading] = useState(true);

  const loadQueueFromSupabase = useCallback(async () => {
    setQueueLoading(true);
    const { data, error } = await fetchAppointments();
    if (error) {
      showError(error);
      setQueue([]);
    } else {
      setQueue(data.map(dbAppointmentToQueueEntry));
    }
    setQueueLoading(false);
  }, [showError]);

  useEffect(() => {
    void loadQueueFromSupabase();
  }, [loadQueueFromSupabase]);

  const calendarGrid = useMemo(
    () => buildCalendarGrid(calendarAnchor.year, calendarAnchor.month),
    [calendarAnchor.year, calendarAnchor.month],
  );

  const filteredQueue = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return queue.filter((row) => {
      const locationMatch =
        selectedLocation === 'All Locations' || row.location === selectedLocation;
      if (!locationMatch) return false;
      if (!query) return true;
      return (
        row.token.toLowerCase().includes(query) ||
        row.patientName.toLowerCase().includes(query) ||
        row.provider.toLowerCase().includes(query) ||
        row.department.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, selectedLocation, queue]);

  const shiftCalendarMonth = (delta: number) => {
    setCalendarAnchor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const handleCancel = (id: string, token: string) => {
    startTransition(() => {
      void (async () => {
        const { error } = await deleteAppointment(id);
        if (error) {
          showError(error);
          return;
        }
        setQueue((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: 'Cancelled' as AppointmentStatus } : r)),
        );
        showSuccess(`Appointment ${token} cancelled.`);
      })();
    });
  };

  const handleComplete = (id: string, token: string) => {
    startTransition(() => {
      void (async () => {
        const { error } = await completeAppointment(id);
        if (error) {
          showError(error);
          return;
        }
        setQueue((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: 'Completed' as AppointmentStatus } : r)),
        );
        showSuccess(`${token} marked completed.`);
      })();
    });
  };

  const handleReschedule = (id: string, token: string) => {
    startTransition(() => {
      void (async () => {
        const { error } = await updateAppointment(id, { scheduled_time: '02:30 PM', status: 'Confirmed' });
        if (error) {
          showError(error);
          return;
        }
        setQueue((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, scheduledTime: '02:30 PM', status: 'Confirmed' as AppointmentStatus } : r,
          ),
        );
        showSuccess(`${token} rescheduled to 02:30 PM.`);
      })();
    });
  };

  const submitBookForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.patientName.trim()) {
      showError('Patient name is required.');
      return;
    }
    startTransition(() => {
      void (async () => {
        const token = `OPD-${110 + queue.length}`;
        const location = selectedLocation === 'All Locations' ? 'Main Campus' : selectedLocation;
        const { error } = await insertAppointment({
          token,
          patient_name: bookForm.patientName.trim(),
          department: bookForm.department,
          provider: bookForm.provider,
          scheduled_time: bookForm.time,
          location,
          status: 'Confirmed',
          channels: { sms: true, email: true, whatsapp: false },
        });
        if (error) {
          showError(error);
          return;
        }
        setBookModalOpen(false);
        setBookForm({ patientName: '', department: 'General Medicine', provider: 'Dr. Mehta', time: '11:00 AM' });
        showSuccess(`Booked ${token} for ${bookForm.patientName.trim()}.`);
        await loadQueueFromSupabase();
      })();
    });
  };

  const submitWalkIn = () => {
    startTransition(() => {
      void (async () => {
        const token = `WI-${20 + queue.length}`;
        const location = selectedLocation === 'All Locations' ? 'Main Campus' : selectedLocation;
        const { error } = await insertAppointment({
          token,
          patient_name: 'Walk-in',
          department: 'General Medicine',
          provider: 'Triage Desk',
          scheduled_time: 'Now',
          location,
          status: 'In-Queue',
          channels: { sms: false, email: false, whatsapp: false },
        });
        if (error) {
          showError(error);
          return;
        }
        setWalkInModalOpen(false);
        showSuccess(`Walk-in token ${token} issued.`);
        await loadQueueFromSupabase();
      })();
    });
  };

  return (
    <div className="w-full space-y-6 font-sans text-slate-900 antialiased">
      <HospitalToastBanner toast={toast} />
      {/* 1. High-density navigation segment head */}
      <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-md border border-[#00758C]/25 bg-[#00758C]/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#00758C]">
              Module 3
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Layer 3 · Scheduling Operations
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#00758C] sm:text-3xl">
            Appointment Management Terminal
          </h1>
          <p className="mt-1 max-w-3xl text-base font-medium text-slate-500">
            Multi-location queue registry · provider block allocation · calendar matrices · dispatch analytics
          </p>
        </div>

        <div
          className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200/80 bg-white p-1 shadow-sm"
          role="tablist"
          aria-label="Appointment view mode"
        >
          {VIEW_MODES.map((mode, idx) => {
            const Icon = mode.icon;
            const active = viewMode === mode.id;
            return (
              <button
                key={`view-${mode.id}-${idx}`}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setViewMode(mode.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-all ${
                  active
                    ? 'bg-[#00758C] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-[#00758C]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {mode.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* 2. Search & workflow control matrix bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Filter token, patient name, doctor..."
            aria-label="Filter appointment queue"
            className="w-full rounded-xl border border-slate-200/80 bg-slate-50/80 py-2.5 pl-10 pr-4 text-base font-medium text-slate-800 transition-all placeholder:text-slate-400 focus:border-[#008588] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008588]/20"
          />
        </div>

        <select
          value={selectedLocation}
          onChange={(event) => setSelectedLocation(event.target.value)}
          aria-label="Filter by location"
          className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 text-base font-medium text-slate-700 transition-all focus:border-[#008588] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008588]/20 lg:min-w-[200px]"
        >
          {LOCATIONS.map((location, idx) => (
            <option key={`loc-${location}-${idx}`} value={location}>
              {location}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <button type="button" className={SECONDARY_BTN} onClick={() => setWalkInModalOpen(true)}>
            <UserRound className="h-4 w-4" aria-hidden />
            Walk-in Intake
          </button>
          <button type="button" className={PRIMARY_BTN} onClick={() => setBookModalOpen(true)}>
            <CalendarPlus className="h-4 w-4" aria-hidden />
            Book Appointment
          </button>
        </div>
      </div>

      {/* 3. Three-mode segment interior workspace */}
      {viewMode === 'queue' ? (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* MODE A — Left 8-grid: Queue registry ledger */}
          <div className="xl:col-span-8">
            <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/50 px-5 py-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#00758C]">Queue Registry Ledger</h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {filteredQueue.length} active tokens · {queueLoading ? 'syncing…' : 'Supabase live'}
                  </p>
                </div>
                <span className="rounded-full border border-[#00A481]/30 bg-[#00A481]/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#00A481]">
                  Live
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-sm font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Token ID</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Department / Provider</th>
                      <th className="px-4 py-3">Scheduled Time</th>
                      <th className="px-4 py-3">Channels</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQueue.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-base font-medium text-slate-500">
                          No appointments match the current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredQueue.map((row, idx) => (
                        <tr key={`${row.token}-${idx}`} className="transition-colors hover:bg-slate-50/60">
                          <td className="px-4 py-2.5 font-mono text-base font-semibold text-[#008588]">{row.token}</td>
                          <td className="px-4 py-2.5 text-base font-semibold text-slate-900">{row.patientName}</td>
                          <td className="px-4 py-2.5">
                            <p className="text-base font-semibold text-slate-800">{row.department}</p>
                            <p className="text-sm text-slate-500">{row.provider}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="flex items-center gap-1 text-base font-semibold tabular-nums text-slate-700">
                              <Clock className="h-3 w-3 text-slate-400" aria-hidden />
                              {row.scheduledTime}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <ReminderChannelIcons channels={row.channels} />
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${STATUS_STYLES[row.status]}`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              <button type="button" disabled={isPending} className={TEXT_BTN} onClick={() => handleReschedule(row.id, row.token)}>
                                Reschedule
                              </button>
                              {row.status !== 'Completed' && row.status !== 'Cancelled' ? (
                                <button type="button" disabled={isPending} className={TEXT_BTN} onClick={() => handleComplete(row.id, row.token)}>
                                  Complete
                                </button>
                              ) : null}
                              {row.status !== 'Cancelled' && row.status !== 'Completed' ? (
                              <button
                                type="button"
                                disabled={isPending}
                                className={`${TEXT_BTN} text-rose-600 hover:bg-rose-50 hover:text-rose-700`}
                                onClick={() => handleCancel(row.id, row.token)}
                              >
                                <XCircle className="h-3 w-3" aria-hidden />
                                Cancel
                              </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* MODE A — Right 4-grid: Provider blocks + waiting list */}
          <div className="space-y-4 xl:col-span-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#008588]">Provider Scheduling Blocks</h2>
              <p className="mt-0.5 text-sm font-medium text-slate-500">Room status · live free slot telemetry</p>

              <ul className="mt-4 space-y-3">
                {PROVIDER_BLOCKS.map((block, idx) => (
                  <li
                    key={`${block.id}-${idx}`}
                    className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{block.provider}</p>
                        <p className="text-sm text-slate-500">{block.room}</p>
                        <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {block.department}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold uppercase ${PROVIDER_STATUS_STYLES[block.status]}`}>
                        {block.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Free Slots</span>
                      <span className="rounded-md bg-[#00758C]/10 px-2 py-0.5 font-mono text-xs font-semibold text-[#00758C]">
                        {block.freeSlots}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#00758C]">Active Waiting List Pipeline</h2>
              <p className="mt-0.5 text-sm font-medium text-slate-500">Priority-sorted overflow queue</p>

              <ul className="mt-4 space-y-2">
                {WAITING_LIST.map((entry, idx) => (
                  <li
                    key={`${entry.token}-${idx}`}
                    className="flex items-center justify-between rounded-lg border border-slate-200/60 bg-white px-3 py-2.5"
                  >
                    <div>
                      <p className="font-mono text-sm font-bold text-[#008588]">{entry.token}</p>
                      <p className="text-xs font-semibold text-slate-800">{entry.patientName}</p>
                      <p className="text-xs text-slate-500">{entry.department}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                          entry.priority === 'Urgent'
                            ? 'border border-rose-200 bg-rose-50 text-rose-700'
                            : 'border border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        {entry.priority}
                      </span>
                      <p className="mt-1 text-xs font-bold text-slate-400">ETA {entry.eta}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {viewMode === 'calendar' ? (
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#00758C]">Multi-Location Calendar Matrix</h2>
              <p className="mt-0.5 text-sm font-medium text-slate-500">
                {monthLabel(calendarAnchor.year, calendarAnchor.month)} ·{' '}
                {selectedLocation === 'All Locations' ? 'All campuses' : selectedLocation}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => shiftCalendarMonth(-1)}
                className="rounded-lg border border-slate-200/80 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#00758C]"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <span className="min-w-[120px] text-center text-xs font-semibold uppercase tracking-wider text-slate-700">
                {monthLabel(calendarAnchor.year, calendarAnchor.month)}
              </span>
              <button
                type="button"
                onClick={() => shiftCalendarMonth(1)}
                className="rounded-lg border border-slate-200/80 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#00758C]"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, idx) => (
              <div
                key={`dow-${label}-${idx}`}
                className="py-2 text-center text-sm font-semibold uppercase tracking-wider text-slate-400"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarGrid.map((cell, idx) => {
              if (!cell.inMonth) {
                return (
                  <div
                    key={`cal-empty-${idx}`}
                    className="min-h-[72px] rounded-lg border border-transparent bg-slate-50/40"
                    aria-hidden
                  />
                );
              }

              return (
                <div
                  key={`cal-day-${cell.day}-${idx}`}
                  className={`min-h-[72px] rounded-lg border p-2 transition-all ${LOAD_STYLES[cell.load]} ${
                    cell.isToday ? 'ring-2 ring-[#00758C] ring-offset-1' : 'border-slate-200/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`text-xs font-semibold ${cell.isToday ? 'text-[#00758C]' : 'text-slate-700'}`}
                    >
                      {cell.day}
                    </span>
                    {cell.isToday ? (
                      <span className="rounded bg-[#00758C] px-1 py-0.5 text-xs font-semibold uppercase text-white">
                        Today
                      </span>
                    ) : null}
                  </div>
                  {cell.appointmentCount > 0 ? (
                    <p className="mt-2 text-xs font-bold tabular-nums">{cell.appointmentCount} appts</p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Load Index</span>
            {(['low', 'medium', 'high'] as const).map((level, idx) => (
              <span key={`legend-${level}-${idx}`} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <span className={`h-3 w-3 rounded border ${LOAD_STYLES[level]}`} aria-hidden />
                {level === 'low' ? 'Light' : level === 'medium' ? 'Moderate' : 'Heavy'}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {viewMode === 'analytics' ? (
        <section className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Total dispatched bookings */}
            <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Dispatched Bookings</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-[#00758C]">1,284</p>
              <p className="mt-0.5 text-sm font-medium text-slate-500">Today · all locations combined</p>
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                  <span>Daily capacity utilization</span>
                  <span className="text-[#00A481]">78%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#00758C] via-[#008588] to-[#00A481]"
                    style={{ width: '78%' }}
                    role="progressbar"
                    aria-valuenow={78}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Daily capacity utilization"
                  />
                </div>
              </div>
            </article>

            {/* No-show / cancellation index */}
            <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">No-Show / Cancellation Index</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-amber-600">6.2%</p>
              <p className="mt-0.5 text-sm font-medium text-slate-500">Rolling 7-day facility average</p>
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                  <span>Threshold band (target &lt; 8%)</span>
                  <span className="text-[#00A481]">Within SLA</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                    style={{ width: '62%' }}
                    role="progressbar"
                    aria-valuenow={62}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="No-show cancellation index relative to threshold"
                  />
                </div>
              </div>
            </article>

            {/* Online vs walk-in */}
            <article className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Online vs. Walk-in Ratio</p>
              <div className="mt-3 flex items-end gap-4">
                <div>
                  <p className="text-2xl font-bold tabular-nums text-[#008588]">64%</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Online Bookings</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-[#5EC283]">36%</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Walk-in Intake</p>
                </div>
              </div>
              <div className="mt-4 flex h-3 overflow-hidden rounded-full">
                <div className="bg-[#008588]" style={{ width: '64%' }} aria-hidden />
                <div className="bg-[#5EC283]" style={{ width: '36%' }} aria-hidden />
              </div>
              <p className="mt-2 text-sm font-medium text-slate-500">822 online · 462 walk-in dispatches today</p>
            </article>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#00758C]">Location Dispatch Breakdown</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { location: 'Main Campus', count: 612, pct: 48 },
                { location: 'Annex Block', count: 384, pct: 30 },
                { location: 'Satellite Clinic A', count: 288, pct: 22 },
              ].map((row, idx) => (
                <div key={`loc-stat-${row.location}-${idx}`} className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{row.location}</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-[#00758C]">{row.count}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
                    <div
                      className="h-full rounded-full bg-[#008588]"
                      style={{ width: `${row.pct}%` }}
                      role="progressbar"
                      aria-valuenow={row.pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${row.location} dispatch share`}
                    />
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-500">{row.pct}% of total volume</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {bookModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close" onClick={() => setBookModalOpen(false)} />
          <form
            onSubmit={submitBookForm}
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h2 className="text-xl font-bold text-[#00758C]">Book appointment</h2>
            <div className="mt-4 space-y-3">
              <input
                required
                placeholder="Patient name"
                value={bookForm.patientName}
                onChange={(e) => setBookForm((f) => ({ ...f, patientName: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <select
                value={bookForm.department}
                onChange={(e) => setBookForm((f) => ({ ...f, department: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option>General Medicine</option>
                <option>Cardiology</option>
                <option>Orthopedics</option>
              </select>
              <input
                value={bookForm.time}
                onChange={(e) => setBookForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Time"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setBookModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-bold">
                Cancel
              </button>
              <button type="submit" disabled={isPending} className={PRIMARY_BTN}>
                Confirm booking
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {walkInModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close" onClick={() => setWalkInModalOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#00758C]">Walk-in intake</h2>
            <p className="mt-2 text-base text-slate-600">Issue a triage token and add to the live queue.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setWalkInModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-bold">
                Cancel
              </button>
              <button type="button" disabled={isPending} onClick={submitWalkIn} className={PRIMARY_BTN}>
                Issue token
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
