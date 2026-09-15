/**
 * Hospital tenant audit — hospitals rows + per-table hospital_id reference counts.
 * Reads credentials from ../.env.local (SUPABASE_SERVICE_ROLE_KEY recommended).
 *
 * Usage: node scripts/audit-hospital-tenants.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../.env.local');
const envText = readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envText
    .split('\n')
    .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
    .map((line) => {
      const i = line.indexOf('=');
      const key = line.slice(0, i).trim();
      let val = line.slice(i + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      return [key, val];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key in .env.local');
  process.exit(1);
}

const sb = createClient(url, key);

/** Known tables — audit also discovers any extra public tables with hospital_id via RPC/SQL. */
const TABLES = [
  'appointments',
  'patient_appointments',
  'hospital_appointments',
  'hospital_admins',
  'hospital_staff',
  'hospital_staff_credentials',
  'hospital_members',
  'doctor_profiles',
  'doctors',
  'billing_invoices',
  'bills',
  'hospital_invoices',
  'purchase_orders',
  'hospital_supply_orders',
  'procurement_purchase_orders',
  'shipments',
  'invoices',
  'channel_messages',
  'system_notifications',
  'system_events',
  'emergency_alerts',
  'emergency_triage',
  'emergency_triages',
  'opd_queue',
  'hospital_opd_queue',
  'patients',
  'hospital_patients',
  'hospital_vendors',
  'hospital_suppliers',
  'prescriptions',
  'hospital_prescriptions',
  'pharmacy_prescriptions',
  'medical_records',
  'clinical_medical_records',
  'clinical_notes',
  'hospital_beds',
  'inventory_items',
  'hospital_pharmacy_inventory',
  'hospital_medicines',
  'hospital_inventory_transactions',
  'hospital_emergencies',
  'consultations',
  'departments',
];

const SEED_UUID = '11111111-1111-1111-1111-111111111111';
const LEGACY_ROSTER_UUID = 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

async function countByHospitalId(table, hospitalId) {
  const { count, error } = await sb
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('hospital_id', hospitalId);
  if (error) {
    if (/does not exist|Could not find|schema cache/i.test(error.message)) return null;
    return { error: error.message };
  }
  return count ?? 0;
}

async function countByHospitalCode(table, code) {
  const { count, error } = await sb
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('hospital_code', code);
  if (error) {
    if (/does not exist|Could not find|schema cache/i.test(error.message)) return null;
    return { error: error.message };
  }
  return count ?? 0;
}

async function main() {
  const { data: hospitals, error: hErr } = await sb
    .from('hospitals')
    .select('*')
    .order('created_at', { ascending: true });

  if (hErr) {
    console.error('hospitals query failed:', hErr.message);
    process.exit(1);
  }

  console.log('=== HOSPITALS TABLE (' + (hospitals?.length ?? 0) + ' rows) ===');
  for (const h of hospitals ?? []) {
    console.log(JSON.stringify(h, null, 2));
    console.log('---');
  }

  const ids = (hospitals ?? []).map((h) => h.id);
  const codes = [...new Set((hospitals ?? []).map((h) => h.hospital_code).filter(Boolean))];

  console.log('\n=== REFERENCE COUNTS BY hospital_id ===');
  const matrix = {};
  for (const hid of ids) {
    const h = hospitals.find((x) => x.id === hid);
    console.log(`\n--- ${h?.name ?? '?'} | id: ${hid} | code: ${h?.hospital_code ?? '?'} ---`);
    matrix[hid] = {};
    for (const table of TABLES) {
      const result = await countByHospitalId(table, hid);
      if (result === null) continue;
      if (typeof result === 'object' && result.error) {
        console.log(`  ${table}: ERROR ${result.error}`);
        continue;
      }
      if (result > 0) {
        console.log(`  ${table}: ${result}`);
        matrix[hid][table] = result;
      }
    }
    const staffRole = await sb.from('hospital_staff').select('role').eq('hospital_id', hid);
    const staffRows = staffRole.data ?? [];
    const doctors = staffRows.filter((r) => /doctor/i.test(String(r.role ?? ''))).length;
    console.log(`  hospital_staff (doctors by role): ${doctors} / ${staffRows.length} total staff rows`);
  }

  console.log('\n=== REFERENCE COUNTS BY hospital_code (where column exists) ===');
  for (const code of codes) {
    console.log(`\n--- hospital_code: ${code} ---`);
    for (const table of TABLES) {
      const result = await countByHospitalCode(table, code);
      if (result === null) continue;
      if (typeof result === 'object' && result.error) continue;
      if (result > 0) console.log(`  ${table}: ${result}`);
    }
  }

  console.log('\n=== LEGACY UUID references ===');
  for (const legacyId of [SEED_UUID, LEGACY_ROSTER_UUID]) {
    console.log(`\n--- ${legacyId} ---`);
    for (const table of TABLES) {
      const result = await countByHospitalId(table, legacyId);
      if (result === null) continue;
      if (typeof result === 'object' && result.error) continue;
      if (result > 0) console.log(`  ${table}: ${result}`);
    }
  }

  console.log('\n=== SUMMARY JSON (non-zero counts only) ===');
  console.log(JSON.stringify(matrix, null, 2));
  console.log('\nTip: run scripts/audit-hospital-tenants.sql section 2 for hospital_id column types (uuid vs text).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
