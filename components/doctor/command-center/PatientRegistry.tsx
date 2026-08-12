'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, Search, User } from 'lucide-react';
import { usePatientSearch } from '@/lib/doctor/command-center/hooks';
import { ccClasses } from '@/lib/doctor/command-center/theme';

export function PatientRegistry() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: patients = [], isLoading } = usePatientSearch(search);

  return (
    <div className="space-y-6">
      <header className={`p-6 ${ccClasses.card}`}>
        <h1 className="text-2xl font-black text-[#173F5F]">Patient Registry</h1>
        <p className="mt-1 text-sm font-semibold text-[#5A7A94]">
          Search by name, UHID, phone, or token number
        </p>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A7A94]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients…"
            className={`${ccClasses.input} pl-10`}
          />
        </div>
      </header>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center gap-2 text-sm font-semibold text-[#5A7A94]">
          <Loader2 className="h-5 w-5 animate-spin" /> Searching registry…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {patients.map((p) => (
            <article
              key={p.id}
              className={`cursor-pointer p-5 transition hover:shadow-md ${ccClasses.card}`}
              onClick={() => router.push(`/doctor/patients/${p.id}/`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') router.push(`/doctor/patients/${p.id}/`);
              }}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F1F8] text-[#20639B]">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-black text-[#173F5F]">{p.full_name}</h2>
                  <p className="text-xs font-semibold text-[#5A7A94]">ID {p.id.slice(0, 8).toUpperCase()}</p>
                  {p.phone && <p className="text-xs font-semibold text-[#5A7A94]">{p.phone}</p>}
                </div>
              </div>
              {p.allergies ? (
                <div className="mt-3 flex items-center gap-1 rounded-lg bg-[#D9534F]/10 px-2 py-1 text-[10px] font-black text-[#D9534F]">
                  <AlertTriangle className="h-3 w-3" /> Allergies: {p.allergies}
                </div>
              ) : null}
              <Link
                href={`/doctor/patients/${p.id}/`}
                className="mt-3 inline-block text-xs font-bold text-[#20639B] underline"
              >
                Open 360° profile
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default PatientRegistry;
