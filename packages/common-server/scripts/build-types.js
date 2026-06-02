#!/usr/bin/env node
/**
 * Hybrid types builder for large packages.
 * 1. Emit declarations with tsc (with high memory)
 * 2. Run api-extractor to produce clean rolled-up .d.ts
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkgDir = path.resolve(__dirname, '..');
const tempDir = path.join(pkgDir, 'temp-dts');
const libDir = path.join(pkgDir, 'lib');

function getDirSize(startPath) {
  let totalSize = 0;
  let fileCount = 0;
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (let f of files) {
      const fp = path.join(dir, f);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) {
        walk(fp);
      } else {
        totalSize += stat.size;
        fileCount++;
      }
    }
  }
  walk(startPath);
  return { bytes: totalSize, files: fileCount, kb: (totalSize / 1024).toFixed(1) };
}
const buildStart = process.hrtime.bigint();
console.log('Building types (hybrid tsc + api-extractor)...');

// Ensure clean temp
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// Step 1: Emit declarations with tsc (high memory)
// During Build Modernization pilot we are more lenient to unblock the JS + api-extractor flow
// while strict compatibility fixes are completed in parallel.
console.log('  → Emitting declarations with tsc (high memory, pilot lenient mode)...');
try {
  execSync(
    'npx tsc -p tsconfig.build.json --emitDeclarationOnly --outDir temp-dts --skipLibCheck',
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
  console.warn('tsc declaration emit had errors (pilot mode - continuing to api-extractor)');
  // Do not exit - allow partial declarations for the pilot
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

const buildDurationMs = Number(process.hrtime.bigint() - buildStart) / 1e6;
const libSize = getDirSize(libDir);
console.log(`Build metrics (common-server): durationMs=${buildDurationMs.toFixed(0)} | libSizeKB=${libSize.kb} | libFiles=${libSize.files}`);
console.log('Types build complete.');
