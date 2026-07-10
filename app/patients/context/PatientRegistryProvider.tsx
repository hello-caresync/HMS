'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { SEED_PATIENTS } from '../lib/seedPatients';
import {
  generatePatientId,
  generateStandardUhid,
  generateTemporaryUhid,
  splitFullName,
} from '../lib/uhid';
import type {
  DemographicsFormData,
  EmergencyAddressFormData,
  EmergencyQuickRegData,
  InsuranceFormData,
  PatientRecord,
} from '../types';

type PatientRegistryContextValue = {
  patients: PatientRecord[];
  registerFullPatient: (
    demographics: DemographicsFormData,
    emergencyAddress: EmergencyAddressFormData,
    insurance: InsuranceFormData,
    assignedUhid?: string,
  ) => PatientRecord;
  registerEmergencyPatient: (data: EmergencyQuickRegData) => PatientRecord;
  searchPatients: (query: string) => PatientRecord[];
  getPatientByUhid: (uhid: string) => PatientRecord | undefined;
};

const PatientRegistryContext = createContext<PatientRegistryContextValue | null>(null);

export function PatientRegistryProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<PatientRecord[]>(SEED_PATIENTS);

  const registerFullPatient = useCallback(
    (
      demographics: DemographicsFormData,
      emergencyAddress: EmergencyAddressFormData,
      insurance: InsuranceFormData,
      assignedUhid?: string,
    ): PatientRecord => {
      const id = generatePatientId();
      const uhid = assignedUhid ?? generateStandardUhid();

      const record: PatientRecord = {
        profile: {
          id,
          uhid,
          firstName: demographics.firstName.trim(),
          lastName: demographics.lastName.trim(),
          dob: demographics.dob,
          gender: demographics.gender,
          bloodGroup: demographics.bloodGroup,
          nationalIdOptional: demographics.nationalIdOptional.trim() || undefined,
          phone: demographics.phone.trim(),
          email: demographics.email.trim() || undefined,
          isTemporary: false,
          registeredAt: new Date().toISOString(),
        },
        address: {
          patientId: id,
          street: emergencyAddress.street.trim(),
          city: emergencyAddress.city.trim(),
          state: emergencyAddress.state.trim(),
          zipCode: emergencyAddress.zipCode.trim(),
        },
        emergencyContact: {
          patientId: id,
          contactName: emergencyAddress.contactName.trim(),
          relationship: emergencyAddress.relationship.trim(),
          phone: emergencyAddress.emergencyPhone.trim(),
        },
        insurance: {
          patientId: id,
          billingType: insurance.billingType,
          providerName: insurance.providerName.trim() || undefined,
          policyNumber: insurance.policyNumber.trim() || undefined,
          corporateGroupCode: insurance.corporateGroupCode.trim() || undefined,
          validityDate: insurance.validityDate || undefined,
        },
      };

      setPatients((prev) => [record, ...prev]);
      return record;
    },
    [],
  );

  const registerEmergencyPatient = useCallback((data: EmergencyQuickRegData): PatientRecord => {
    const id = generatePatientId();
    const uhid = generateTemporaryUhid();
    const { firstName, lastName } = splitFullName(data.name);

    const record: PatientRecord = {
      profile: {
        id,
        uhid,
        firstName,
        lastName,
        dob: '',
        gender: data.gender,
        bloodGroup: 'Unknown',
        phone: '—',
        isTemporary: true,
        estimatedAge: data.estimatedAge,
        registeredAt: new Date().toISOString(),
      },
      address: null,
      emergencyContact: null,
      insurance: {
        patientId: id,
        billingType: 'Self',
      },
    };

    setPatients((prev) => [record, ...prev]);
    return record;
  }, []);

  const searchPatients = useCallback(
    (query: string): PatientRecord[] => {
      const q = query.trim().toLowerCase();
      if (!q) return patients;
      return patients.filter((p) => {
        const fullName = `${p.profile.firstName} ${p.profile.lastName}`.toLowerCase();
        return (
          p.profile.uhid.toLowerCase().includes(q) ||
          fullName.includes(q) ||
          p.profile.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
        );
      });
    },
    [patients],
  );

  const getPatientByUhid = useCallback(
    (uhid: string) => patients.find((p) => p.profile.uhid === uhid),
    [patients],
  );

  const value = useMemo(
    () => ({
      patients,
      registerFullPatient,
      registerEmergencyPatient,
      searchPatients,
      getPatientByUhid,
    }),
    [patients, registerFullPatient, registerEmergencyPatient, searchPatients, getPatientByUhid],
  );

  return (
    <PatientRegistryContext.Provider value={value}>{children}</PatientRegistryContext.Provider>
  );
}

export function usePatientRegistry(): PatientRegistryContextValue {
  const ctx = useContext(PatientRegistryContext);
  if (!ctx) throw new Error('usePatientRegistry must be used within PatientRegistryProvider');
  return ctx;
}
