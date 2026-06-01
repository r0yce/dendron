import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts'],
  outDir: 'lib',
  format: ['cjs', 'esm'],
  dts: false, // We handle types via the hybrid script
  sourcemap: true,
  clean: false,
  splitting: false,
  treeshake: false,
  minify: false,
  bundle: false,
  ignoreWatch: ['**/*.test.ts', '**/*-spec.ts'],
});
