'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DoctorIndexPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('active_doctor_session');
      if (savedSession) {
        router.replace('/doctor/dashboard');
      } else {
        router.replace('/doctor/login');
      }
    }
  }, [router]);

  return null;
}