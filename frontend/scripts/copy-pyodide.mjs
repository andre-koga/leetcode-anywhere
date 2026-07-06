// Copies the Pyodide core runtime from node_modules into public/pyodide so the
// app can self-host it (required for offline execution - no CDN calls).
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pyodideDir = dirname(require.resolve('pyodide/package.json'));
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'pyodide');

const files = [
  'pyodide.mjs',
  'pyodide.asm.mjs',
  'pyodide.asm.wasm',
  'python_stdlib.zip',
  'pyodide-lock.json',
];

mkdirSync(outDir, { recursive: true });
for (const file of files) {
  const src = join(pyodideDir, file);
  if (!existsSync(src)) {
    console.error(`copy-pyodide: missing ${src}`);
    process.exit(1);
  }
  cpSync(src, join(outDir, file));
}
console.log(`copy-pyodide: copied ${files.length} files to public/pyodide`);
