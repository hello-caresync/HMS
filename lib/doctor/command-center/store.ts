'use client';

import { create } from 'zustand';

type CommandCenterState = {
  isOnline: boolean;
  queueDrawerOpen: boolean;
  notificationDrawerOpen: boolean;
  activeTokenId: string | null;
  setOnline: (v: boolean) => void;
  setQueueDrawerOpen: (v: boolean) => void;
  setNotificationDrawerOpen: (v: boolean) => void;
  setActiveTokenId: (id: string | null) => void;
};

export const useCommandCenterStore = create<CommandCenterState>((set) => ({
  isOnline: true,
  queueDrawerOpen: false,
  notificationDrawerOpen: false,
  activeTokenId: null,
  setOnline: (isOnline) => set({ isOnline }),
  setQueueDrawerOpen: (queueDrawerOpen) => set({ queueDrawerOpen }),
  setNotificationDrawerOpen: (notificationDrawerOpen) => set({ notificationDrawerOpen }),
  setActiveTokenId: (activeTokenId) => set({ activeTokenId }),
}));
