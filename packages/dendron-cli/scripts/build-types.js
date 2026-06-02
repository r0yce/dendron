#!/usr/bin/env node
const path = require("path");
const { execSync } = require("child_process");
const script = path.resolve(__dirname, "../../../bootstrap/scripts/build-types-hybrid.js");
const pkgDir = path.resolve(__dirname, "..");
execSync(`node "${script}" "${pkgDir}"`, { stdio: "inherit" });