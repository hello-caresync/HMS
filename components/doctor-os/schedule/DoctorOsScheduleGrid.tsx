'use client';

import { useMemo, useState } from 'react';

import { useCalendarEvents } from '@/lib/doctor/hooks/useClinicalQueries';
import { sageUi } from '@/lib/doctor/ui-tokens';

const GRID_START_HOUR = 7;
const GRID_END_HOUR = 20;
const HOUR_PX = 64;

type ViewMode = 'day' | 'week' | 'month';
type DutyStatus = 'clinic' | 'ot' | 'off';

function parseTime(iso: string) {
  const d = new Date(iso);
  return { hour: d.getHours(), minute: d.getMinutes(), date: d };
}

function eventLayout(startIso: string, endIso: string) {
  const start = parseTime(startIso);
  const end = parseTime(endIso);
  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;
  const duration = Math.max(15, endMinutes - startMinutes);
  const top = (start.hour - GRID_START_HOUR) * HOUR_PX + (start.minute / 60) * HOUR_PX;
  const height = (duration / 60) * HOUR_PX;
  return { top, height };
}

export default function DoctorOsScheduleGrid() {
  const [view, setView] = useState<ViewMode>('week');
  const [duty, setDuty] = useState<DutyStatus>('clinic');
  const { data } = useCalendarEvents();
  const events = data?.events ?? [];

  const gridHeight = (GRID_END_HOUR - GRID_START_HOUR) * HOUR_PX;
  const hours = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i);

  const visibleEvents = useMemo(() => {
    if (view === 'month') return events.slice(0, 12);
    return events;
  }, [events, view]);

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
              <p className="overflow-hidden line-clamp-1 font-bold">{e.title}</p>
              <p className="text-xs text-[#5A584A]">{new Date(e.start).toLocaleString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="doctor-card overflow-hidden">
          <div className="relative flex" style={{ minHeight: gridHeight }}>
            <div className="w-12 shrink-0 border-r border-brand-light pt-1 text-[10px] text-[#5A584A]">
              {hours.map((h) => (
                <div key={h} style={{ height: HOUR_PX }} className="pr-1 text-right">
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>
            <div className="relative flex-1">
              {hours.map((h) => (
                <div key={h} className="absolute left-0 right-0 border-t border-brand-light/60" style={{ top: (h - GRID_START_HOUR) * HOUR_PX }} />
              ))}
              {visibleEvents.map((e) => {
                const { top, height } = eventLayout(e.start, e.end);
                if (top < 0 || top > gridHeight) return null;
                return (
                  <div
                    key={e.id}
                    className="absolute left-1 right-1 overflow-hidden rounded-lg border border-brand-primary/40 bg-brand-light px-2 py-1 text-[11px] font-semibold text-brand-text shadow-sm"
                    style={{ top, height: Math.max(height, 28) }}
                  >
                    <p className="overflow-hidden line-clamp-1">{e.title}</p>
                    <p className="overflow-hidden line-clamp-1 text-[10px] font-normal text-[#5A584A]">{e.location}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-[#5A584A]">
        Status: {duty === 'clinic' ? 'Accepting OPD' : duty === 'ot' ? 'In operating theatre' : 'Off duty'} · {events.length} blocks loaded from database
      </p>
    </div>
  );
}
