import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts'],
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
  // Exclude test files
  ignoreWatch: ['**/*.test.ts', '**/*-spec.ts'],
});