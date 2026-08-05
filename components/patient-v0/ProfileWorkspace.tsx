'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { KeyRound, LogOut, Phone, Shield, User } from 'lucide-react';

import { v0Ui } from '@/components/patient-v0/ui';
import { PatientStatusBanner } from '@/components/patient/PatientStatusBanner';
import { useEcosystemStore } from '@/lib/ecosystem/store';
import { usePatientAuth } from '@/lib/patient/auth/PatientAuthProvider';
import { usePatientData } from '@/lib/ecosystem/hooks';

export function ProfileWorkspace() {
  const { session, signOut } = usePatientAuth();
  const router = useRouter();
  const patient = usePatientData(session?.patientId ?? null);
  const updateProfile = useEcosystemStore((s) => s.updatePatientProfile);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    phone: patient?.phone ?? '',
    emergencyContactName: patient?.emergencyContactName ?? '',
    emergencyContactPhone: patient?.emergencyContactPhone ?? '',
  });

  if (!session || !patient) return null;

  const handleSave = () => {
    updateProfile(patient.id, form);
    setNotice('Profile updated successfully');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleLogout = () => {
    signOut();
    router.replace('/patient/auth/login');
  };

  return (
    <div className={v0Ui.page}>
      <header>
        <h1 className={v0Ui.pageTitle}>Profile & Settings</h1>
        <p className={v0Ui.pageSubtitle}>Manage your account and emergency contacts</p>
      </header>

      {notice && <PatientStatusBanner message={notice} variant="success" />}

      <section className={v0Ui.card}>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-patient-plum">
          <User className="h-5 w-5" /> Personal Details
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div><dt className="text-xs font-bold text-patient-lavender">Full name</dt><dd className="font-bold">{patient.fullName}</dd></div>
          <div><dt className="text-xs font-bold text-patient-lavender">MRN</dt><dd className="font-mono font-bold text-patient-primary">{patient.mrn}</dd></div>
          <div><dt className="text-xs font-bold text-patient-lavender">Email</dt><dd>{patient.email}</dd></div>
          <div><dt className="text-xs font-bold text-patient-lavender">Date of birth</dt><dd>{patient.dateOfBirth}</dd></div>
          <div><dt className="text-xs font-bold text-patient-lavender">Blood group</dt><dd>{patient.bloodGroup}</dd></div>
          <div><dt className="text-xs font-bold text-patient-lavender">Gender</dt><dd>{patient.gender}</dd></div>
        </dl>
        <div className="mt-4">
          <label className="text-xs font-bold text-patient-lavender">Phone</label>
          <input className={`${v0Ui.input} mt-1`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
      </section>

      <section className={v0Ui.card}>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-patient-plum">
          <Phone className="h-5 w-5" /> Emergency Contact
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-patient-lavender">Contact name</label>
            <input className={`${v0Ui.input} mt-1`} value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-bold text-patient-lavender">Contact phone</label>
            <input className={`${v0Ui.input} mt-1`} value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} />
          </div>
        </div>
      </section>

      <section className={v0Ui.card}>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-patient-plum">
          <Shield className="h-5 w-5" /> Insurance Summary
        </h2>
        <p className="font-bold text-patient-charcoal">{patient.insuranceProvider}</p>
        <p className="text-sm text-patient-lavender">Policy {patient.insurancePolicyId}</p>
      </section>

      <section className={v0Ui.card}>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-patient-plum">
          <KeyRound className="h-5 w-5" /> Account
        </h2>
        <p className="mb-4 text-sm text-patient-lavender">Password changes are managed through Nexora secure identity. Contact support for reset.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handleSave} className={v0Ui.btnPrimary}>Save changes</button>
          <button type="button" onClick={handleLogout} className={v0Ui.btnDanger}>
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </section>
    </div>
  );
}
