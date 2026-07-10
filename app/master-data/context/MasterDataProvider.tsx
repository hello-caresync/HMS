'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { SEED_MASTER_DATA } from '../lib/seedData';
import type {
  Department,
  Doctor,
  MasterDataRegistry,
  MedicineMaster,
  RoomBedMaster,
  ServiceMaster,
  VendorMaster,
} from '../types';
import { generateId } from '../types';

type MasterDataContextValue = {
  data: MasterDataRegistry;
  addDepartment: (d: Omit<Department, 'id'>) => void;
  addDoctor: (d: Omit<Doctor, 'id'>) => void;
  updateDoctor: (id: string, d: Omit<Doctor, 'id'>) => void;
  removeDoctor: (id: string) => void;
  addMedicine: (m: Omit<MedicineMaster, 'id'>) => void;
  updateMedicine: (id: string, m: Omit<MedicineMaster, 'id'>) => void;
  removeMedicine: (id: string) => void;
  addService: (s: Omit<ServiceMaster, 'id'>) => void;
  addVendor: (v: Omit<VendorMaster, 'id'>) => void;
  updateVendor: (id: string, v: Omit<VendorMaster, 'id'>) => void;
  removeVendor: (id: string) => void;
  addRoomBed: (r: Omit<RoomBedMaster, 'id'>) => void;
  updateRoomBed: (id: string, r: Omit<RoomBedMaster, 'id'>) => void;
  removeRoomBed: (id: string) => void;
  getDepartmentName: (id: string) => string;
  getVendorName: (id: string) => string;
};

const MasterDataContext = createContext<MasterDataContextValue | null>(null);

export function MasterDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<MasterDataRegistry>(SEED_MASTER_DATA);

  const addDepartment = useCallback((d: Omit<Department, 'id'>) => {
    setData((prev) => ({
      ...prev,
      departments: [...prev.departments, { ...d, id: generateId('dept') }],
    }));
  }, []);

  const addDoctor = useCallback((d: Omit<Doctor, 'id'>) => {
    setData((prev) => ({
      ...prev,
      doctors: [...prev.doctors, { ...d, id: generateId('doc') }],
    }));
  }, []);

  const updateDoctor = useCallback((id: string, d: Omit<Doctor, 'id'>) => {
    setData((prev) => ({
      ...prev,
      doctors: prev.doctors.map((doc) => (doc.id === id ? { ...d, id } : doc)),
    }));
  }, []);

  const removeDoctor = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      doctors: prev.doctors.filter((doc) => doc.id !== id),
    }));
  }, []);

  const addMedicine = useCallback((m: Omit<MedicineMaster, 'id'>) => {
    setData((prev) => ({
      ...prev,
      medicines: [...prev.medicines, { ...m, id: generateId('med') }],
    }));
  }, []);

  const updateMedicine = useCallback((id: string, m: Omit<MedicineMaster, 'id'>) => {
    setData((prev) => ({
      ...prev,
      medicines: prev.medicines.map((med) => (med.id === id ? { ...m, id } : med)),
    }));
  }, []);

  const removeMedicine = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((med) => med.id !== id),
    }));
  }, []);

  const addService = useCallback((s: Omit<ServiceMaster, 'id'>) => {
    setData((prev) => ({
      ...prev,
      services: [...prev.services, { ...s, id: generateId('svc') }],
    }));
  }, []);

  const addVendor = useCallback((v: Omit<VendorMaster, 'id'>) => {
    setData((prev) => ({
      ...prev,
      vendors: [...prev.vendors, { ...v, id: generateId('vnd') }],
    }));
  }, []);

  const updateVendor = useCallback((id: string, v: Omit<VendorMaster, 'id'>) => {
    setData((prev) => ({
      ...prev,
      vendors: prev.vendors.map((item) => (item.id === id ? { ...v, id } : item)),
    }));
  }, []);

  const removeVendor = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      vendors: prev.vendors.filter((v) => v.id !== id),
    }));
  }, []);

  const addRoomBed = useCallback((r: Omit<RoomBedMaster, 'id'>) => {
    setData((prev) => ({
      ...prev,
      roomBeds: [...prev.roomBeds, { ...r, id: generateId('bed') }],
    }));
  }, []);

  const updateRoomBed = useCallback((id: string, r: Omit<RoomBedMaster, 'id'>) => {
    setData((prev) => ({
      ...prev,
      roomBeds: prev.roomBeds.map((bed) => (bed.id === id ? { ...r, id } : bed)),
    }));
  }, []);

  const removeRoomBed = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      roomBeds: prev.roomBeds.filter((bed) => bed.id !== id),
    }));
  }, []);

  const getDepartmentName = useCallback(
    (id: string) => data.departments.find((d) => d.id === id)?.name ?? '—',
    [data.departments],
  );

  const getVendorName = useCallback(
    (id: string) => data.vendors.find((v) => v.id === id)?.vendorName ?? '—',
    [data.vendors],
  );

  const value = useMemo(
    () => ({
      data,
      addDepartment,
      addDoctor,
      updateDoctor,
      removeDoctor,
      addMedicine,
      updateMedicine,
      removeMedicine,
      addService,
      addVendor,
      updateVendor,
      removeVendor,
      addRoomBed,
      updateRoomBed,
      removeRoomBed,
      getDepartmentName,
      getVendorName,
    }),
    [
      data,
      addDepartment,
      addDoctor,
      updateDoctor,
      removeDoctor,
      addMedicine,
      updateMedicine,
      removeMedicine,
      addService,
      addVendor,
      updateVendor,
      removeVendor,
      addRoomBed,
      updateRoomBed,
      removeRoomBed,
      getDepartmentName,
      getVendorName,
    ],
  );

  return <MasterDataContext.Provider value={value}>{children}</MasterDataContext.Provider>;
}

export function useMasterData(): MasterDataContextValue {
  const ctx = useContext(MasterDataContext);
  if (!ctx) throw new Error('useMasterData must be used within MasterDataProvider');
  return ctx;
}
