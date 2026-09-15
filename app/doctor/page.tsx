'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Stethoscope } from 'lucide-react';
import { getDoctorSession } from '@/lib/doctor/session';

export default function DoctorIndexPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Checking clinician session…');

  useEffect(() => {
    const session = getDoctorSession();
    if (session?.doctorId) {
      setMessage('Opening doctor dashboard…');
      router.replace('/doctor/dashboard');
    } else {
      setMessage('Redirecting to login…');
      router.replace('/doctor/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F2F6FA] font-sans text-[#2C243B]">
      <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/60 px-6 py-4 shadow-lg backdrop-blur-xl">
        <Stethoscope className="h-5 w-5 text-[#894A66]" />
        <Loader2 className="h-4 w-4 animate-spin text-[#894A66]" />
        <span className="text-xs font-black">{message}</span>
      </div>
    </div>
  );
}
