/* eslint-disable no-console, global-require, import/no-dynamic-require  */

import { renderOnDOM } from "./bootstrap";

const VALID_NAMES = [
  "DendronNotePreview",
  "SampleComponent",
  "DendronLookupPanel",
  "DendronCalendarPanel",
  "DendronGraphPanel",
  "DendronSchemaGraphPanel",
  "DendronSideGraphPanel",
  "SeedBrowser",
  "DendronConfigure",
];

const elem = window.document.getElementById("root")!;
const VIEW_NAME = elem.getAttribute("data-name")!;

/**
 * Sprint 2 webview split: load only the requested view chunk via dynamic
 * import so calendar/graph/preview do not all pay for each other's code on
 * first paint. Webpack emits async chunks; publicPath "auto" resolves them
 * under vscode-webview:// URIs.
 */
async function boot() {
  if (!VALID_NAMES.includes(VIEW_NAME)) {
    console.log(
      `${VIEW_NAME} is an invalid or empty name. please use one of the following: ${VALID_NAMES.join(
        " "
      )}`
    );
    return;
  }

  console.log("NAME VALID: ", VIEW_NAME);
  const mod = await import(
    /* webpackChunkName: "view-[request]" */
    `./components/${VIEW_NAME}`
  );
  const View = mod.default;
  let props = {
    padding: "inherit",
  };
  if (VIEW_NAME === "DendronNotePreview") {
    props = { padding: "33px" };
  }
  renderOnDOM(View, props);
}

boot().catch((err) => {
  console.error("Failed to load Dendron webview", err);
});

// avoid --isolatedModules error
export {};
