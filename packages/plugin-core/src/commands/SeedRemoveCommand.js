"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedRemoveCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const vscode = __importStar(require("vscode"));
const constants_1 = require("../constants");
const SeedCommandBase_1 = require("./SeedCommandBase");
class SeedRemoveCommand extends SeedCommandBase_1.SeedCommandBase {
    key = constants_1.DENDRON_COMMANDS.SEED_REMOVE.key;
    NO_SEEDS_MSG = "no seeds in the current workspace";
    async gatherInputs() {
        const seeds = this.getSeedSvc().getSeedsInWorkspace();
        if (!seeds || seeds?.length === 0) {
            vscode.window.showInformationMessage(this.NO_SEEDS_MSG);
            return;
        }
        const items = seeds;
        const selected = vscode.window.showQuickPick(items).then((value) => {
            if (!value) {
                return;
            }
            return { seedId: value };
        });
        return selected;
    }
    async execute(_opts) {
        const seeds = this.getSeedSvc().getSeedsInWorkspace();
        if (!seeds || seeds?.length === 0) {
            return {
                error: new common_all_1.DendronError({
                    message: this.NO_SEEDS_MSG,
                    severity: common_all_1.ERROR_SEVERITY.MINOR,
                }),
            };
        }
        const response = vscode.window
            .withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Removing Seed...",
            cancellable: false,
        }, async () => {
            return this.getSeedSvc().removeSeed({
                id: _opts.seedId,
                onUpdatingWorkspace: this.onUpdatingWorkspace,
                onUpdatedWorkspace: this.onUpdatedWorkspace,
            });
        })
            .then((resp) => {
            if (resp?.error) {
                vscode.window.showErrorMessage("Error: ", resp.error.message);
            }
            return resp;
        });
        return response;
    }
}
exports.SeedRemoveCommand = SeedRemoveCommand;
//# sourceMappingURL=SeedRemoveCommand.js.map