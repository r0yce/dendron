import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: false,
  splitting: false,
  treeshake: false,
  minify: false,
  bundle: false,
  legacyOutput: false,
  ignoreWatch: ['**/*.test.ts', '**/*-spec.ts', 'src/test/**'],
  // BM-2026-0531-First3 [ref:registry] hybrid (tsup JS + tsc types) per Wave 2 Group C. Minimal.
});