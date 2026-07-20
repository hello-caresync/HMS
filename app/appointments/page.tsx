'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  CalendarClock,
  CalendarDays,
  LayoutList,
  Search,
  Trash2,
} from 'lucide-react';

type ChannelType = 'Online' | 'Walk-in' | 'Emergency';

type BookingStatus =
  | 'Scheduled'
  | 'Checked In'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

type ViewMode = 'queue' | 'calendar';

type ChannelFilter = 'All' | ChannelType;

type AppointmentRecord = {
  id: string;
  tokenId: string;
  patientName: string;
  channelType: ChannelType;
  slotDetails: string;
  slotTime: string;
  status: BookingStatus;
};

const CHANNEL_DESCRIPTION =
  'Isolated scheduling ledger · Online teleconsult · Walk-in desk · Emergency intake · sandbox initials only · 13 Jul 2026';

const CALENDAR_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
] as const;

const SEED_APPOINTMENTS: AppointmentRecord[] = [
  {
    id: 'apt-001',
    tokenId: 'CAR-014',
    patientName: 'R.S.',
    channelType: 'Online',
    slotDetails: '09:00 · Cardiology · Cabin C-12',
    slotTime: '09:00',
    status: 'Completed',
  },
  {
    id: 'apt-002',
    tokenId: 'GEN-031',
    patientName: 'P.N.',
    channelType: 'Walk-in',
    slotDetails: '09:30 · General Medicine · OPD-A',
    slotTime: '09:30',
    status: 'Checked In',
  },
  {
    id: 'apt-003',
    tokenId: 'EMR-007',
    patientName: 'K.V.',
    channelType: 'Emergency',
    slotDetails: '09:45 · Emergency · Trauma Bay',
    slotTime: '09:45',
    status: 'In Progress',
  },
  {
    id: 'apt-004',
    tokenId: 'ORT-022',
    patientName: 'M.J.',
    channelType: 'Online',
    slotDetails: '10:00 · Orthopedics · Cabin O-04',
    slotTime: '10:00',
    status: 'Scheduled',
  },
  {
    id: 'apt-005',
    tokenId: 'PED-018',
    patientName: 'A.D.',
    channelType: 'Walk-in',
    slotDetails: '10:15 · Pediatrics · Cabin P-07',
    slotTime: '10:15',
    status: 'Scheduled',
  },
  {
    id: 'apt-006',
    tokenId: 'CAR-015',
    patientName: 'L.I.',
    channelType: 'Online',
    slotDetails: '10:30 · Cardiology · Cabin C-12',
    slotTime: '10:30',
    status: 'Checked In',
  },
  {
    id: 'apt-007',
    tokenId: 'EMR-008',
    patientName: 'Unknown Male',
    channelType: 'Emergency',
    slotDetails: '10:45 · Emergency · Resuscitation',
    slotTime: '10:45',
    status: 'In Progress',
  },
  {
    id: 'apt-008',
    tokenId: 'GEN-032',
    patientName: 'S.G.',
    channelType: 'Walk-in',
    slotDetails: '11:00 · General Medicine · OPD-A',
    slotTime: '11:00',
    status: 'Scheduled',
  },
];

const CHANNEL_FILTERS: ChannelFilter[] = ['All', 'Online', 'Walk-in', 'Emergency'];

const CHANNEL_FILTER_LABELS: Record<ChannelFilter, string> = {
  All: 'All Bookings',
  Online: 'Online Appointments',
  'Walk-in': 'Walk-in Patients',
  Emergency: 'Emergency Requests',
};

const CHANNEL_TAG_STYLES: Record<ChannelType, string> = {
  Online: 'bg-blue-50 text-blue-900 border border-blue-200',
  'Walk-in': 'bg-slate-100 text-slate-900 border border-slate-300',
  Emergency: 'bg-rose-500/10 text-rose-700 border border-rose-500/20 font-black',
};

const STATUS_STYLES: Record<BookingStatus, string> = {
  Scheduled: 'bg-slate-100 text-slate-950 border border-slate-400 font-bold',
  'Checked In': 'bg-[#00A481]/10 text-[#00A481] border border-[#00A481]/20 font-bold',
  'In Progress': 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
  Completed: 'bg-[#00A481]/10 text-[#00A481] border border-[#00A481]/20 font-bold',
  Cancelled: 'bg-rose-500/10 text-rose-700 border border-rose-500/20 font-bold',
};

function slotHourKey(slotTime: string): string {
  const hour = slotTime.split(':')[0];
  return `${hour.padStart(2, '0')}:00`;
}

export default function StandaloneAppointmentManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('queue');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('All');
  const [appointments, setAppointments] = useState<AppointmentRecord[]>(SEED_APPOINTMENTS);
  const [actionNote, setActionNote] = useState<string | null>(null);

  const filteredAppointments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return appointments.filter((row) => {
      const matchesChannel =
        channelFilter === 'All' || row.channelType === channelFilter;
      const matchesSearch =
        !query ||
        row.patientName.toLowerCase().includes(query) ||
        row.tokenId.toLowerCase().includes(query) ||
        row.slotDetails.toLowerCase().includes(query);
      return matchesChannel && matchesSearch && row.status !== 'Cancelled';
    });
  }, [appointments, channelFilter, searchQuery]);

  const calendarGrouped = useMemo(() => {
    const groups = new Map<string, AppointmentRecord[]>();
    for (const slot of CALENDAR_SLOTS) {
      groups.set(slot, []);
    }
    for (const row of filteredAppointments) {
      const key = slotHourKey(row.slotTime);
      const bucket = groups.get(key);
      if (bucket) bucket.push(row);
    }
    return groups;
  }, [filteredAppointments]);

  const showActionNote = useCallback((message: string) => {
    setActionNote(message);
    window.setTimeout(() => setActionNote(null), 4000);
  }, []);

  const handleReschedule = useCallback(
    (row: AppointmentRecord) => {
      showActionNote(
        `Reschedule Appointment queued · ${row.tokenId} · ${row.patientName} · isolated sandbox only`,
      );
    },
    [showActionNote],
  );

  const handleCancel = useCallback(
    (id: string) => {
      setAppointments((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, status: 'Cancelled' as const } : row,
        ),
      );
      const row = appointments.find((item) => item.id === id);
      showActionNote(
        `Cancel Appointment · ${row?.tokenId ?? id} · removed from active ledger`,
      );
    },
    [appointments, showActionNote],
  );

  return (
    <div className="min-h-screen w-full font-sans text-slate-950 selection:bg-slate-200">
      <div className="w-full space-y-5 p-4 sm:p-6 lg:p-8">
        {/* Management header */}
        <header className="flex w-full flex-col gap-4 border-b-2 border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Appointment Management Engine
            </h1>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-800">
              {CHANNEL_DESCRIPTION}
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 shadow-sm">
            <CalendarClock className="h-4 w-4 text-emerald-700" aria-hidden />
            <span>SCHEDULER_CORE_ONLINE</span>
          </div>
        </header>

        {/* View mode toggle */}
        <div className="flex w-full flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewMode('queue')}
            className={`inline-flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-bold transition-colors ${
              viewMode === 'queue'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-950 hover:bg-slate-50'
            }`}
          >
            <LayoutList className="h-4 w-4" aria-hidden />
            Queue List View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`inline-flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-bold transition-colors ${
              viewMode === 'calendar'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-950 hover:bg-slate-50'
            }`}
          >
            <CalendarDays className="h-4 w-4" aria-hidden />
            Calendar View
          </button>
        </div>

        {/* Search & channel filters */}
        <section
          aria-label="Patient search and channel filters"
          className="w-full space-y-3 rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 shadow-sm sm:p-5"
        >
          <div className="relative w-full">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-800"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Filter scheduling ledger by patient name, token ID, or slot details…"
              aria-label="Filter appointments by patient name"
              className="w-full rounded-lg border-2 border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-bold text-slate-950 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex w-full flex-wrap gap-2">
            {CHANNEL_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setChannelFilter(filter)}
                className={`rounded-lg border-2 px-3 py-1.5 text-xs font-black uppercase tracking-wide transition-colors ${
                  channelFilter === filter
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-950 hover:bg-slate-50'
                }`}
              >
                {CHANNEL_FILTER_LABELS[filter]}
              </button>
            ))}
          </div>

          <p className="text-xs font-bold text-slate-800">
            Showing {filteredAppointments.length} active booking
            {filteredAppointments.length === 1 ? '' : 's'}
          </p>
        </section>

        {actionNote && (
          <p
            role="status"
            className="w-full rounded-lg border-2 border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-950"
          >
            {actionNote}
          </p>
        )}

        {/* Queue list view */}
        {viewMode === 'queue' && (
          <section
            aria-label="Consultation queue table"
            className="w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-100">
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                      Token ID
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                      Patient Name
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                      Channel Type
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                      Slot / Time Details
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-950">
                      Current Booking Status
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-950">
                      Quick Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-sm font-bold text-slate-800"
                      >
                        No appointments match the current search or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((row, index) => (
                      <tr
                        key={row.id}
                        className={`border-b-2 border-slate-200 transition-colors hover:bg-slate-50 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                        } ${row.channelType === 'Emergency' ? 'bg-rose-500/10 ring-1 ring-inset ring-rose-500/20' : ''}`}
                      >
                        <td className="px-4 py-3.5 font-mono text-xs font-black text-slate-950">
                          {row.tokenId}
                        </td>
                        <td className="px-4 py-3.5 font-black text-slate-950">{row.patientName}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-[10px] uppercase ${CHANNEL_TAG_STYLES[row.channelType]}`}
                          >
                            {row.channelType}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-950">{row.slotDetails}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-[10px] uppercase ${STATUS_STYLES[row.status]}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleReschedule(row)}
                              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase text-slate-950 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                              aria-label={`Reschedule Appointment for ${row.tokenId}`}
                            >
                              <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                              Reschedule Appointment
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancel(row.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-rose-200 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase text-rose-950 transition-colors hover:border-rose-400 hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                              aria-label={`Cancel Appointment for ${row.tokenId}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              Cancel Appointment
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Calendar grid placeholder */}
        {viewMode === 'calendar' && (
          <section
            aria-label="Calendar view grid"
            className="w-full rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 shadow-sm sm:p-5"
          >
            <div className="mb-4">
              <h2 className="text-lg font-black text-slate-950">Calendar View</h2>
              <p className="text-xs font-medium text-slate-800">
                Grid-based hourly layout · filtered by search and channel tags
              </p>
            </div>

            <div className="grid w-full gap-3">
              {CALENDAR_SLOTS.map((slot) => {
                const entries = calendarGrouped.get(slot) ?? [];
                return (
                  <div
                    key={slot}
                    className="grid w-full grid-cols-1 gap-3 border-b-2 border-slate-200 pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[72px_minmax(0,1fr)]"
                  >
                    <div className="flex items-start pt-1">
                      <span className="font-mono text-sm font-black text-slate-950">{slot}</span>
                    </div>
                    <div className="grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {entries.length === 0 ? (
                        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs font-bold text-slate-800">
                          Open slot · no bookings scheduled
                        </div>
                      ) : (
                        entries.map((row) => (
                          <article
                            key={row.id}
                            className={`rounded-lg border bg-white p-3 shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] ${
                              row.channelType === 'Emergency'
                                ? 'border-rose-500/20 bg-rose-500/10 ring-1 ring-rose-500/20'
                                : 'border-slate-200/80'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-mono text-xs font-black text-slate-950">
                                {row.tokenId}
                              </p>
                              <span
                                className={`inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[9px] uppercase ${CHANNEL_TAG_STYLES[row.channelType]}`}
                              >
                                {row.channelType}
                              </span>
                            </div>
                            <p className="mt-1 text-sm font-black text-slate-950">
                              {row.patientName}
                            </p>
                            <p className="mt-0.5 text-xs font-bold text-slate-800">
                              {row.slotDetails}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] uppercase ${STATUS_STYLES[row.status]}`}
                              >
                                {row.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleReschedule(row)}
                                className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-0.5 text-[9px] font-black uppercase text-slate-950 hover:bg-slate-50"
                              >
                                <CalendarClock className="h-3 w-3" aria-hidden />
                                Reschedule
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancel(row.id)}
                                className="inline-flex items-center gap-1 rounded border border-rose-200 px-2 py-0.5 text-[9px] font-black uppercase text-rose-950 hover:bg-rose-50"
                              >
                                <Trash2 className="h-3 w-3" aria-hidden />
                                Cancel
                              </button>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
