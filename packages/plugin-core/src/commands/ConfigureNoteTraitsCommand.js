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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigureNoteTraitsCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
const RegisterNoteTraitCommand_1 = require("./RegisterNoteTraitCommand");
/**
 * Command for a user to register a new note type with custom functionality
 */
class ConfigureNoteTraitsCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.CONFIGURE_NOTE_TRAITS.key;
    createNewOption = "Create New";
    async gatherInputs() {
        const registeredTraits = ExtensionProvider_1.ExtensionProvider.getExtension().traitRegistrar.registeredTraits;
        const items = Array.from(registeredTraits.keys());
        items.unshift(this.createNewOption);
        const picked = await vscode.window.showQuickPick(items, {
            canPickMany: false,
            title: "Select which Note Trait to Configure",
        });
        if ((!picked || !registeredTraits.get(picked)) &&
            picked !== this.createNewOption) {
            return;
        }
        return { traitId: picked };
    }
    async execute(opts) {
        if (opts.traitId === this.createNewOption) {
            new RegisterNoteTraitCommand_1.RegisterNoteTraitCommand().run();
            return;
        }
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        const { wsRoot } = engine;
        const scriptPath = path_1.default.join(wsRoot, common_all_1.CONSTANTS.DENDRON_USER_NOTE_TRAITS_BASE, opts.traitId + ".js");
        if (await fs_extra_1.default.pathExists(scriptPath)) {
            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(scriptPath));
        }
        else {
            const error = common_all_1.DendronError.createPlainError({
                message: `${scriptPath} doesn't exist.`,
            });
            this.L.error({ error });
            return { error };
        }
        return;
    }
}
exports.ConfigureNoteTraitsCommand = ConfigureNoteTraitsCommand;
//# sourceMappingURL=ConfigureNoteTraitsCommand.js.map