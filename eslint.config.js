/**
 * ESLint 10 flat config (BL-002).
 *
 * Why not full Airbnb/React via FlatCompat?
 * - `eslint-plugin-react@7.37` only declares peer support through ESLint 9.7.
 * - Under ESLint 10 it throws: `contextOrFilename.getFilename is not a function`.
 *
 * This config restores pre-commit / lint-staged with a TypeScript-aware,
 * style-relaxed rule set that matches the project's historical "don't care"
 * posture (most stylistic rules off; Prettier owns formatting).
 *
 * When eslint-plugin-react + airbnb officially support ESLint 10, we can
 * re-introduce FlatCompat extends. Until then, this keeps `husky` green.
 *
 * Legacy `.eslintrc.js` is reference-only (ESLint 10 ignores it).
 */
const js = require("@eslint/js");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");

module.exports = [
  {
    ignores: [
      "**/node_modules/**",
      "**/lib/**",
      "**/out/**",
      "**/dist/**",
      "**/coverage/**",
      "**/build/**",
      "vendor/**",
      "docs/**",
      "github-archive/**",
      "test-workspace/**",
      "packages/engine-server/src/drivers/generated-prisma-client/**",
      "packages/engine-server/src/generated-prisma-client/**",
      "packages/common-assets/assets/**",
      "packages/dendron-plugin-views/build/**",
      "packages/nextjs-template/.next/**",
      "packages/nextjs-template/out/**",
      "**/*.min.js",
      "**/*.d.ts",
      "**/*.js.map",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,cjs,mjs,ts,tsx,jsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Node + browser hybrid monorepo
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "writable",
        global: "readonly",
        globalThis: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        JSX: "readonly",
        React: "readonly",
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // Match historical dendron .eslintrc posture: formatting via prettier, low noise
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-undef": "off", // TypeScript handles this
      "no-redeclare": "off",
      "no-empty": "off",
      "no-constant-condition": "off",
      "no-case-declarations": "off",
      "no-fallthrough": "off",
      "no-useless-escape": "off",
      "no-prototype-builtins": "off",
      "no-cond-assign": "off",
      "no-control-regex": "off",
      "no-sparse-arrays": "off",
      "no-func-assign": "off",
      "no-inner-declarations": "off",
      "getter-return": "off",
      "valid-typeof": "off",
      "no-unsafe-finally": "off",
      "no-extra-boolean-cast": "off",
      "no-useless-catch": "off",
      "no-async-promise-executor": "off",
      "no-misleading-character-class": "off",
      "require-yield": "off",
    },
  },
];
