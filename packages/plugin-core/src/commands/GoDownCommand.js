"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoDownCommand = void 0;
const path_1 = __importDefault(require("path"));
const constants_1 = require("../constants");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
const NoteLookupCommand_1 = require("./NoteLookupCommand");
class GoDownCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.GO_DOWN_HIERARCHY.key;
    async gatherInputs() {
        return {};
    }
    async execute(opts) {
        const maybeTextEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        let value = "";
        if (maybeTextEditor) {
            value = path_1.default.basename(maybeTextEditor.document.uri.fsPath, ".md") + ".";
            if (value === "root.") {
                value = "";
            }
        }
        const out = await new NoteLookupCommand_1.NoteLookupCommand().run({
            initialValue: value,
            noConfirm: opts.noConfirm,
        });
        return out;
    }
}
exports.GoDownCommand = GoDownCommand;
//# sourceMappingURL=GoDownCommand.js.map