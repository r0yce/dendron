/* eslint-disable no-console */

/**
 * Compiles all packages for local development (yarn workspaces; no lerna).
 */

const { execaCommandSync } = require("execa");

const $ = (cmd) => {
  console.log(`$ ${cmd}`);
  return execaCommandSync(cmd, { stdio: "inherit" });
};

const ws = (pkg, script = "build") => {
  $(`yarn workspace ${pkg} run ${script}`);
};

console.log("building all...");
ws("@dendronhq/common-all");
ws("@dendronhq/common-di");
ws("@dendronhq/unified");
ws("@dendronhq/common-server");
ws("@dendronhq/dendron-viz");
ws("@dendronhq/engine-server");
ws("@dendronhq/pods-core");
ws("@dendronhq/common-test-utils");
ws("@dendronhq/api-server");
ws("@dendronhq/common-assets");
ws("@dendronhq/common-frontend");
ws("@dendronhq/dendron-cli");
ws("@dendronhq/engine-test-utils");
ws("@dendronhq/dendron-plugin-views");
ws("@dendronhq/plugin-core");
$(`yarn dendron dev sync_assets --fast`);
console.log("done");