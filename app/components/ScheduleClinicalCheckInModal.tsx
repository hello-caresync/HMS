"use client";

import React, { useEffect, useMemo, useState } from "react";

import {
  DISEASE_LOOKUP,
  MEDICAL_CLASSIFICATIONS,
  filterHospitalsByCriteria,
  type MedicalClassification,
} from "../lib/scheduleCheckInData";

export type ClinicalCheckInFormData = {
  patientName: string;
  email: string;
  mobileNumber: string;
  medicalClassification: MedicalClassification | "";
  specificDisease: string;
  hospitalId: string;
  symptomsDescription: string;
  targetDate: string;
  targetTime: string;
};

type ScheduleClinicalCheckInModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: ClinicalCheckInFormData) => void;
  initialValues?: Partial<ClinicalCheckInFormData>;
};

const EMPTY_FORM: ClinicalCheckInFormData = {
  patientName: "",
  email: "",
  mobileNumber: "",
  medicalClassification: "",
  specificDisease: "",
  hospitalId: "",
  symptomsDescription: "",
  targetDate: "",
  targetTime: "",
};

const fieldClassName =
  "w-full rounded-xl border border-[#B8BDC2]/70 bg-white px-4 py-2.5 text-sm font-medium text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-[#C18988] focus:outline-none focus:ring-2 focus:ring-[#C18988]/20";

const labelClassName =
  "mb-1.5 block text-xs font-bold uppercase tracking-wide text-stone-500";

function ClockIcon() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export default function ScheduleClinicalCheckInModal({
  isOpen,
  onClose,
  onConfirm,
  initialValues,
}: ScheduleClinicalCheckInModalProps) {
  const [form, setForm] = useState<ClinicalCheckInFormData>(EMPTY_FORM);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm({
      ...EMPTY_FORM,
      ...initialValues,
    });
  }, [isOpen, initialValues]);

  const diseaseOptions = useMemo(() => {
    if (!form.medicalClassification) {
      return [];
    }

    return [...DISEASE_LOOKUP[form.medicalClassification]];
  }, [form.medicalClassification]);

  const filteredHospitals = useMemo(
    () =>
      filterHospitalsByCriteria(
        form.medicalClassification,
        form.specificDisease,
      ),
    [form.medicalClassification, form.specificDisease],
  );

  if (!isOpen) {
    return null;
  }

  const updateField = <K extends keyof ClinicalCheckInFormData>(
    key: K,
    value: ClinicalCheckInFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClassificationChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const medicalClassification = event.target
      .value as MedicalClassification;

    const diseases = DISEASE_LOOKUP[medicalClassification] ?? [];
    const specificDisease = diseases[0] ?? "";
    const hospitals = filterHospitalsByCriteria(
      medicalClassification,
      specificDisease,
    );

    setForm((prev) => ({
      ...prev,
      medicalClassification,
      specificDisease,
      hospitalId: hospitals[0]?.id ?? "",
    }));
  };

  const handleDiseaseChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const specificDisease = event.target.value;
    const hospitals = filterHospitalsByCriteria(
      form.medicalClassification,
      specificDisease,
    );

    setForm((prev) => ({
      ...prev,
      specificDisease,
      hospitalId: hospitals[0]?.id ?? "",
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onConfirm(form);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-stone-900/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-check-in-title"
    >
      <div className="relative my-6 w-full max-w-3xl rounded-2xl border border-[#B8BDC2]/60 bg-white p-6 shadow-xl sm:p-8">
        <header className="mb-6 border-b border-stone-100 pb-5">
          <h2
            id="schedule-check-in-title"
            className="text-xl font-black tracking-tight text-stone-900"
          >
            Schedule Clinical Check-In
          </h2>
          <p className="mt-1 text-sm font-medium text-stone-500">
            Please provide your details below to route case data.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="patient-name" className={labelClassName}>
                Patient Name
              </label>
              <input
                id="patient-name"
                type="text"
                required
                placeholder="e.g. Alex Mercer"
                className={fieldClassName}
                value={form.patientName}
                onChange={(event) =>
                  updateField("patientName", event.target.value)
                }
              />
            </div>
            <div>
              <label htmlFor="patient-email" className={labelClassName}>
                Email Address
              </label>
              <input
                id="patient-email"
                type="email"
                required
                placeholder="alex@example.com"
                className={fieldClassName}
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="mobile-number" className={labelClassName}>
                Mobile Number
              </label>
              <input
                id="mobile-number"
                type="tel"
                required
                pattern="[0-9]{10}"
                maxLength={10}
                placeholder="10-digit number"
                className={fieldClassName}
                value={form.mobileNumber}
                onChange={(event) =>
                  updateField(
                    "mobileNumber",
                    event.target.value.replace(/\D/g, "").slice(0, 10),
                  )
                }
              />
            </div>
            <div>
              <label htmlFor="medical-classification" className={labelClassName}>
                Medical Classification
              </label>
              <select
                id="medical-classification"
                required
                className={fieldClassName}
                value={form.medicalClassification}
                onChange={handleClassificationChange}
              >
                <option value="">Select classification</option>
                {MEDICAL_CLASSIFICATIONS.map((classification) => (
                  <option key={classification} value={classification}>
                    {classification}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="specific-disease" className={labelClassName}>
              Specific Disease
            </label>
            <select
              id="specific-disease"
              required
              disabled={!form.medicalClassification}
              className={`${fieldClassName} disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400`}
              value={form.specificDisease}
              onChange={handleDiseaseChange}
            >
              <option value="">
                {form.medicalClassification
                  ? "Select specific disease"
                  : "Choose classification first"}
              </option>
              {diseaseOptions.map((disease) => (
                <option key={disease} value={disease}>
                  {disease}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="karnataka-hospital" className={labelClassName}>
              Available Hospitals (Karnataka)
            </label>
            <select
              id="karnataka-hospital"
              required
              disabled={filteredHospitals.length === 0}
              className={`${fieldClassName} disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400`}
              value={form.hospitalId}
              onChange={(event) =>
                updateField("hospitalId", event.target.value)
              }
            >
              <option value="">
                {filteredHospitals.length > 0
                  ? "Select hospital or clinic"
                  : "No matching facilities for selected criteria"}
              </option>
              {filteredHospitals.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs font-medium text-stone-400">
              Showing {filteredHospitals.length} facilities matched to your
              selection
            </p>
          </div>

          <div>
            <label htmlFor="symptoms-description" className={labelClassName}>
              Symptoms Description
            </label>
            <textarea
              id="symptoms-description"
              required
              rows={3}
              placeholder="Describe symptoms..."
              className={`${fieldClassName} resize-none`}
              value={form.symptomsDescription}
              onChange={(event) =>
                updateField("symptomsDescription", event.target.value)
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="target-date" className={labelClassName}>
                Target Date
              </label>
              <input
                id="target-date"
                type="date"
                required
                className={fieldClassName}
                value={form.targetDate}
                onChange={(event) =>
                  updateField("targetDate", event.target.value)
                }
              />
              <p className="mt-1 text-[11px] font-medium text-stone-400">
                Format: dd-mm-yyyy
              </p>
            </div>
            <div>
              <label htmlFor="target-time" className={labelClassName}>
                Target Slot Time
              </label>
              <div className="relative">
                <input
                  id="target-time"
                  type="time"
                  required
                  className={`${fieldClassName} pr-10`}
                  value={form.targetTime}
                  onChange={(event) =>
                    updateField("targetTime", event.target.value)
                  }
                />
                <ClockIcon />
              </div>
            </div>
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-stone-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-stone-500 transition hover:text-stone-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl border border-[#916A5A]/20 bg-[#C18988] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
            >
              Confirm &amp; Generate Token
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
