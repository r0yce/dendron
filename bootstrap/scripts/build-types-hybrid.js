#!/usr/bin/env node
/**
 * Shared hybrid types builder: tsc emitDeclarationOnly → api-extractor → fallback copy.
 * Usage: node bootstrap/scripts/build-types-hybrid.js <packageDir>
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const pkgDir = path.resolve(process.argv[2] || process.cwd());
const tempDir = path.join(pkgDir, "temp-dts");
const libDir = path.join(pkgDir, "lib");
const pkgName = path.basename(pkgDir);

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getDirSize(startPath) {
  let totalSize = 0;
  let fileCount = 0;
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir)) {
      const fp = path.join(dir, f);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) walk(fp);
      else {
        totalSize += stat.size;
        fileCount++;
      }
    }
  }
  walk(startPath);
  return { bytes: totalSize, files: fileCount, kb: (totalSize / 1024).toFixed(1) };
}

const buildStart = process.hrtime.bigint();
console.log(`[${pkgName}] Building types (hybrid tsc + api-extractor)...`);

if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

console.log("  → Emitting declarations with tsc...");
let tscOk = true;
try {
  execSync("npx tsc -p tsconfig.build.json --emitDeclarationOnly --outDir temp-dts", {
    cwd: pkgDir,
    stdio: "inherit",
    env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=8192" },
  });
} catch {
  tscOk = false;
  console.warn("  → tsc had errors; continuing with partial declarations");
}

let extractorOk = true;
const indexDts = path.join(libDir, "index.d.ts");
if (fs.existsSync(path.join(pkgDir, "api-extractor.json"))) {
  console.log("  → Running api-extractor...");
  try {
    execSync("npx api-extractor run --local", {
      cwd: pkgDir,
      stdio: "inherit",
    });
  } catch {
    extractorOk = false;
    console.warn("  → api-extractor failed; using temp-dts fallback");
  }
} else {
  extractorOk = false;
}

if (!extractorOk || !fs.existsSync(indexDts)) {
  if (fs.existsSync(tempDir)) {
    console.log("  → Copying temp-dts → lib (fallback)...");
    copyDir(tempDir, libDir);
  }
}

if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

const buildDurationMs = Number(process.hrtime.bigint() - buildStart) / 1e6;
const libSize = getDirSize(libDir);
console.log(
  `[${pkgName}] Types complete in ${buildDurationMs.toFixed(0)}ms | lib ${libSize.kb}KB ${libSize.files} files | tsc=${tscOk} extractor=${extractorOk}`
);
if (!fs.existsSync(indexDts)) {
  console.warn(`[${pkgName}] lib/index.d.ts missing; running full tsc emit to lib...`);
  try {
    execSync("npx tsc -p tsconfig.build.json", {
      cwd: pkgDir,
      stdio: "inherit",
      env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=8192" },
    });
  } catch {
    console.warn(`[${pkgName}] full tsc emit had errors (continuing if lib has outputs)`);
  }
}

if (!fs.existsSync(indexDts) && !fs.existsSync(path.join(libDir, "index.js"))) {
  console.error(`[${pkgName}] ERROR: no lib outputs after types build`);
  process.exit(1);
}