'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { HospitalToastBanner, useHospitalToast } from '../../_components/HospitalFeedback';
import { insertPatientRegistration } from '../../_lib/hospital-db.service';

export default function PatientRegisterPage() {
  const { toast, showSuccess, showError } = useHospitalToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    fullName: '',
    uhid: '',
    phone: '',
    department: 'Registration',
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.uhid.trim()) {
      showError('Full name and UHID are required.');
      return;
    }
    startTransition(() => {
      void (async () => {
        const { error } = await insertPatientRegistration({
          fullName: form.fullName.trim(),
          uhid: form.uhid.trim(),
          phone: form.phone.trim() || undefined,
          department: form.department.trim() || 'Registration',
        });
        if (error) {
          showError(error);
          return;
        }
        showSuccess(`Patient ${form.fullName.trim()} registered in Supabase.`);
        setForm({ fullName: '', uhid: '', phone: '', department: 'Registration' });
      })();
    });
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <HospitalToastBanner toast={toast} />
      <Link
        href="/hospital/patients"
        className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#00758C] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to patient directory
      </Link>
      <header>
        <h1 className="text-2xl font-bold text-[#00758C] sm:text-3xl">Patient registration</h1>
        <p className="mt-1 text-sm text-slate-600">Creates a row in the Supabase `patients` table.</p>
      </header>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium uppercase text-slate-500">
          Full name
          <input
            required
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base"
          />
        </label>
        <label className="block text-sm font-medium uppercase text-slate-500">
          UHID
          <input
            required
            value={form.uhid}
            onChange={(e) => setForm((f) => ({ ...f, uhid: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-base"
          />
        </label>
        <label className="block text-sm font-medium uppercase text-slate-500">
          Phone
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base"
          />
        </label>
        <label className="block text-sm font-medium uppercase text-slate-500">
          Department
          <input
            value={form.department}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00758C] py-2.5 text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {isPending ? 'Saving…' : 'Register patient'}
        </button>
      </form>
    </div>
  );
}
