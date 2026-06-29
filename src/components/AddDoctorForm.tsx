"use client";

import { useFormStatus } from "react-dom";
import { useRef } from "react";
import { addDoctor } from "@/src/app/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-full bg-zinc-50 px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Adding..." : "Add Doctor"}
    </button>
  );
}

export function AddDoctorForm({ onSuccess }: { onSuccess: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    await addDoctor(formData);
    formRef.current?.reset();
    onSuccess();
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-zinc-300">Full name</span>
        <input
          type="text"
          name="full_name"
          required
          className="rounded-xl border border-white/10 bg-black px-4 py-2.5 text-zinc-50 outline-none transition-colors placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
          placeholder="Dr. Jane Smith"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-zinc-300">Specialty</span>
        <input
          type="text"
          name="specialty"
          required
          className="rounded-xl border border-white/10 bg-black px-4 py-2.5 text-zinc-50 outline-none transition-colors placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
          placeholder="Cardiology"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-zinc-300">Email</span>
        <input
          type="email"
          name="email"
          required
          className="rounded-xl border border-white/10 bg-black px-4 py-2.5 text-zinc-50 outline-none transition-colors placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
          placeholder="jane.smith@hospital.com"
        />
      </label>

      <SubmitButton />
    </form>
  );
}