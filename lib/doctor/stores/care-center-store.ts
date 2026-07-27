'use client';

import { create } from 'zustand';

import type { CareCenterFilter } from '@/lib/doctor/types/care-center-dto';
import type { IpdPatientCard, OpdQueueCard } from '@/lib/doctor/types/care-center-dto';

export type CareCenterTab = 'opd' | 'ipd';

type CareCenterState = {
  activeTab: CareCenterTab;
  filter: CareCenterFilter;
  search: string;
  selectedOpd: OpdQueueCard | null;
  selectedIpd: IpdPatientCard | null;
  consultationOpen: boolean;
  ipdDrawerOpen: boolean;
  ipdSection: 'summary' | 'round' | 'discharge';
  setTab: (tab: CareCenterTab) => void;
  setFilter: (filter: CareCenterFilter) => void;
  setSearch: (search: string) => void;
  openOpdConsultation: (card: OpdQueueCard) => void;
  closeOpdConsultation: () => void;
  openIpdPatient: (card: IpdPatientCard, section?: CareCenterState['ipdSection']) => void;
  closeIpdPatient: () => void;
};

export const useCareCenterStore = create<CareCenterState>((set) => ({
  activeTab: 'opd',
  filter: 'all',
  search: '',
  selectedOpd: null,
  selectedIpd: null,
  consultationOpen: false,
  ipdDrawerOpen: false,
  ipdSection: 'summary',
  setTab: (activeTab) => set({ activeTab }),
  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  openOpdConsultation: (card) =>
    set({ selectedOpd: card, consultationOpen: true, activeTab: 'opd' }),
  closeOpdConsultation: () => set({ consultationOpen: false, selectedOpd: null }),
  openIpdPatient: (card, ipdSection = 'summary') =>
    set({ selectedIpd: card, ipdDrawerOpen: true, ipdSection, activeTab: 'ipd' }),
  closeIpdPatient: () => set({ ipdDrawerOpen: false, selectedIpd: null }),
}));
