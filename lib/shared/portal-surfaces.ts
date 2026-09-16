/** Warm off-white surfaces and accent tokens per portal (wayfinding preserved). */

export const portalSurfaces = {
  patient: {
    page: 'bg-[#FAF6F0]',
    card: 'bg-white border-[#EBDCCB]',
    empty: 'bg-[#FDFBF7] border-[#EADBCE]',
    accent: '#8C5A3C',
    accentSoft: '#DDB892',
    btnPrimary: 'bg-[#8C5A3C] text-white hover:bg-[#6F4228]',
    btnSecondary: 'border border-[#EADBCE] bg-[#FDFBF7] text-[#5C3826] hover:bg-[#F3ECE4]',
  },
  doctor: {
    page: 'bg-[#F4F9F8]',
    card: 'bg-[#FAFDFC] border-[#D5E8E3]',
    empty: 'bg-[#F0F7F5] border-[#D5E8E3]',
    accent: '#173F5F',
    accentSoft: '#2A9D8F',
    btnPrimary: 'bg-[#2A9D8F] text-white hover:bg-[#227B6B]',
    btnSecondary: 'border border-[#D5E8E3] bg-white text-[#173F5F] hover:bg-[#EAF5F2]',
  },
  hospital: {
    page: 'bg-[#F5F7FA]',
    card: 'bg-[#FAFBFD] border-slate-200',
    empty: 'bg-[#F3F6FA] border-slate-200',
    accent: '#173F5F',
    accentSoft: '#20639B',
    btnPrimary: 'bg-[#173F5F] text-white hover:bg-[#20639B]',
    btnSecondary: 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
  },
  vendor: {
    page: 'bg-[#F6F5F3]',
    card: 'bg-[#FAFAF8] border-stone-200',
    empty: 'bg-[#F3F2EF] border-stone-200',
    accent: '#3D3D3D',
    accentSoft: '#E87722',
    btnPrimary: 'bg-[#3D3D3D] text-white hover:bg-[#2A2A2A]',
    btnSecondary: 'border border-stone-200 bg-white text-stone-800 hover:bg-stone-50',
  },
  superAdmin: {
    page: 'bg-[#F6F4FA]',
    card: 'bg-[#FAF9FD] border-violet-200',
    empty: 'bg-[#F3F0FA] border-violet-200',
    accent: '#5B21B6',
    accentSoft: '#7C3AED',
    btnPrimary: 'bg-[#5B21B6] text-white hover:bg-[#7C3AED]',
    btnSecondary: 'border border-violet-200 bg-white text-violet-900 hover:bg-violet-50',
  },
} as const;

export function accessibleStatusBadge(status: string): string {
  const value = status.toUpperCase();
  if (value.includes('PAID') || value.includes('SETTLED') || value === 'ACTIVE' || value === 'COMPLETED') {
    return 'bg-emerald-100 text-emerald-900 border-emerald-300';
  }
  if (value.includes('PARTIAL') || value.includes('WAITING') || value.includes('ISSUED')) {
    return 'bg-amber-100 text-amber-950 border-amber-300';
  }
  if (value.includes('PENDING') || value.includes('DUE') || value.includes('UNPAID')) {
    return 'bg-rose-100 text-rose-900 border-rose-300';
  }
  if (value.includes('INSURANCE')) {
    return 'bg-sky-100 text-sky-950 border-sky-300';
  }
  return 'bg-slate-100 text-slate-800 border-slate-300';
}
