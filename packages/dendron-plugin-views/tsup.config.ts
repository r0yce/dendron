import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['cjs', 'esm'],
  dts: false,
  sourcemap: true,
  clean: false,
  splitting: false,
  treeshake: false,
  minify: false,
  bundle: false,
  legacyOutput: false,
  ignoreWatch: ['**/*.test.ts', '**/*-spec.ts', 'src/test/**'],
  // Hybrid strategy (webviews): tsup JS (fast) + adapted tsc types via existing tsconfig (CRA/webpack case). BM-2026-0531-First3 [ref:registry] Group D
});