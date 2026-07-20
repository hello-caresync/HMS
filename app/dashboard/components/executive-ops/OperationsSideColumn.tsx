'use client';

import {
  Ambulance,
  CalendarClock,
  ClipboardList,
  LogIn,
  Receipt,
  Siren,
  UserPlus,
} from 'lucide-react';

import { formatEventTime } from '../../lib/executiveOperationsData';
import type { ExecutiveOperationsData } from '../../types/executiveOperations';
import { ExecutivePanel, MetricValue } from './executiveUi';

type OperationsSideColumnProps = {
  data: Pick<ExecutiveOperationsData, 'emergency' | 'activities' | 'schedule'>;
};

const ACTIVITY_ICONS = {
  admission: UserPlus,
  billing: Receipt,
  login: LogIn,
} as const;

const SCHEDULE_KIND_LABEL = {
  surgery: 'Surgery',
  shift: 'Shift',
  ot: 'OT',
} as const;

export default function OperationsSideColumn({ data }: OperationsSideColumnProps) {
  const erPct = Math.round(
    ((data.emergency.erBedsTotal - data.emergency.erBedsAvailable) / data.emergency.erBedsTotal) * 100,
  );

  return (
    <div className="space-y-2">
      <ExecutivePanel
        title="Emergency Operations"
        subtitle="Ambulances · triage · ER beds · Code Blue"
        icon={Siren}
        dense
        className="border-red-100/80"
        headerRight={
          <span className="nexora-emergency-pulse rounded-full bg-red-600 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
            Live
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-2">
          <MetricValue
            value={data.emergency.ambulancesEnRoute}
            label="Ambulances En Route"
            accent
          />
          <MetricValue
            value={`${data.emergency.erBedsAvailable}/${data.emergency.erBedsTotal}`}
            label="ER Beds Available"
            sub={`${erPct}% occupied`}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {data.emergency.triage.map((t) => (
            <span
              key={t.level}
              className="inline-flex items-center gap-1 rounded border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold"
              style={{ borderColor: `${t.color}40`, color: t.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
              {t.level}: {t.count}
            </span>
          ))}
        </div>
        {data.emergency.codeBlueActive.length > 0 && (
          <ul className="mt-2 space-y-1 border-t border-red-100 pt-2">
            {data.emergency.codeBlueActive.map((cb) => (
              <li
                key={cb.id}
                className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2 py-1.5"
              >
                <Ambulance className="h-3 w-3 shrink-0 text-red-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-red-800">Code Blue Active</p>
                  <p className="truncate text-[9px] text-red-700">
                    {cb.location} · {cb.time}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ExecutivePanel>

      <ExecutivePanel
        title="Recent Activities"
        subtitle="Admissions · billing · staff logins"
        icon={ClipboardList}
        dense
      >
        <ul className="custom-scrollbar max-h-[180px] space-y-1.5 overflow-y-auto">
          {data.activities.map((event) => {
            const Icon = ACTIVITY_ICONS[event.type];
            return (
              <li
                key={event.id}
                className="flex gap-2 border-b border-slate-50 pb-1.5 last:border-0 last:pb-0"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100">
                  <Icon className="h-2.5 w-2.5 text-[#0F172A]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-[10px] font-bold text-[#0F172A]">{event.title}</p>
                    <time className="shrink-0 text-[8px] text-slate-400">
                      {formatEventTime(event.timestamp)}
                    </time>
                  </div>
                  <p className="text-[9px] leading-snug text-slate-600">{event.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </ExecutivePanel>

      <ExecutivePanel
        title="Schedule & Flow"
        subtitle="Today's surgeries · shift changes · OT timeline"
        icon={CalendarClock}
        dense
      >
        <ul className="space-y-1.5">
          {data.schedule.map((item) => (
            <li
              key={item.id}
              className="flex gap-2 rounded-md border border-slate-100 px-2 py-1.5"
            >
              <span className="flex w-10 shrink-0 flex-col items-center justify-center rounded bg-[#0F172A] py-0.5 text-[9px] font-bold text-white">
                {item.time}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-blue-50 px-1 py-px text-[8px] font-bold uppercase text-[#2563EB]">
                    {SCHEDULE_KIND_LABEL[item.kind]}
                  </span>
                  <p className="truncate text-[10px] font-semibold text-[#0F172A]">{item.title}</p>
                </div>
                <p className="truncate text-[9px] text-slate-500">{item.subtitle}</p>
              </div>
            </li>
          ))}
        </ul>
      </ExecutivePanel>
    </div>
  );
}
