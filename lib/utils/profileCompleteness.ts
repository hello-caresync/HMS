export interface PatientProfile {
  id: string;
  full_name?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  age?: number | string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export type ProfileCompletenessResult = {
  complete: boolean;
  missingFields: string[];
};

function hasAgeOrDob(profile: PatientProfile): boolean {
  if (profile.dob?.trim()) return true;
  if (typeof profile.age === 'number' && Number.isFinite(profile.age) && profile.age > 0) {
    return true;
  }
  if (typeof profile.age === 'string') {
    const parsed = Number(profile.age.trim());
    return Number.isFinite(parsed) && parsed > 0;
  }
  return false;
}

function hasAddressOrEmergencyContact(profile: PatientProfile): boolean {
  if (profile.address?.trim()) return true;
  return Boolean(
    profile.emergency_contact_name?.trim() && profile.emergency_contact_phone?.trim(),
  );
}

export function isProfileComplete(
  profile: PatientProfile | null | undefined,
): ProfileCompletenessResult {
  if (!profile) {
    return { complete: false, missingFields: ['Profile not found'] };
  }

  const missing: string[] = [];
  if (!profile.full_name?.trim()) missing.push('Full Name');
  if (!profile.phone?.trim()) missing.push('Phone Number');
  if (!profile.gender?.trim()) missing.push('Gender');
  if (!hasAgeOrDob(profile)) missing.push('Date of Birth / Age');
  if (!hasAddressOrEmergencyContact(profile)) {
    missing.push('Address or Emergency Contact');
  }

  return {
    complete: missing.length === 0,
    missingFields: missing,
  };
}

export function profileIncompleteBookingMessage(missingFields: string[]): string {
  if (missingFields.length === 0) {
    return 'Complete your patient profile before booking an OPD visit or generating a queue token.';
  }
  return `Complete your patient profile before booking. Missing: ${missingFields.join(', ')}`;
}
