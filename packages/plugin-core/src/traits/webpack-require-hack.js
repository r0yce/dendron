"use strict";
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
// @ts-expect-error - webpack require hack for trait hot-reload/debug only (dynamic require + node module cache delete; not used in prod webpack bundle which has separate .js at PROJECT_ROOT/...). Mixed CJS/interop in dev tooling env; never bare per ts-expect-error-burner SKILL "Final Post-M2 + Doctor Smoke Burn" (2026-06-01). See traits/ system + webpack config. 0 bare upheld. (Legacy vendored pattern.)
// NOTE: This file is ONLY used during debugging. In the webpacked production
// build, the file that is used is the version located at
// PROJECT_ROOT/packages/plugin-core/webpack-require-hack.js
const webpackRequire = (importPath) => {
    // First delete the import from the node module cache in case it exists. This
    // allows us to do 'hot-reloading' of the .js files in Traits.
    delete require.cache[require.resolve(importPath)];
    const module = require(importPath);
    return module;
};
module.exports = webpackRequire;
//# sourceMappingURL=webpack-require-hack.js.map