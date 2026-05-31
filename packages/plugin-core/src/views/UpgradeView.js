"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showUpgradeView = showUpgradeView;
const common_all_1 = require("@dendronhq/common-all");
const vscode_1 = __importDefault(require("vscode"));
const analytics_1 = require("../utils/analytics");
const utils_1 = require("./utils");
const UPGRADE_VIEW_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>"Release Notes"</title>
  <style>
    html, body, iframe {
      margin: 0;
      padding: 0;
      border: 0;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <iframe id="iframeView" src="https://wiki.dendron.so/notes/9bc92432-a24c-492b-b831-4d5378c1692b/"></iframe>
</body>

</html>`;
/**
 * This was an attempt at a webview that displays the changelog.
 *
 * There are a few known issues with this view:
 * - It displays the entire changelog page, which includes the entire history
 *   and not just what was changed
 * - It's hard to collect any telemetry from the view because of VSCode/iframe
 *   security policies
 * - The displayed page doesn't function properly because VSCode disables
 *   javascript inside of it
 * - Clicking any link inside the view opens that page inside the view as well,
 *   rather than opening it with the default browser
 *
 * As a result, we decided to not roll out this view. If we ever decide to
 * reintroduce this, consider the bugs above.
 *
 * */
function showUpgradeView() {
    const panel = vscode_1.default.window.createWebviewPanel("releaseNotes", "Release Notes", vscode_1.default.ViewColumn.One, {});
    panel.webview.html = UPGRADE_VIEW_HTML;
    utils_1.WebViewUtils.openWebviewAndMeasureTimeOpen(panel, (duration) => {
        analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.UpgradeViewClosed, {
            timeOpen: duration,
        });
    });
}
//# sourceMappingURL=UpgradeView.js.map