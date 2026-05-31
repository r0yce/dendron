"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateNoteCommand = void 0;
const constants_1 = require("../constants");
const logger_1 = require("../logger");
const base_1 = require("./base");
const NoteLookupCommand_1 = require("./NoteLookupCommand");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const analytics_1 = require("../utils/analytics");
const ExtensionProvider_1 = require("../ExtensionProvider");
class CreateNoteCommand extends base_1.InputArgCommand {
    key = constants_1.DENDRON_COMMANDS.CREATE_NOTE.key;
    async execute(opts) {
        const ctx = "CreateNoteCommand";
        logger_1.Logger.info({ ctx, msg: "enter", opts });
        const args = {};
        /**
         * If the command is ran from Tree View, update the initial value in lookup to
         * selected tree item's fname. The opts passed is the id of note
         */
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        if (lodash_1.default.isString(opts)) {
            const resp = await engine.getNoteMeta(opts);
            args.initialValue = resp.data?.fname || "";
            analytics_1.AnalyticsUtils.track(this.key, { source: "TreeView" });
        }
        vscode_1.window.showInformationMessage("💡 Tip: Enter `Ctrl+L` / `Cmd+L` to open the lookup bar!");
        return {
            lookup: new NoteLookupCommand_1.NoteLookupCommand().run(args),
        };
    }
}
exports.CreateNoteCommand = CreateNoteCommand;
//# sourceMappingURL=CreateNoteCommand.js.map