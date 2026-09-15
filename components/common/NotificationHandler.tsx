'use client';

import { useEffect } from 'react';

import { unlockOpdAudio } from '@/lib/notifications/opd-alerts';

/** Unlocks browser audio on first user interaction so OPD chimes can play. */
export function NotificationHandler() {
  useEffect(() => {
    const unlock = () => unlockOpdAudio();

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return null;
}

export default NotificationHandler;
