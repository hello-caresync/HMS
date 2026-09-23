/**
 * Cloudflare next-on-pages treats Next.js' internal /_global-error Node func as invalid
 * even when app/global-error declares edge runtime (client-boundary re-export limitation).
 * Patch the validator to ignore the same way it already ignores /_error.func.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(
  __dirname,
  '..',
  'node_modules',
  '@cloudflare',
  'next-on-pages',
  'dist',
  'index.js',
);

if (!fs.existsSync(target)) {
  console.warn('[cloudflare] Skipping next-on-pages patch; package not installed.');
  process.exit(0);
}

const marker = 'invalid _global-error functions in app directory are ignored';
let source = fs.readFileSync(target, 'utf8');

if (source.includes(marker)) {
  console.log('[cloudflare] next-on-pages _global-error patch already applied.');
  process.exit(0);
}

const anchor = `async function fixAppRouterInvalidErrorFunctions({
  invalidFunctions,
  ignoredFunctions
}) {
  for (const [fullPath, fnInfo] of invalidFunctions.entries()) {
    if (fullPath.endsWith("/_error.func")) {
      ignoredFunctions.set(fullPath, {
        reason: "invalid _error functions in app directory are ignored",
        ...fnInfo
      });
      invalidFunctions.delete(fullPath);
    }
  }
}`;

const patched = `async function fixAppRouterInvalidErrorFunctions({
  invalidFunctions,
  ignoredFunctions
}) {
  for (const [fullPath, fnInfo] of invalidFunctions.entries()) {
    if (fullPath.endsWith("/_error.func")) {
      ignoredFunctions.set(fullPath, {
        reason: "invalid _error functions in app directory are ignored",
        ...fnInfo
      });
      invalidFunctions.delete(fullPath);
    }

    if (
      fullPath.endsWith("/_global-error.func") ||
      fullPath.endsWith("/_global-error.rsc.func")
    ) {
      ignoredFunctions.set(fullPath, {
        reason: "${marker}",
        ...fnInfo
      });
      invalidFunctions.delete(fullPath);
    }
  }
}`;

if (!source.includes(anchor)) {
  console.warn('[cloudflare] Could not locate fixAppRouterInvalidErrorFunctions anchor; skipping patch.');
  process.exit(0);
}

source = source.replace(anchor, patched);
fs.writeFileSync(target, source);
console.log('[cloudflare] Applied next-on-pages _global-error edge validator patch.');
