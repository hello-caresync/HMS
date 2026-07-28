'use client';

import { useMemo, useState } from 'react';

import { useCalendarEvents } from '@/lib/doctor/hooks/useClinicalQueries';
import { sageUi } from '@/lib/doctor/ui-tokens';

const GRID_START_HOUR = 7;
const GRID_END_HOUR = 20;
const HOUR_HEIGHT = 64;

type ViewMode = 'day' | 'week' | 'month';
type DutyStatus = 'clinic' | 'ot' | 'off';

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
};

type ParsedEvent = CalendarEvent & {
  startMinutes: number;
  endMinutes: number;
  dayKey: string;
  top: number;
  height: number;
  column: number;
  totalColumns: number;
};

function parseTime(iso: string) {
  const d = new Date(iso);
  return { hour: d.getHours(), minute: d.getMinutes(), date: d };
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function toMinutes(iso: string) {
  const { hour, minute } = parseTime(iso);
  return hour * 60 + minute;
}

function computeTop(startMinutes: number) {
  const hour = Math.floor(startMinutes / 60);
  const minute = startMinutes % 60;
  return (hour - GRID_START_HOUR) * HOUR_HEIGHT + (minute / 60) * HOUR_HEIGHT;
}

function computeHeight(startMinutes: number, endMinutes: number) {
  const duration = Math.max(15, endMinutes - startMinutes);
  return (duration / 60) * HOUR_HEIGHT;
}

function assignConcurrentColumns(events: Array<{ id: string; startMinutes: number; endMinutes: number }>) {
  const sorted = [...events].sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);
  const layout = new Map<string, { column: number; totalColumns: number }>();

  let cluster: typeof sorted = [];
  let clusterEnd = -1;

  const flushCluster = () => {
    if (!cluster.length) return;
    const columns: number[] = [];
    let maxCols = 1;

    for (const ev of cluster) {
      let col = columns.findIndex((end) => end <= ev.startMinutes);
      if (col === -1) {
        col = columns.length;
        columns.push(ev.endMinutes);
      } else {
        columns[col] = ev.endMinutes;
      }
      maxCols = Math.max(maxCols, columns.length);
      layout.set(ev.id, { column: col, totalColumns: maxCols });
    }

    for (const ev of cluster) {
      const entry = layout.get(ev.id);
      if (entry) entry.totalColumns = maxCols;
    }
    cluster = [];
    clusterEnd = -1;
  };

  for (const ev of sorted) {
    if (cluster.length === 0 || ev.startMinutes < clusterEnd) {
      cluster.push(ev);
      clusterEnd = Math.max(clusterEnd, ev.endMinutes);
    } else {
      flushCluster();
      cluster.push(ev);
      clusterEnd = ev.endMinutes;
    }
  }
  flushCluster();

  return layout;
}

function layoutDayEvents(events: CalendarEvent[]): ParsedEvent[] {
  const parsed = events.map((e) => {
    const startMinutes = toMinutes(e.start);
    const endMinutes = Math.max(startMinutes + 15, toMinutes(e.end));
    return {
      ...e,
      startMinutes,
      endMinutes,
      dayKey: dayKey(e.start),
      top: computeTop(startMinutes),
      height: computeHeight(startMinutes, endMinutes),
      column: 0,
      totalColumns: 1,
    };
  });

  const byDay = new Map<string, typeof parsed>();
  for (const ev of parsed) {
    const list = byDay.get(ev.dayKey) ?? [];
    list.push(ev);
    byDay.set(ev.dayKey, list);
  }

  const result: ParsedEvent[] = [];
  for (const dayEvents of byDay.values()) {
    const columns = assignConcurrentColumns(dayEvents);
    for (const ev of dayEvents) {
      const col = columns.get(ev.id) ?? { column: 0, totalColumns: 1 };
      result.push({ ...ev, column: col.column, totalColumns: col.totalColumns });
    }
  }

  return result;
}

function weekDays(reference = new Date()) {
  const start = new Date(reference);
  start.setDate(start.getDate() - start.getDay() + 1);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function DoctorOsScheduleGrid() {
  const [view, setView] = useState<ViewMode>('week');
  const [duty, setDuty] = useState<DutyStatus>('clinic');
  const { data } = useCalendarEvents();
  const events = (data?.events ?? []) as CalendarEvent[];

  const gridHeight = (GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT;
  const hours = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i);
  const days = weekDays();

  const laidOut = useMemo(() => layoutDayEvents(events), [events]);

  const visibleEvents = useMemo(() => {
    if (view === 'month') return events.slice(0, 12);
    if (view === 'day') {
      const today = dayKey(new Date().toISOString());
      return laidOut.filter((e) => e.dayKey === today);
    }
    return laidOut;
  }, [events, laidOut, view]);

  const weekColumns = view === 'week' ? days : [new Date()];

  return (
    <div className="doctor-page">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-primary">Clinical Schedule</p>
          <h1 className="text-xl font-black">My Schedule</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className={`${sageUi.chip} flex gap-1 p-0.5`}>
            {(['day', 'week', 'month'] as ViewMode[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold capitalize ${view === v ? sageUi.segmentActive : sageUi.segmentIdle}`}
              >
                {v}
              </button>
            ))}
          </div>
          <select
            className={sageUi.input + ' w-auto text-xs'}
            value={duty}
            onChange={(e) => setDuty(e.target.value as DutyStatus)}
          >
            <option value="clinic">🟢 Active in Clinic</option>
            <option value="ot">🔴 In OT</option>
            <option value="off">⚪ Off Duty</option>
          </select>
        </div>
      </header>

      {view === 'month' ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {visibleEvents.map((e) => (
            <div key={e.id} className="doctor-card text-sm">
              <p className="line-clamp-1 overflow-hidden font-bold">{e.title}</p>
              <p className="text-xs text-[#5A584A]">{new Date(e.start).toLocaleString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="doctor-card overflow-x-auto">
          <div className="relative flex min-w-[640px]" style={{ minHeight: gridHeight }}>
            <div className="w-12 shrink-0 border-r border-brand-light pt-1 text-[10px] text-[#5A584A]">
              {hours.map((h) => (
                <div key={h} style={{ height: HOUR_HEIGHT }} className="pr-1 text-right">
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {weekColumns.map((day) => {
              const key = dayKey(day.toISOString());
              const dayEvents = visibleEvents.filter((e) => e.dayKey === key);
              return (
                <div key={key} className="relative flex-1 border-r border-brand-light/60 last:border-r-0">
                  {view === 'week' && (
                    <div className="sticky top-0 z-10 border-b border-brand-light bg-white px-2 py-1 text-center text-[10px] font-bold uppercase text-[#5A584A]">
                      {day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                  )}
                  <div className="relative" style={{ height: gridHeight }}>
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-brand-light/60"
                        style={{ top: (h - GRID_START_HOUR) * HOUR_HEIGHT }}
                      />
                    ))}
                    {dayEvents.map((e) => {
                      if (e.top < 0 || e.top > gridHeight) return null;
                      const widthPct = 100 / e.totalColumns;
                      const leftPct = e.column * widthPct;
                      return (
                        <div
                          key={e.id}
                          className="absolute overflow-hidden rounded-lg border border-brand-primary/40 bg-brand-light p-2 text-[11px] font-semibold text-brand-text shadow-sm flex flex-col justify-between"
                          style={{
                            top: e.top,
                            height: Math.max(e.height, 28),
                            width: `${widthPct}%`,
                            left: `${leftPct}%`,
                          }}
                        >
                          <p className="line-clamp-1 overflow-hidden">{e.title}</p>
                          {e.height >= 36 && (
                            <p className="line-clamp-1 overflow-hidden text-[10px] font-normal text-[#5A584A]">
                              {e.location ?? new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-[#5A584A]">
        Status: {duty === 'clinic' ? 'Accepting OPD' : duty === 'ot' ? 'In operating theatre' : 'Off duty'} · {events.length} blocks · concurrent events auto-stacked
      </p>
    </div>
  );
}
