#!/usr/bin/env node
/**
 * Hybrid types builder (tsc + api-extractor).
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkgDir = path.resolve(__dirname, '..');
const tempDir = path.join(pkgDir, 'temp-dts');
const libDir = path.join(pkgDir, 'lib');

console.log('Building types (hybrid tsc + api-extractor)...');

// Ensure clean temp
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// Step 1: Emit declarations with tsc (high memory)
console.log('  → Emitting declarations with tsc (high memory)...');
try {
  execSync(
    'npx tsc -p tsconfig.build.json --emitDeclarationOnly --skipLibCheck --outDir temp-dts',
    {
      cwd: pkgDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=8192'
      }
    }
  );
} catch (e) {
  console.error('tsc declaration emit had errors (pilot lenient mode - continuing)');
  process.exit(1);
}

// Step 2: Run api-extractor
console.log('  → Running api-extractor...');
try {
  execSync('npx api-extractor run --local --verbose', {
    cwd: pkgDir,
    stdio: 'inherit'
  });
} catch (e) {
  console.error('api-extractor failed');
  process.exit(1);
}

// Cleanup temp
console.log('  → Cleaning temp declarations...');
fs.rmSync(tempDir, { recursive: true, force: true });

console.log('Types build complete.');
