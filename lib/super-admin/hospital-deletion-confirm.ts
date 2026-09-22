export type HospitalDeletionTarget = {
  name?: string | null;
  hospital_code?: string | null;
};

/** Case-insensitive confirmation — hospital name, code, DELETE, or CONFIRM. */
export function isHospitalDeletionConfirmed(
  confirmationInput: string,
  hospital: HospitalDeletionTarget,
): boolean {
  const input = confirmationInput.trim().toLowerCase();
  if (!input) return false;

  const validNames = [
    hospital.name?.toLowerCase().trim(),
    hospital.hospital_code?.toLowerCase().trim(),
    'delete',
    'confirm',
  ].filter((value): value is string => Boolean(value));

  return validNames.includes(input);
}

export const HOSPITAL_DELETION_CONFIRM_HINT =
  "Type 'DELETE' or the hospital name to confirm.";

export const HOSPITAL_DELETION_CONFIRM_ERROR =
  "Confirmation text did not match. Please type the hospital name or 'DELETE'.";
