/**
 * FHIR R4-lite shapes for Nexora Patient (interoperability with Hospital / Doctor apps).
 * Full validation against HL7 profiles can be layered in a dedicated package later.
 */

export type FhirReference = {
  reference?: string;
  display?: string;
};

export type FhirPatient = {
  resourceType: 'Patient';
  id: string;
  identifier?: { system?: string; value: string }[];
  name?: { family?: string; given?: string[]; text?: string }[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  telecom?: { system: 'phone' | 'email'; value: string; use?: string }[];
};

export type FhirObservation = {
  resourceType: 'Observation';
  id: string;
  status: 'final' | 'preliminary';
  code: { coding: { system: string; code: string; display: string }[] };
  subject: FhirReference;
  effectiveDateTime?: string;
  valueQuantity?: { value: number; unit: string; system?: string; code?: string };
};

export type FhirMedicationRequest = {
  resourceType: 'MedicationRequest';
  id: string;
  status: 'active' | 'completed' | 'stopped';
  intent: 'order';
  medicationCodeableConcept: { text: string };
  subject: FhirReference;
  authoredOn?: string;
  dosageInstruction?: { text: string }[];
};

export type FhirDiagnosticReport = {
  resourceType: 'DiagnosticReport';
  id: string;
  status: 'final' | 'partial';
  code: { text: string };
  subject: FhirReference;
  effectiveDateTime?: string;
  /** Imaging studies may link to DICOM WADO-RS endpoints. */
  imagingStudy?: FhirReference[];
  presentedForm?: { contentType: string; url?: string; title?: string }[];
};

export type PatientHealthRecordBundle = {
  patient: FhirPatient;
  observations: FhirObservation[];
  medicationRequests: FhirMedicationRequest[];
  diagnosticReports: FhirDiagnosticReport[];
};
