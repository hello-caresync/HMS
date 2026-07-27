'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type DoctorShellContextValue = {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  aiOpen: boolean;
  setAiOpen: (open: boolean) => void;
  notifOpen: boolean;
  setNotifOpen: (open: boolean) => void;
  toggleCommand: () => void;
  toggleAi: () => void;
  toggleNotif: () => void;
};

const DoctorShellContext = createContext<DoctorShellContextValue | null>(null);

export function DoctorShellProvider({ children }: { children: ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const toggleCommand = useCallback(() => setCommandOpen((v) => !v), []);
  const toggleAi = useCallback(() => setAiOpen((v) => !v), []);
  const toggleNotif = useCallback(() => setNotifOpen((v) => !v), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
      if (e.key === 'Escape') {
        setCommandOpen(false);
        setAiOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const value = useMemo(
    () => ({
      commandOpen,
      setCommandOpen,
      aiOpen,
      setAiOpen,
      notifOpen,
      setNotifOpen,
      toggleCommand,
      toggleAi,
      toggleNotif,
    }),
    [commandOpen, aiOpen, notifOpen, toggleCommand, toggleAi, toggleNotif],
  );

  return <DoctorShellContext.Provider value={value}>{children}</DoctorShellContext.Provider>;
}

export function useDoctorShell() {
  const ctx = useContext(DoctorShellContext);
  if (!ctx) throw new Error('useDoctorShell must be used within DoctorShellProvider');
  return ctx;
}
