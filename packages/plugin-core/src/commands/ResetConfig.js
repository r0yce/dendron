"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetConfigCommand = void 0;
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const stateService_1 = require("../services/stateService");
const base_1 = require("./base");
const valid = ["local", "global", "all"];
class ResetConfigCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.RESET_CONFIG.key;
    async gatherInputs() {
        const scope = await vscode_1.window.showInputBox({
            prompt: "Select scope",
            ignoreFocusOut: true,
            validateInput: (input) => {
                if (!lodash_1.default.includes(valid, input)) {
                    return `input must be one of ${valid.join(", ")}`;
                }
                return undefined;
            },
            value: "all",
        });
        if (!scope) {
            return;
        }
        return { scope };
    }
    async execute(opts) {
        const scope = opts.scope;
        const stateService = stateService_1.StateService.instance();
        if (scope === "all") {
            stateService.resetGlobalState();
            stateService.resetWorkspaceState();
        }
        else if (scope === "global") {
            stateService.resetGlobalState();
        }
        else if (scope === "local") {
            stateService.resetWorkspaceState();
        }
        else {
            throw Error(`wrong scope: ${opts}`);
        }
        vscode_1.window.showInformationMessage(`reset config`);
        return;
    }
}
exports.ResetConfigCommand = ResetConfigCommand;
//# sourceMappingURL=ResetConfig.js.map