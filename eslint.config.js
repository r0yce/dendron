/**
 * ESLint 10 flat config (BL-002 / fully-latest).
 *
 * TypeScript 7: `@typescript-eslint/*` hard-fails on TS 7.0 (support tracking
 * toward ≥7.1 — typescript-eslint#10940). Use `@babel/eslint-parser` so
 * lint-staged can parse TS/TSX without the classic typescript-eslint API.
 *
 * Rules stay relaxed (Prettier owns formatting). Re-introduce typescript-eslint
 * type-aware rules when the plugin supports the installed TypeScript major.
 *
 * Legacy `.eslintrc.js` is reference-only.
 */
const js = require("@eslint/js");
const babelParser = require("@babel/eslint-parser");

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
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          // Direct parser plugin (presets alone are not applied correctly by
          // @babel/eslint-parser for `import type` under Babel 8).
          parserOpts: {
            plugins: [
              "typescript",
              "jsx",
              "classProperties",
              "decorators-legacy",
            ],
          },
        },
        ecmaFeatures: { jsx: true },
      },
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
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
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
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
