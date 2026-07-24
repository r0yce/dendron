#!/usr/bin/env bash
# Reliable F5 path for Dendron Personal (plugin-core).
# package.json "main" → ./out/src/extension.js  (tsc output)
#
# Usage (from packages/plugin-core):
#   ./scripts/dev-extension.sh
#
# Then launch "Run Dendron Extension (Desktop, No Precompile)" in VS Code.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "→ yarn compile (tsc → out/)"
yarn compile
echo "→ done. F5 / Run Extension Development Host now loads out/src/extension.js"
echo "  Optional: yarn webpack:dev:watch  for dist/ packaging builds"
