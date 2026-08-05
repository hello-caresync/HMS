import type { SupabaseClient } from '@supabase/supabase-js';

export type SearchResultGroup = 'patients' | 'doctors' | 'invoices' | 'appointments' | 'medicines';

export type GlobalSearchResult = {
  id: string;
  group: SearchResultGroup;
  title: string;
  subtitle: string;
  href: string;
};

export async function searchGlobal(
  supabase: SupabaseClient | null,
  query: string,
  local: {
    patients: Array<{ id: string; fullName: string; uhid: string; phone?: string }>;
    staff: Array<{ id: string; fullName: string; role: string; department: string }>;
    invoices: Array<{ id: string; invoiceNumber: string; patientName: string }>;
    appointments: Array<{ id: string; patientName: string; doctorName: string; appointmentDate: string }>;
    inventory: Array<{ id: string; itemName: string; sku?: string }>;
  },
): Promise<GlobalSearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: GlobalSearchResult[] = [];
  const limit = 5;

  for (const p of local.patients) {
    if (
      results.filter((r) => r.group === 'patients').length >= limit
    ) break;
    if (
      p.fullName.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      (p.phone ?? '').includes(q)
    ) {
      results.push({
        id: p.id,
        group: 'patients',
        title: p.fullName,
        subtitle: `UHID ${p.uhid}`,
        href: `/hospital/patients?q=${encodeURIComponent(p.uhid)}`,
      });
    }
  }

  for (const d of local.staff.filter((s) => s.role === 'Doctor')) {
    if (results.filter((r) => r.group === 'doctors').length >= limit) break;
    if (d.fullName.toLowerCase().includes(q) || d.department.toLowerCase().includes(q)) {
      results.push({
        id: d.id,
        group: 'doctors',
        title: d.fullName,
        subtitle: d.department,
        href: `/hospital/appointments?q=${encodeURIComponent(d.fullName)}`,
      });
    }
  }

  for (const inv of local.invoices) {
    if (results.filter((r) => r.group === 'invoices').length >= limit) break;
    if (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.patientName.toLowerCase().includes(q)
    ) {
      results.push({
        id: inv.id,
        group: 'invoices',
        title: inv.invoiceNumber || inv.id,
        subtitle: inv.patientName,
        href: `/hospital/billing?invoice=${encodeURIComponent(inv.id)}`,
      });
    }
  }

  for (const a of local.appointments) {
    if (results.filter((r) => r.group === 'appointments').length >= limit) break;
    if (
      a.patientName.toLowerCase().includes(q) ||
      a.doctorName.toLowerCase().includes(q) ||
      a.appointmentDate.includes(q)
    ) {
      results.push({
        id: a.id,
        group: 'appointments',
        title: `${a.patientName} · ${a.appointmentDate}`,
        subtitle: a.doctorName,
        href: `/hospital/appointments?id=${encodeURIComponent(a.id)}`,
      });
    }
  }

  for (const m of local.inventory) {
    if (results.filter((r) => r.group === 'medicines').length >= limit) break;
    if (
      m.itemName.toLowerCase().includes(q) ||
      (m.sku ?? '').toLowerCase().includes(q)
    ) {
      results.push({
        id: m.id,
        group: 'medicines',
        title: m.itemName,
        subtitle: m.sku ?? 'Inventory',
        href: `/hospital/inventory?id=${encodeURIComponent(m.id)}`,
      });
    }
  }

  if (supabase && results.length < 20) {
    const { data: dbPatients } = await supabase
      .from('patients')
      .select('id, full_name, uhid, phone')
      .or(`full_name.ilike.%${q}%,uhid.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(5);
    for (const row of dbPatients ?? []) {
      if (results.some((r) => r.id === String(row.id))) continue;
      results.push({
        id: String(row.id),
        group: 'patients',
        title: String(row.full_name),
        subtitle: `UHID ${row.uhid}`,
        href: `/hospital/patients?q=${encodeURIComponent(String(row.uhid))}`,
      });
    }
  }

  return results.slice(0, 20);
}
