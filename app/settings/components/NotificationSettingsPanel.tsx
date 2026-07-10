'use client';

import { useSettings } from '../context/SettingsProvider';

export default function NotificationSettingsPanel() {
  const { notifications, toggleNotification } = useSettings();

  return (
    <div className="rounded border border-slate-200 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 px-3 py-2">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">Security</p>
        <p className="text-[11px] font-bold text-slate-900">Notification Channel Matrix</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100 text-left">
              <th className="px-3 py-2 font-black uppercase tracking-wider text-slate-950">
                Event Type
              </th>
              <th className="px-3 py-2 text-center font-black uppercase tracking-wider text-slate-950">
                Email
              </th>
              <th className="px-3 py-2 text-center font-black uppercase tracking-wider text-slate-950">
                SMS
              </th>
              <th className="px-3 py-2 text-center font-black uppercase tracking-wider text-slate-950">
                In-App
              </th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((n, i) => (
              <tr
                key={n.id}
                className={`border-b-2 border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
              >
                <td className="px-3 py-2 font-bold text-slate-950">{n.label}</td>
                {(['email', 'sms', 'inApp'] as const).map((ch) => (
                  <td key={ch} className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => toggleNotification(n.id, ch)}
                      className={`h-5 w-9 rounded-full transition ${
                        n[ch] ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                      aria-label={`Toggle ${ch} for ${n.label}`}
                    >
                      <span
                        className={`block h-4 w-4 rounded-full bg-white shadow transition ${
                          n[ch] ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
