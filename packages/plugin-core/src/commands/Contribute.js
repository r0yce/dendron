"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContributeCommand = void 0;
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const base_1 = require("./base");
class ContributeCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.CONTRIBUTE.key;
    async gatherInputs() {
        return {};
    }
    async execute() {
        vscode_1.env.openExternal(vscode_1.Uri.parse("https://accounts.dendron.so/account/subscribe"));
    }
}
exports.ContributeCommand = ContributeCommand;
//# sourceMappingURL=Contribute.js.map