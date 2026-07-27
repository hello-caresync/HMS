'use client';

import Link from 'next/link';
import { Plus, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useOsColors } from '@/lib/doctor-os/store';
import { OsBtn } from '@/components/doctor-os/ui/OsPrimitives';

export default function DoctorOsFab() {
  const c = useOsColors();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="flex flex-col gap-2"
        >
          <Link
            href="/doctor/clinical"
            className="flex h-10 items-center gap-2 rounded-full border px-4 text-[12px] font-semibold shadow-lg backdrop-blur-xl"
            style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}
          >
            <Plus className="h-4 w-4" /> New consult
          </Link>
        </motion.div>
      </AnimatePresence>
      <Link href="/doctor/care-center">
        <motion.span
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-xl"
          style={{ background: 'linear-gradient(135deg, #0071E3 0%, #5856D6 100%)' }}
        >
          <Stethoscope className="h-6 w-6" />
        </motion.span>
      </Link>
    </div>
  );
}
