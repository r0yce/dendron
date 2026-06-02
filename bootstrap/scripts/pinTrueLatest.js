#!/usr/bin/env node
/**
 * Pin external dependencies to exact npm "latest" versions (true latest).
 * Skips @dendronhq/* workspace packages and non-registry specifiers.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const WORKSPACE_PACKAGES = [
  "package.json",
  "packages/common-all/package.json",
  "packages/common-di/package.json",
  "packages/common-assets/package.json",
  "packages/common-server/package.json",
  "packages/common-test-utils/package.json",
  "packages/common-frontend/package.json",
  "packages/dendron-viz/package.json",
  "packages/engine-server/package.json",
  "packages/api-server/package.json",
  "packages/engine-test-utils/package.json",
  "packages/pods-core/package.json",
  "packages/dendron-cli/package.json",
  "packages/nextjs-template/package.json",
  "packages/plugin-core/package.json",
  "packages/dendron-plugin-views/package.json",
  "packages/unified/package.json",
  "packages/common-assets/package.json",
];

// Security-pinned packages: keep explicit CVE mitigation versions.
const RESOLUTION_PIN_EXEMPT = new Set(["trim", "d3-color"]);

const SECTIONS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

const versionCache = new Map();

function shouldSkip(name, spec) {
  if (name.startsWith("@dendronhq/")) return true;
  if (!spec || typeof spec !== "string") return true;
  if (
    spec.startsWith("file:") ||
    spec.startsWith("link:") ||
    spec.startsWith("workspace:") ||
    spec.includes("/")
  ) {
    return true;
  }
  return false;
}

function parseBareMajor(spec) {
  const m = spec.match(/^(\d+)$/);
  return m ? m[1] : null;
}

function getLatestVersion(name, spec) {
  const cacheKey = `${name}@${spec}`;
  if (versionCache.has(cacheKey)) {
    return versionCache.get(cacheKey);
  }

  const major = parseBareMajor(spec);
  let cmd;
  if (major) {
    cmd = `npm view ${JSON.stringify(name)}@${major} version --json`;
  } else {
    cmd = `npm view ${JSON.stringify(name)} version --json`;
  }

  let out;
  try {
    out = execSync(cmd, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    versionCache.set(cacheKey, null);
    return null;
  }

  let version = out;
  if (out.startsWith("[")) {
    const parsed = JSON.parse(out);
    version = Array.isArray(parsed) ? parsed[parsed.length - 1] : parsed;
  }
  version = String(version).replace(/^["']|["']$/g, "");
  versionCache.set(cacheKey, version);
  return version;
}

function pinSection(section, changes) {
  if (!section) return;
  for (const [name, spec] of Object.entries(section)) {
    if (shouldSkip(name, spec)) continue;

    const latest = getLatestVersion(name, spec);
    if (!latest) continue;

    if (spec !== latest) {
      changes.push({ name, from: spec, to: latest });
      section[name] = latest;
    }
  }
}

function pinPackageJson(relPath) {
  const filePath = path.join(ROOT, relPath);
  const pkg = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const changes = [];

  for (const sectionName of SECTIONS) {
    pinSection(pkg[sectionName], changes);
  }

  if (changes.length > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify(pkg, null, 2)}\n`);
  }

  return { relPath, changes };
}

function pinResolutions() {
  const filePath = path.join(ROOT, "package.json");
  const pkg = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const changes = [];
  if (pkg.resolutions) {
    for (const [name, spec] of Object.entries(pkg.resolutions)) {
      if (RESOLUTION_PIN_EXEMPT.has(name) || shouldSkip(name, spec)) continue;
      const latest = getLatestVersion(name, spec);
      if (!latest || spec === latest) continue;
      changes.push({ name, from: spec, to: latest });
      pkg.resolutions[name] = latest;
    }
  }
  if (changes.length > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify(pkg, null, 2)}\n`);
  }
  return changes;
}

function main() {
  const results = WORKSPACE_PACKAGES.map(pinPackageJson);
  let total = 0;
  for (const { relPath, changes } of results) {
    if (changes.length === 0) continue;
    console.log(`\n${relPath} (${changes.length} pins):`);
    for (const c of changes) {
      console.log(`  ${c.name}: ${c.from} → ${c.to}`);
      total += 1;
    }
  }
  const resolutionChanges = pinResolutions();
  if (resolutionChanges.length > 0) {
    console.log(`\npackage.json resolutions (${resolutionChanges.length} pins):`);
    for (const c of resolutionChanges) {
      console.log(`  ${c.name}: ${c.from} → ${c.to}`);
      total += 1;
    }
  }
  console.log(`\nPinned ${total} dependencies to true latest.`);
}

main();