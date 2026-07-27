'use client';

import { useCallback, useState } from 'react';
import {
  Bell,
  Globe,
  Key,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  Smartphone,
  User,
  UserCircle,
} from 'lucide-react';

type PersonalProfile = {
  fullName: string;
  phone: string;
  email: string;
  language: string;
};

type SecurityState = {
  passwordHash: string;
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  lastTwoFactorUpdate: string;
};

type PrivacySettings = {
  shareMedicalData: boolean;
  shareWithFamily: boolean;
  publicProfileVisible: boolean;
  researchDataOptIn: boolean;
};

type NotificationPreferences = {
  emailAppointments: boolean;
  emailMedications: boolean;
  smsAppointments: boolean;
  smsMedications: boolean;
  pushAppointments: boolean;
  pushMedications: boolean;
};

type LinkedDevice = {
  id: string;
  name: string;
  location: string;
  lastActive: string;
  activeNow: boolean;
};

const PANEL_CLASS = 'rounded-2xl border border-patient-lavender/30 bg-white p-6 shadow-sm';

const SECURITY_CARD_CLASS =
  'mb-4 rounded-xl border border-patient-lavender/30 bg-white p-5 shadow-sm transition-all hover:border-patient-lavender/30';

const INPUT_CLASS =
  'w-full rounded-xl border border-patient-lavender/30 bg-white px-4 py-2.5 text-sm font-medium text-patient-charcoal placeholder:text-patient-lavender/50 transition-all focus:border-patient-lavender/30 focus:outline-none focus:ring-2 focus:ring-[#572E54]/20';

const VERIFIED_CHIP =
  'bg-patient-card text-patient-primary border border-patient-lavender/30 font-bold px-2.5 py-0.5 rounded-full text-[10px]';

const INITIAL_PROFILE: PersonalProfile = {
  fullName: 'Aishwarya D S',
  phone: '+91 98765 43210',
  email: 'aishwarya.ds@nexora.health',
  language: 'English (US)',
};

const INITIAL_SECURITY: SecurityState = {
  passwordHash: '••••••••••••••••',
  twoFactorEnabled: true,
  lastPasswordChange: '28 Jun 2026 · 14:22 IST',
  lastTwoFactorUpdate: '05 Jul 2026 · 09:10 IST',
};

const LINKED_DEVICES: LinkedDevice[] = [
  {
    id: 'dev-1',
    name: 'iPhone 15 Pro',
    location: 'Bengaluru, India',
    lastActive: 'Active Now',
    activeNow: true,
  },
  {
    id: 'dev-2',
    name: 'MacBook Pro',
    location: 'Bengaluru, India',
    lastActive: '14 Jul 2026 · 11:38 IST',
    activeNow: false,
  },
  {
    id: 'dev-3',
    name: 'iPad Air · Family Tablet',
    location: 'Koramangala, Bengaluru',
    lastActive: '12 Jul 2026 · 19:45 IST',
    activeNow: false,
  },
];

const LANGUAGE_OPTIONS = [
  'English (US)',
  'English (UK)',
  'Hindi (India)',
  'Kannada (India)',
  'Tamil (India)',
];

type ToggleSwitchProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
};

function ToggleSwitch({ id, checked, onChange, label, description }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-patient-lavender/30 bg-patient-lavender/10/50 px-4 py-3">
      <div>
        <label htmlFor={id} className="text-sm font-bold text-patient-charcoal">
          {label}
        </label>
        {description ? (
          <p className="mt-0.5 text-xs font-medium text-patient-lavender">{description}</p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-patient-primary' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black transition-transform ${
            checked ? 'translate-x-5 bg-patient-primary text-white' : 'translate-x-0.5 bg-white text-patient-lavender shadow'
          }`}
        >
          {checked ? '✓' : ''}
        </span>
      </button>
    </div>
  );
}

export default function PatientProfilePage() {
  const [profile, setProfile] = useState<PersonalProfile>(INITIAL_PROFILE);
  const [security, setSecurity] = useState<SecurityState>(INITIAL_SECURITY);
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    shareMedicalData: true,
    shareWithFamily: true,
    publicProfileVisible: false,
    researchDataOptIn: false,
  });
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailAppointments: true,
    emailMedications: true,
    smsAppointments: true,
    smsMedications: false,
    pushAppointments: true,
    pushMedications: true,
  });
  const [devices, setDevices] = useState<LinkedDevice[]>(LINKED_DEVICES);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = useCallback((message: string) => {
    setActionNotice(message);
    window.setTimeout(() => setActionNotice(null), 4000);
  }, []);

  const handleProfileField = useCallback(
    (field: keyof PersonalProfile) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setProfile((prev) => ({ ...prev, [field]: event.target.value }));
      },
    [],
  );

  const handleSaveConfiguration = useCallback(() => {
    showNotice('Configuration saved · identity profile & preferences synced · sandbox OK');
  }, [showNotice]);

  const handleUpdatePassword = useCallback(() => {
    if (!newPassword.trim()) {
      showNotice('Enter a new password to continue · sandbox validation');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotice('Password confirmation mismatch · please re-enter · sandbox validation');
      return;
    }
    setSecurity((prev) => ({
      ...prev,
      passwordHash: '••••••••••••••••',
      lastPasswordChange: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
    setNewPassword('');
    setConfirmPassword('');
    showNotice('Password updated · credential hash rotated · sandbox confirmation');
  }, [newPassword, confirmPassword, showNotice]);

  const handleToggle2FA = useCallback(() => {
    setSecurity((prev) => {
      const next = !prev.twoFactorEnabled;
      showNotice(
        next
          ? 'Two-factor authentication enabled · TOTP channel active · sandbox'
          : 'Two-factor authentication disabled · sandbox warning issued',
      );
      return {
        ...prev,
        twoFactorEnabled: next,
        lastTwoFactorUpdate: new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    });
  }, [showNotice]);

  const handleRevokeDevice = useCallback(
    (deviceId: string) => {
      const device = devices.find((d) => d.id === deviceId);
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      showNotice(`Access token revoked · ${device?.name ?? 'Device'} · sandbox session terminated`);
    },
    [devices, showNotice],
  );

  const handleLogout = useCallback(() => {
    showNotice('Session termination queued · redirecting to secure logout · sandbox mode');
  }, [showNotice]);

  const updatePrivacy = useCallback(
    (key: keyof PrivacySettings) => (value: boolean) => {
      setPrivacy((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updateNotification = useCallback(
    (key: keyof NotificationPreferences) => (value: boolean) => {
      setNotifications((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  return (
    <div className="min-h-screen w-full space-y-6 bg-patient-canvas p-6 font-sans text-patient-charcoal">
      {/* Central HUD control header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-patient-plum">
            Account Center &amp; System Operations Desk
          </h1>
          <p className="mt-1 text-sm font-medium text-patient-lavender">
            Identity verification · ID_NEX_9021 · platform session active · engine context{' '}
            <span className="font-bold text-patient-primary">TRUSTED_ENDPOINT</span> · 14 Jul 2026
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-patient-lavender/30 bg-patient-card px-4 py-2 text-xs font-bold uppercase tracking-wide text-patient-primary">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          IDENTITY_VERIFIED_OK
        </div>
      </header>

      {actionNotice ? (
        <p className="rounded-xl border border-patient-lavender/30 bg-patient-card px-4 py-2 text-sm font-bold text-patient-primary">
          {actionNotice}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,60fr)_minmax(0,40fr)]">
        {/* Left column — identity & toggles (60%) */}
        <div className="space-y-6">
          {/* Personal profile & language */}
          <section aria-label="Personal profile and language" className={PANEL_CLASS}>
            <div className="mb-5 flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-lg font-black text-patient-plum">Personal Profile &amp; Language</h2>
            </div>

            <div className="flex flex-col gap-6 sm:flex-row">
              {/* Profile picture placeholder */}
              <div className="flex shrink-0 flex-col items-center gap-2">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-patient-lavender/30 bg-patient-card">
                  <User className="h-10 w-10 text-patient-primary" aria-hidden />
                </div>
                <button
                  type="button"
                  onClick={() => showNotice('Profile photo upload · sandbox media vault')}
                  className="text-xs font-bold text-patient-primary hover:underline"
                >
                  Upload Photo
                </button>
                <span className={`inline-flex uppercase ${VERIFIED_CHIP}`}>VERIFIED</span>
              </div>

              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="fullName" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-patient-lavender">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={profile.fullName}
                    onChange={handleProfileField('fullName')}
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-patient-lavender">
                    <Phone className="h-3.5 w-3.5" aria-hidden />
                    Contact Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={handleProfileField('phone')}
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-patient-lavender">
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={handleProfileField('email')}
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="language" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-patient-lavender">
                    <Globe className="h-3.5 w-3.5" aria-hidden />
                    Language Preference
                  </label>
                  <select
                    id="language"
                    value={profile.language}
                    onChange={handleProfileField('language')}
                    className={INPUT_CLASS}
                  >
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveConfiguration}
              className="mt-6 w-fit cursor-pointer rounded-xl bg-patient-primary px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-patient-plum"
            >
              Save Configuration Changes
            </button>
          </section>

          {/* Notification & privacy matrix */}
          <section aria-label="Notification and privacy settings" className={PANEL_CLASS}>
            <div className="mb-5 flex items-center gap-2">
              <Bell className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-lg font-black text-patient-plum">Notification &amp; Privacy Matrix</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-patient-primary">
                  Notification Preferences
                </h3>
                <div className="space-y-2">
                  <ToggleSwitch
                    id="email-appointments"
                    checked={notifications.emailAppointments}
                    onChange={updateNotification('emailAppointments')}
                    label="Email · Appointment Alerts"
                    description="Booking confirmations, reschedules, and queue updates"
                  />
                  <ToggleSwitch
                    id="email-medications"
                    checked={notifications.emailMedications}
                    onChange={updateNotification('emailMedications')}
                    label="Email · Medication Reminders"
                    description="Refill windows, dosage schedules, and pharmacy notices"
                  />
                  <ToggleSwitch
                    id="sms-appointments"
                    checked={notifications.smsAppointments}
                    onChange={updateNotification('smsAppointments')}
                    label="SMS · Appointment Alerts"
                    description="Critical schedule changes and same-day reminders"
                  />
                  <ToggleSwitch
                    id="sms-medications"
                    checked={notifications.smsMedications}
                    onChange={updateNotification('smsMedications')}
                    label="SMS · Medication Reminders"
                    description="Time-sensitive dose alerts via verified SMS gateway"
                  />
                  <ToggleSwitch
                    id="push-appointments"
                    checked={notifications.pushAppointments}
                    onChange={updateNotification('pushAppointments')}
                    label="Push · Appointment Alerts"
                    description="Real-time mobile push for live queue and teleconsult"
                  />
                  <ToggleSwitch
                    id="push-medications"
                    checked={notifications.pushMedications}
                    onChange={updateNotification('pushMedications')}
                    label="Push · Medication Reminders"
                    description="In-app push for daily medication adherence"
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-patient-primary">
                  Privacy Filters
                </h3>
                <div className="space-y-2">
                  <ToggleSwitch
                    id="share-medical"
                    checked={privacy.shareMedicalData}
                    onChange={updatePrivacy('shareMedicalData')}
                    label="Share Medical Data with Care Team"
                    description="Allow treating physicians to access your clinical vault"
                  />
                  <ToggleSwitch
                    id="share-family"
                    checked={privacy.shareWithFamily}
                    onChange={updatePrivacy('shareWithFamily')}
                    label="Share Records with Linked Family"
                    description="Guardian and spouse access to appointment summaries"
                  />
                  <ToggleSwitch
                    id="public-profile"
                    checked={privacy.publicProfileVisible}
                    onChange={updatePrivacy('publicProfileVisible')}
                    label="Public Profile Visibility"
                    description="Display basic profile in hospital directory searches"
                  />
                  <ToggleSwitch
                    id="research-opt-in"
                    checked={privacy.researchDataOptIn}
                    onChange={updatePrivacy('researchDataOptIn')}
                    label="Anonymized Research Data Opt-In"
                    description="Contribute de-identified data to clinical research programs"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right column — security & sessions (40%) */}
        <aside className="space-y-6">
          {/* Security & password ledger */}
          <section aria-label="Security and password settings">
            <div className="mb-4 flex items-center gap-2">
              <Key className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-base font-black text-patient-plum">Security &amp; Password Ledger</h2>
            </div>

            <div className={SECURITY_CARD_CLASS}>
              <p className="text-xs font-bold uppercase tracking-wider text-patient-lavender">
                Current Password Hash
              </p>
              <p className="mt-1 font-mono text-sm font-black text-patient-text">{security.passwordHash}</p>
              <p className="mt-2 text-[10px] font-bold text-patient-lavender">
                Last changed · {security.lastPasswordChange}
              </p>

              <div className="mt-4 space-y-3">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password"
                  aria-label="New password"
                  className={INPUT_CLASS}
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  aria-label="Confirm new password"
                  className={INPUT_CLASS}
                />
                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  className="w-full rounded-xl border border-patient-lavender/30 bg-patient-card px-4 py-2.5 text-sm font-bold text-patient-primary transition-all hover:bg-patient-lavender/25"
                >
                  Update Password
                </button>
              </div>
            </div>

            <div className={SECURITY_CARD_CLASS}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-patient-charcoal">Two-Factor Authentication (2FA)</p>
                  <p className="mt-0.5 text-xs font-medium text-patient-lavender">
                    TOTP authenticator · SMS fallback channel
                  </p>
                  <p className="mt-2 text-[10px] font-bold text-patient-lavender">
                    Last updated · {security.lastTwoFactorUpdate}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={security.twoFactorEnabled}
                  onClick={handleToggle2FA}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                    security.twoFactorEnabled ? 'bg-patient-primary' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black transition-transform ${
                      security.twoFactorEnabled
                        ? 'translate-x-5 bg-patient-primary text-white'
                        : 'translate-x-0.5 bg-white shadow'
                    }`}
                  >
                    {security.twoFactorEnabled ? '✓' : ''}
                  </span>
                </button>
              </div>
              {security.twoFactorEnabled ? (
                <span className={`mt-3 inline-flex uppercase ${VERIFIED_CHIP}`}>2FA_ACTIVE</span>
              ) : null}
            </div>
          </section>

          {/* Linked devices */}
          <section aria-label="Linked devices" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-base font-black text-patient-plum">Linked Devices Matrix</h2>
            </div>
            <ul className="space-y-3">
              {devices.map((device) => (
                <li
                  key={device.id}
                  className="rounded-xl border border-patient-lavender/30 bg-patient-lavender/10/50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-patient-plum">{device.name}</p>
                      <p className="text-xs font-medium text-patient-lavender">{device.location}</p>
                      <p className="mt-1 text-[10px] font-bold text-patient-lavender">{device.lastActive}</p>
                    </div>
                    {device.activeNow ? (
                      <span className={`inline-flex uppercase ${VERIFIED_CHIP}`}>ACTIVE_NOW</span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevokeDevice(device.id)}
                    className="mt-3 text-xs font-bold text-rose-600 hover:underline"
                  >
                    Revoke Access Token
                  </button>
                </li>
              ))}
            </ul>
            {devices.length === 0 ? (
              <p className="text-sm font-medium text-patient-lavender">No linked devices · all tokens revoked</p>
            ) : null}
          </section>

          {/* System termination */}
          <section aria-label="Session termination" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <LogOut className="h-5 w-5 text-rose-600" aria-hidden />
              <h2 className="text-base font-black text-patient-plum">System Termination</h2>
            </div>
            <p className="mb-4 text-xs font-medium text-patient-lavender">
              End your active platform session and clear local authentication tokens from this
              endpoint.
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full cursor-pointer rounded-xl border border-rose-200 bg-rose-50 py-3 text-center text-sm font-extrabold text-rose-700 shadow-sm transition-all hover:bg-rose-100"
            >
              Terminate Session &amp; Logout
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
