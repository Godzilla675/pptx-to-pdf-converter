/**
 * Copies tesseract.js worker, core WASM, and language data files
 * from node_modules to public/tesseract-data/ so they can be served
 * locally by Vite instead of fetched from CDN at runtime.
 */
import { mkdirSync, copyFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dest = resolve(root, 'public', 'tesseract-data');
const langDest = resolve(dest, 'lang');

mkdirSync(langDest, { recursive: true });

const filesToCopy = [
  ['node_modules/tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm', 'tesseract-core-simd-lstm.wasm'],
  ['node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-lstm.wasm', 'tesseract-core-lstm.wasm'],
  ['node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm', 'tesseract-core-relaxedsimd-lstm.wasm'],
  ['node_modules/tesseract.js-core/tesseract-core-relaxedsimd.wasm.js', 'tesseract-core-relaxedsimd.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-relaxedsimd.wasm', 'tesseract-core-relaxedsimd.wasm'],
];

const langFiles = [
  ['node_modules/@tesseract.js-data/eng/4.0.0/eng.traineddata.gz', 'lang/eng.traineddata.gz'],
];

for (const [src, destFile] of [...filesToCopy, ...langFiles]) {
  const srcPath = resolve(root, src);
  const destPath = resolve(dest, destFile);
  if (existsSync(srcPath)) {
    copyFileSync(srcPath, destPath);
  } else {
    console.warn(`Warning: ${src} not found, skipping`);
  }
}

console.log('Tesseract.js files copied to public/tesseract-data/');
