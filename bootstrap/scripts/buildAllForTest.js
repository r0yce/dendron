/* eslint-disable no-console */

/**
 * CI-oriented build: same dependency order as buildAll.js (yarn workspaces, no lerna).
 * Skips dendron-plugin-views unless TEST_NEXT_TEMPLATE is set.
 */

const execa = require("execa");

const $ = (cmd) => {
  console.log(`$ ${cmd}`);
  return execa.commandSync(cmd, { stdout: process.stdout, buffer: false });
};

const ws = (pkg, script = "buildCI") => {
  $(`yarn workspace ${pkg} run ${script}`);
};

const TEST_NEXT_TEMPLATE = process.env.TEST_NEXT_TEMPLATE;

console.log("build all (CI)...");
ws("@dendronhq/common-all");
ws("@dendronhq/common-di");
ws("@dendronhq/unified");
ws("@dendronhq/common-server");
ws("@dendronhq/dendron-viz");
ws("@dendronhq/engine-server");
ws("@dendronhq/pods-core");
ws("@dendronhq/common-test-utils");
ws("@dendronhq/api-server");
if (TEST_NEXT_TEMPLATE) {
  ws("@dendronhq/common-assets");
}
ws("@dendronhq/common-frontend");
ws("@dendronhq/dendron-cli");
ws("@dendronhq/engine-test-utils");
ws("@dendronhq/plugin-core");

if (TEST_NEXT_TEMPLATE) {
  ws("@dendronhq/dendron-plugin-views", "build");
  $(`yarn dendron dev sync_assets --fast`);
}
console.log("done");