#!/usr/bin/env node
/**
 * Copies pods-core src/*.d.ts into lib/ so @dendronhq/pods-core resolves types
 * when package.json "types" points at lib/index.d.ts (lib/ is gitignored).
 */
const { execSync } = require("child_process");
const path = require("path");

const podsCoreDir = path.resolve(__dirname, "../../pods-core");
execSync(
  "rsync -a --include='*/' --include='*.d.ts' --exclude='*' src/ lib/",
  { cwd: podsCoreDir, stdio: "inherit" }
);