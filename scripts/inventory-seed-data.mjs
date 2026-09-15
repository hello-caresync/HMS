/**
 * Inventory seed vs real data across operational tables.
 * Usage: node scripts/inventory-seed-data.mjs
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
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const sb = createClient(url, key);

const SEED_DOCTOR_NAMES = [
  'Dr. SURIRAJU V',
  'Dr. GIRISH S KUNDARGI',
  'Dr SRIHARSHA GURRAM',
  'Dr HIMA BINDU B',
  'Dr. Aishwarya D S',
];
const SEED_EMAIL_PATTERNS = [
  /@regalhospital\.com$/i,
  /@nexora\.com$/i,
  /@curasync\.com$/i,
  /patient@regalhospital\.com/i,
  /test@regalhospital\.com/i,
  /hmsadmin1@gmail\.com/i,
];
const SEED_EMPLOYEE_PREFIX = /^RH-D\d+/i;
const SEED_PATIENT_IDS = new Set([
  'pat-v0-9021',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '00000000-0000-4000-a000-000000000101',
]);

function classifyStaff(row) {
  const name = row.full_name || row.name || '';
  const email = row.email || '';
  const employeeId = row.employee_id || '';
  const reasons = [];

  if (SEED_EMPLOYEE_PREFIX.test(employeeId)) reasons.push('employee_id matches RH-D## roster pattern');
  if (SEED_EMAIL_PATTERNS.some((p) => p.test(email))) reasons.push(`email matches seed pattern (${email})`);
  if (SEED_DOCTOR_NAMES.some((n) => name.toUpperCase().includes(n.replace(/^Dr\.?\s*/i, '').toUpperCase()))) {
    reasons.push('name matches known roster/seed doctor');
  }
  if (reasons.length) return { category: 'seed', reasons };
  return { category: 'uncertain', reasons: ['no seed signature — may be real'] };
}

function classifyGeneric(row, table) {
  const text = JSON.stringify(row).toLowerCase();
  const reasons = [];
  if (SEED_PATIENT_IDS.has(String(row.patient_id || row.id || ''))) reasons.push('known demo patient id');
  if (/@nexora\.com|@regalhospital\.com|curasync|demo|seed|test@/i.test(text)) {
    reasons.push('contains demo/seed marker in payload');
  }
  if (/^PO-SEED|^INV-SEED|^DEMO-/i.test(String(row.invoice_number || row.order_number || row.po_number || ''))) {
    reasons.push('seed document number prefix');
  }
  if (reasons.length) return { category: 'seed', reasons };
  if (table === 'purchase_orders' && String(row.notes || '').toLowerCase().includes('seed')) {
    return { category: 'seed', reasons: ['notes mention seed'] };
  }
  return { category: 'uncertain', reasons: ['no obvious seed marker'] };
}

const TABLE_QUERIES = {
  hospital_staff: {
    select: 'id, employee_id, full_name, email, role, department, is_active, created_at',
    order: 'created_at',
  },
  appointments: {
    select: 'id, patient_id, patient_name, doctor_name, department, status, appointment_date, created_at',
    order: 'created_at',
  },
  billing_invoices: {
    select: 'id, invoice_number, patient_id, patient_name, doctor_name, status, total_amount, created_at',
    order: 'created_at',
  },
  purchase_orders: {
    select: 'id, po_number, vendor_name, status, total_amount, hospital_id, created_at, notes',
    order: 'created_at',
  },
  medical_records: {
    select: 'id, patient_id, patient_name, record_type, title, created_at',
    order: 'created_at',
  },
  clinical_notes: {
    select: 'id, patient_id, doctor_name, note_type, created_at',
    order: 'created_at',
  },
  opd_queue: {
    select: 'id, patient_id, patient_name, doctor_name, token_number, queue_status, created_at',
    order: 'created_at',
  },
  emergency_alerts: {
    select: 'id, patient_name, severity, status, created_at',
    order: 'created_at',
  },
  channel_messages: {
    select: 'id, sender_name, recipient_name, message, channel, created_at',
    order: 'created_at',
  },
  system_notifications: {
    select: 'id, title, message, recipient_id, type, created_at',
    order: 'created_at',
  },
  lab_orders: {
    select: 'id, patient_id, test_name, status, ordered_by, created_at',
    order: 'created_at',
  },
  radiology_orders: {
    select: 'id, patient_id, study_name, status, ordered_by, created_at',
    order: 'created_at',
  },
};

function summarize(rows, classifier, table) {
  const seed = [];
  const uncertain = [];
  for (const row of rows) {
    const result = classifier(row, table);
    const entry = { ...row, _classification: result.category, _reasons: result.reasons };
    if (result.category === 'seed') seed.push(entry);
    else uncertain.push(entry);
  }
  return { seed, uncertain };
}

async function fetchTable(table, cfg) {
  const { data, error } = await sb
    .from(table)
    .select(cfg.select)
    .order(cfg.order, { ascending: true });
  if (error) {
    return { error: error.message, rows: [] };
  }
  return { error: null, rows: data ?? [] };
}

console.log('\n=== CareSync Seed Data Inventory ===\n');
console.log(`Supabase: ${url}`);
console.log(`Generated: ${new Date().toISOString()}\n`);

for (const [table, cfg] of Object.entries(TABLE_QUERIES)) {
  const { error, rows } = await fetchTable(table, cfg);
  console.log(`\n## ${table} (${rows.length} rows${error ? ` — ERROR: ${error}` : ''})`);
  if (error) continue;

  const classifier = table === 'hospital_staff' ? classifyStaff : classifyGeneric;
  const { seed, uncertain } = summarize(rows, classifier, table);

  console.log(`\n### Confidently seed/test (${seed.length})`);
  if (seed.length === 0) console.log('  (none)');
  else seed.forEach((r) => console.log(`  - ${JSON.stringify(r)}`));

  console.log(`\n### Uncertain — please confirm (${uncertain.length})`);
  if (uncertain.length === 0) console.log('  (none)');
  else uncertain.forEach((r) => console.log(`  - ${JSON.stringify(r)}`));
}

console.log('\n=== End inventory ===\n');
