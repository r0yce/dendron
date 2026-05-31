"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowHelpCommand = void 0;
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const base_1 = require("./base");
class ShowHelpCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.SHOW_HELP.key;
    async gatherInputs() {
        return {};
    }
    async execute() {
        vscode_1.env.openExternal(vscode_1.Uri.parse("https://www.dendron.so/notes/f9540bb6-7a5a-46db-ae7c-e1a606f28c73.html"));
    }
}
exports.ShowHelpCommand = ShowHelpCommand;
//# sourceMappingURL=ShowHelp.js.map