'use client';

import { useCallback, useState } from 'react';
import {
  Globe,
  Monitor,
  Settings,
  Shield,
  Smartphone,
} from 'lucide-react';

type SettingsSection = 'general' | 'security' | 'devices';

type LoginDevice = {
  id: string;
  deviceName: string;
  location: string;
  lastActive: string;
  isActive: boolean;
};

type NotificationPrefs = {
  emailAlerts: boolean;
  smsAlerts: boolean;
  pushAlerts: boolean;
  labResults: boolean;
  otReminders: boolean;
  emergencyCases: boolean;
};

const CONFIG_SUMMARY =
  'Standalone system preferences · theme · notifications · security · device registry · 13 Jul 2026';

const SECTIONS: { key: SettingsSection; label: string; icon: typeof Settings }[] = [
  { key: 'general', label: 'General Configuration', icon: Settings },
  { key: 'security', label: 'Security & 2FA', icon: Shield },
  { key: 'devices', label: 'Device History', icon: Monitor },
];

const THEMES = ['Light (Default)', 'Dark', 'High Contrast', 'System Auto'];
const LANGUAGES = ['English (US)', 'English (UK)', 'Hindi', 'Tamil', 'Telugu'];

const LOGIN_DEVICES: LoginDevice[] = [
  {
    id: 'dev-1',
    deviceName: 'Windows Desktop · Chrome',
    location: 'Chennai, IN · sandbox',
    lastActive: 'Active now',
    isActive: true,
  },
  {
    id: 'dev-2',
    deviceName: 'iPhone 15 · Safari',
    location: 'Chennai, IN · sandbox',
    lastActive: '2 hours ago',
    isActive: true,
  },
  {
    id: 'dev-3',
    deviceName: 'MacBook Pro · Firefox',
    location: 'Bangalore, IN · sandbox',
    lastActive: 'Yesterday 18:22',
    isActive: false,
  },
  {
    id: 'dev-4',
    deviceName: 'Android Tablet · Chrome',
    location: 'Chennai, IN · sandbox',
    lastActive: '3 days ago',
    isActive: false,
  },
];

const INPUT_CLASS =
  'w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200';

const SELECT_CLASS = `${INPUT_CLASS} cursor-pointer`;

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [theme, setTheme] = useState('Light (Default)');
  const [language, setLanguage] = useState('English (US)');
  const [notifications, setNotifications] = useState<NotificationPrefs>({
    emailAlerts: true,
    smsAlerts: false,
    pushAlerts: true,
    labResults: true,
    otReminders: true,
    emergencyCases: true,
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devices, setDevices] = useState<LoginDevice[]>(LOGIN_DEVICES);
  const [actionNote, setActionNote] = useState<string | null>(null);

  const showNotice = useCallback((message: string) => {
    setActionNote(message);
    window.setTimeout(() => setActionNote(null), 4500);
  }, []);

  const toggleNotification = (key: keyof NotificationPrefs) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotice('Complete all password fields before submitting');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotice('New password and confirmation do not match');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showNotice('Password change simulated · sandbox only · no backend write');
  };

  const handleRevokeSession = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, isActive: false, lastActive: 'Revoked' } : d)),
    );
    showNotice('Session revoked · sandbox device registry updated');
  };

  const notificationItems: { key: keyof NotificationPrefs; label: string }[] = [
    { key: 'emailAlerts', label: 'Email Alerts' },
    { key: 'smsAlerts', label: 'SMS Alerts' },
    { key: 'pushAlerts', label: 'Push Notifications' },
    { key: 'labResults', label: 'Lab Result Ready' },
    { key: 'otReminders', label: 'OT Reminders' },
    { key: 'emergencyCases', label: 'Emergency Case Assignment' },
  ];

  return (
    <div className="min-h-screen w-full font-sans text-slate-950 selection:bg-slate-200">
      <div className="w-full space-y-5 p-4 sm:p-6 lg:p-8">
        <header className="flex w-full flex-col gap-4 border-b-2 border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              System Management &amp; Security Center
            </h1>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-800">
              {CONFIG_SUMMARY}
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 shadow-sm">
            <Settings className="h-4 w-4 text-slate-700" aria-hidden />
            <span>SECURE_CONFIG_SYS_OK</span>
          </div>
        </header>

        {actionNote && (
          <p role="status" className="w-full rounded-lg border-2 border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-950">
            {actionNote}
          </p>
        )}

        <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-[25%_75%]">
          {/* Left sidebar */}
          <nav aria-label="Settings navigation" className="w-full space-y-2">
            {SECTIONS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSection(key)}
                className={`flex w-full items-center gap-2 rounded-xl border-2 px-4 py-3 text-left text-xs font-black ${
                  activeSection === key
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-950 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </button>
            ))}
          </nav>

          {/* Main setup window */}
          <section className="w-full rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 shadow-sm sm:p-5">
            {activeSection === 'general' && (
              <div className="space-y-5">
                <h2 className="text-base font-black text-slate-950">General Configuration</h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-950">
                      <Settings className="h-3.5 w-3.5" aria-hidden />
                      Theme Customization
                    </span>
                    <select
                      className={SELECT_CLASS}
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                    >
                      {THEMES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-950">
                      <Globe className="h-3.5 w-3.5" aria-hidden />
                      Language Parameters
                    </span>
                    <select
                      className={SELECT_CLASS}
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-950">Notification Settings</h3>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {notificationItems.map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2.5"
                      >
                        <input
                          type="checkbox"
                          checked={notifications[key]}
                          onChange={() => toggleNotification(key)}
                          className="h-4 w-4 rounded border-slate-400 text-slate-900 focus:ring-slate-300"
                        />
                        <span className="text-xs font-bold text-slate-950">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-5">
                <h2 className="text-base font-black text-slate-950">Security &amp; 2FA</h2>

                <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] px-4 py-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">Two-Factor Authentication</p>
                    <p className="text-xs font-bold text-slate-800">Add an extra layer of account protection</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={twoFactorEnabled}
                    onClick={() => {
                      setTwoFactorEnabled((p) => {
                        showNotice(p ? '2FA disabled · sandbox' : '2FA enabled · sandbox authenticator simulated');
                        return !p;
                      });
                    }}
                    className={`relative h-7 w-12 shrink-0 rounded-full border-2 transition-colors ${
                      twoFactorEnabled
                        ? 'border-emerald-600 bg-emerald-600'
                        : 'border-slate-300 bg-slate-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        twoFactorEnabled ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-4 rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4">
                  <h3 className="text-sm font-black text-slate-950">Change Password</h3>
                  <label className="block space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-950">Current Password</span>
                    <input
                      type="password"
                      className={INPUT_CLASS}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-950">New Password</span>
                    <input
                      type="password"
                      className={INPUT_CLASS}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-950">Confirm New Password</span>
                    <input
                      type="password"
                      className={INPUT_CLASS}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handlePasswordChange}
                    className="rounded-lg border-2 border-slate-900 bg-slate-900 px-4 py-2 text-[10px] font-black uppercase text-white hover:bg-slate-800"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'devices' && (
              <div className="space-y-4">
                <h2 className="text-base font-black text-slate-950">Device Registry</h2>
                <p className="text-xs font-bold text-slate-800">Active login devices · revoke sessions for security</p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-100">
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Device
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Location
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                          Status
                        </th>
                        <th className="px-3 py-2 text-right text-[10px] font-black uppercase text-slate-950">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {devices.map((device) => (
                        <tr key={device.id} className="border-b-2 border-slate-200">
                          <td className="px-3 py-2.5">
                            <p className="flex items-center gap-1.5 text-xs font-black text-slate-950">
                              {device.deviceName.includes('iPhone') || device.deviceName.includes('Android') ? (
                                <Smartphone className="h-3.5 w-3.5" aria-hidden />
                              ) : (
                                <Monitor className="h-3.5 w-3.5" aria-hidden />
                              )}
                              {device.deviceName}
                            </p>
                          </td>
                          <td className="px-3 py-2.5 text-xs font-bold text-slate-950">{device.location}</td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                                device.isActive
                                  ? 'border border-emerald-400 bg-emerald-100 text-emerald-950'
                                  : 'border border-slate-400 bg-slate-100 text-slate-950'
                              }`}
                            >
                              {device.isActive ? device.lastActive : 'Revoked'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRevokeSession(device.id)}
                              disabled={!device.isActive}
                              className="text-[10px] font-black uppercase text-rose-800 hover:text-rose-950 disabled:opacity-40"
                            >
                              Revoke Session
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
