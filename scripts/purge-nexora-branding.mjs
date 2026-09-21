#!/usr/bin/env node
/**
 * Replaces user-facing Nexora branding strings with Regal Health HMS naming.
 * Does not rename import paths (e.g. @/lib/nexora-hospital) or TypeScript identifiers.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.next', 'nexora-backend', 'nexora-erp', '.git']);
const EXT = new Set(['.ts', '.tsx', '.css', '.md', '.json', '.sql', '.mjs']);

const REPLACEMENTS = [
  ['Nexora ERP', 'Regal Health HMS'],
  ['NEXORA HMS', 'Regal Health HMS'],
  ['NEXORA Healthcare OS', 'Regal Health HMS'],
  ['Nexora Multispeciality Hospital', 'Regal Multispeciality Hospital'],
  ['Nexora General Hospital', 'Regal Multispeciality Hospital'],
  ['Nexora Main Campus', 'Regal Multispeciality Hospital'],
  ['Nexora City Centre Clinic', 'Regal Multispeciality Hospital'],
  ['Nexora North Wing', 'Regal Multispeciality Hospital'],
  ['Nexora Heart Institute', 'Regal Heart Institute'],
  ['Nexora City Hospital', 'Regal Multispeciality Hospital'],
  ['Nexora Diagnostics Network', 'Regal Diagnostics Network'],
  ['Nexora Back-Office ERP', 'Regal Health HMS'],
  ['Nexora Health Systems', 'Regal Multispeciality Hospital'],
  ['Nexora Healthcare Ecosystem', 'Regal Healthcare Ecosystem'],
  ['Nexora Healthcare', 'Regal Multispeciality Hospital'],
  ['Nexora Hospital Operations Hub', 'Regal Hospital Operations Hub'],
  ['Nexora Hospital App', 'Regal Hospital App'],
  ['Nexora Hospital', 'Regal Hospital'],
  ['Nexora Digital OPD Pass', 'Regal Digital OPD Pass'],
  ['Nexora Smart OPD', 'Regal Smart OPD'],
  ['Nexora Telehealth Studio', 'Regal Telehealth Studio'],
  ['Nexora Vendor Access', 'Regal Vendor Access'],
  ['Nexora Vendor App', 'Regal Vendor App'],
  ['Nexora Vendor ·', 'Regal Vendor ·'],
  ['Nexora Patient App', 'Regal Patient App'],
  ['Nexora Patient V0', 'Regal Patient Portal'],
  ['Loading Nexora Patient', 'Loading patient portal'],
  ['Nexora Patient —', 'Regal Patient —'],
  ['Nexora Doctor App', 'Regal Doctor App'],
  ['Nexora Doctor —', 'Regal Doctor —'],
  ['Nexora Doctor ·', 'Regal Doctor ·'],
  ['Nexora Ecosystem Hub', 'Regal Ecosystem Hub'],
  ['Nexora Ecosystem', 'Regal Ecosystem'],
  ['Nexora Enterprise', 'Regal Multispeciality Hospital'],
  ['Nexora HMS primary navigation', 'Regal Health HMS primary navigation'],
  ['Nexora HMS', 'Regal Health HMS'],
  ['Nexora control platforms', 'Regal Health HMS'],
  ['nexora_dashboard_tab', 'regal_dashboard_tab'],
  ['NX-HOSP-01', 'HOSP-01'],
  ['Nexora Doctor platform', 'Regal Doctor platform'],
  ['Nexora Platform', 'Regal Health HMS'],
  ['Nexora University Hospital', 'Regal Multispeciality Hospital'],
  ['Nexora Vendor Portal', 'Regal Vendor Portal'],
  ['Virtual · Nexora Tele', 'Regal Telehealth'],
  ['Nexora Multi-Specialty Campus', 'Regal Multispeciality Hospital'],
  ['Nexora Multi-Specialty · Main Campus', 'Regal Multispeciality Hospital'],
  ['Nexora · Doctor', 'Regal · Doctor'],
  ['Nexora Clinical · Sandbox', 'Regal Clinical · Sandbox'],
  ['Nexora Clinical', 'Regal Clinical'],
  ['Nexora CLM', 'Regal CLM'],
  ['Nexora support', 'Regal support'],
  ['Nexora Doctor clinical navigation', 'Regal Doctor clinical navigation'],
  ['Nexora OPD · Waiting Area', 'Regal OPD · Waiting Area'],
  ['Securing Nexora staff session', 'Securing Regal staff session'],
  ['Nexora secure identity', 'Regal secure identity'],
  ['All Nexora branches', 'All Regal branches'],
  ['Nexora security policy', 'Regal security policy'],
  ['Nexora enterprise policy', 'Regal enterprise policy'],
  ['Nexora Patient shell', 'Regal Patient portal shell'],
  ['Nexora Patient', 'Regal Patient Portal'],
  ['Nexora In-house', 'Regal In-house'],
  ['Nexora Imaging · Block C', 'Regal Imaging · Block C'],
  ['Nexora Surgical Centre', 'Regal Surgical Centre'],
  ['Nexora SRM', 'Regal SRM'],
  ['Nexora Health Platform', 'Regal Health HMS'],
  ['Nexora Central Hospital · Executive Operations', 'Regal Multispeciality Hospital · Executive Operations'],
  ['Nexora Operations', 'Regal Operations'],
  ['Nexora EMR', 'Regal EMR'],
  ['Nexora Multi-Specialty', 'Regal Multispeciality'],
  ['On-premise terminal · Nexora Health', 'On-premise terminal · Regal Hospital'],
  ['Nexora@2026', 'Regal@2026'],
  ['Nexora —', 'Regal —'],
  ['Nexora ', 'Regal '],
  [' Nexora', ' Regal'],
  ['/* Nexora Patient', '/* Regal Patient'],
  ['/* Nexora Doctor', '/* Regal Doctor'],
  ['Nexora standalone', 'Regal standalone'],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (EXT.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

let changedFiles = 0;
for (const file of walk(ROOT)) {
  if (file.endsWith('purge-nexora-branding.mjs')) continue;
  let text = fs.readFileSync(file, 'utf8');
  let next = text;
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  if (next !== text) {
    fs.writeFileSync(file, next, 'utf8');
    changedFiles += 1;
  }
}

console.log(`Updated ${changedFiles} files.`);
