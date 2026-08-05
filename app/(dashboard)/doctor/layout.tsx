'use client';

import React, { createContext, useContext, useState } from 'react';

// Force dynamic rendering across all doctor dashboard sub-routes
export const dynamic = 'force-dynamic';

// 1. Define Doctor Auth Context Types
interface DoctorUser {
  id: string;
  name: string;
  email: string;
  registrationNo: string;
  department: string;
  roomNo: string;
}

interface DoctorAuthContextType {
  doctor: DoctorUser | null;
  isAuthenticated: boolean;
  logout: () => void;
}

const defaultDoctor: DoctorUser = {
  id: 'doc-001',
  name: 'Dr. Aishwarya D S',
  email: 'aishwarya@nexorahealth.com',
  registrationNo: 'KMC-88410',
  department: 'General Medicine',
  roomNo: '302',
};

// 2. Create Context & Custom Hook
const DoctorAuthContext = createContext<DoctorAuthContextType>({
  doctor: defaultDoctor,
  isAuthenticated: true,
  logout: () => {},
});

export function useDoctorAuth() {
  const context = useContext(DoctorAuthContext);
  if (!context) {
    throw new Error('useDoctorAuth must be used within DoctorAuthProvider');
  }
  return context;
}

// 3. Provider Component
export function DoctorAuthProvider({ children }: { children: React.ReactNode }) {
  const [doctor, setDoctor] = useState<DoctorUser | null>(defaultDoctor);

  const logout = () => {
    setDoctor(null);
  };

  return (
    <DoctorAuthContext.Provider
      value={{
        doctor,
        isAuthenticated: !!doctor,
        logout,
      }}
    >
      {children}
    </DoctorAuthContext.Provider>
  );
}

// 4. Main Layout Wrapper
export default function DoctorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DoctorAuthProvider>
      <div className="min-h-screen bg-[#F0F8F9] text-slate-800 antialiased">
        <main className="w-full">{children}</main>
      </div>
    </DoctorAuthProvider>
  );
}