/**
 * Adds --skip-validation to @cloudflare/next-on-pages so Cloudflare builds can bypass
 * the /_global-error (and other latent Node stub) edge-runtime false-positive.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PATCH_MARKER = 'CURASYNC_SKIP_VALIDATION_PATCH';

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

let source = fs.readFileSync(target, 'utf8');

if (source.includes(PATCH_MARKER)) {
  console.log('[cloudflare] next-on-pages --skip-validation patch already applied.');
  process.exit(0);
}

const replacements = [
  [
    ').option(\n  "-s, --skip-build",\n  "Skips the application Vercel build process (only runs the @cloudflare/next-on-pages build logic)"\n).option(',
    `).option(
  "-s, --skip-build",
  "Skips the application Vercel build process (only runs the @cloudflare/next-on-pages build logic)"
).option(
  "--skip-validation",
  "Skips edge runtime validation for serverless functions (ignores invalid Node stubs such as /_global-error)"
).option(`,
  ],
  [
    `async function buildApplication({
  skipBuild,
  disableChunksDedup,
  disableWorkerMinification,
  watch: watch2,
  outdir: outputDir,
  customEntrypoint
}) {`,
    `async function buildApplication({
  skipBuild,
  skipValidation,
  disableChunksDedup,
  disableWorkerMinification,
  watch: watch2,
  outdir: outputDir,
  customEntrypoint
}) {`,
  ],
  [
    `await prepareAndBuildWorker(outputDir, {
    disableChunksDedup,
    disableWorkerMinification,
    customEntrypoint
  });`,
    `await prepareAndBuildWorker(outputDir, {
    disableChunksDedup,
    disableWorkerMinification,
    customEntrypoint,
    skipValidation
  });`,
  ],
  [
    `async function prepareAndBuildWorker(outputDir, {
  disableChunksDedup,
  disableWorkerMinification,
  customEntrypoint
}) {`,
    `async function prepareAndBuildWorker(outputDir, {
  disableChunksDedup,
  disableWorkerMinification,
  customEntrypoint,
  skipValidation
}) {`,
  ],
  [
    `processedFunctions = await processVercelFunctions({
      functionsDir: functionsDir2,
      outputDir,
      workerJsDir,
      nopDistDir,
      disableChunksDedup,
      vercelConfig
    });`,
    `processedFunctions = await processVercelFunctions({
      functionsDir: functionsDir2,
      outputDir,
      workerJsDir,
      nopDistDir,
      disableChunksDedup,
      vercelConfig,
      skipValidation
    });`,
  ],
  [
    `  if (collectedFunctions.invalidFunctions.size > 0) {
    await printInvalidFunctionsErrorMessage(
      collectedFunctions.invalidFunctions
    );
    process.exit(1);
  }`,
    `  if (collectedFunctions.invalidFunctions.size > 0) {
    if (opts.skipValidation) {
      cliWarn(
        \`Skipping edge runtime validation for \${collectedFunctions.invalidFunctions.size} function(s) (--skip-validation). ${PATCH_MARKER}\`,
        { spaced: true }
      );
      return;
    }
    await printInvalidFunctionsErrorMessage(
      collectedFunctions.invalidFunctions
    );
    process.exit(1);
  }`,
  ],
];

for (const [needle, replacement] of replacements) {
  if (!source.includes(needle)) {
    console.warn('[cloudflare] Patch anchor not found; next-on-pages version may differ.');
    console.warn('[cloudflare] Missing anchor preview:', needle.slice(0, 80));
    process.exit(1);
  }
  source = source.replace(needle, replacement);
}

fs.writeFileSync(target, source);
console.log('[cloudflare] Applied next-on-pages --skip-validation patch.');
