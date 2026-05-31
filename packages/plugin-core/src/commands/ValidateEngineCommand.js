"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateEngineCommand = void 0;
const common_server_1 = require("@dendronhq/common-server");
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const base_1 = require("./base");
const L = logger_1.Logger;
class ValidateEngineCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.VALIDATE_ENGINE.key;
    async execute(opts) {
        const ctx = "execute";
        L.info({ ctx, opts });
        const logPath = logger_1.Logger.logPath;
        if (!logPath) {
            throw Error("logPath not defined");
        }
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        const responses = await common_server_1.StateValidator.validateEngineState(engine);
        responses.map((resp) => {
            if (resp.error) {
                vscode_1.window.showErrorMessage(resp.error.message);
            }
        });
    }
    async showResponse() {
        vscode_1.window.showInformationMessage("Finished validating engine");
    }
}
exports.ValidateEngineCommand = ValidateEngineCommand;
//# sourceMappingURL=ValidateEngineCommand.js.map