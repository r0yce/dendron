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
  // Hybrid strategy: tsup handles JS (fast), separate tsc --emitDeclarationOnly handles types (more reliable on large packages)
});