"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
/**
 * Simple script to fire an uninstall analytics event during the
 * vscode:uninstall hook execution that runs after the extension has been
 * uninstalled. NOTE: we cannot use @see {@link AnalyticsUtils}, as that
 * requires vscode, which is unavailable during the execution of the uninstall
 * hook.
 */
async function main() {
    common_server_1.SegmentClient.instance().track({ event: common_all_1.VSCodeEvents.Uninstall });
    // Force an upload flush():
    common_server_1.SegmentClient.instance().identify();
}
main();
//# sourceMappingURL=uninstallHook.js.map