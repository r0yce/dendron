"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenLogsCommand = void 0;
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const logger_1 = require("../logger");
const base_1 = require("./base");
const L = logger_1.Logger;
class OpenLogsCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.OPEN_LOGS.key;
    async execute(opts) {
        const ctx = "execute";
        L.info({ ctx, opts });
        const logPath = logger_1.Logger.logPath;
        if (!logPath) {
            throw Error("logPath not defined");
        }
        const doc = await vscode_1.workspace.openTextDocument(vscode_1.Uri.file(logPath));
        vscode_1.window.showTextDocument(doc);
        return;
    }
}
exports.OpenLogsCommand = OpenLogsCommand;
//# sourceMappingURL=OpenLogs.js.map