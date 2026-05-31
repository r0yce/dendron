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
exports.CreateNoteWithUserDefinedTrait = void 0;
const common_all_1 = require("@dendronhq/common-all");
const vscode = __importStar(require("vscode"));
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const TraitUtils_1 = require("../traits/TraitUtils");
const base_1 = require("./base");
const RegisterNoteTraitCommand_1 = require("./RegisterNoteTraitCommand");
/**
 * Command that can create a new noted with the specified user-defined custom
 * note traits. This will find the registered {@link CreateNoteWithTraitCommand}
 * command corresponding to the passed in type and execute it, if the command
 * exists.
 */
class CreateNoteWithUserDefinedTrait extends base_1.BaseCommand {
    key = constants_1.DENDRON_COMMANDS.CREATE_USER_DEFINED_NOTE.key;
    async gatherInputs() {
        if (!TraitUtils_1.TraitUtils.checkWorkspaceTrustAndWarn()) {
            return;
        }
        const registeredTraits = ExtensionProvider_1.ExtensionProvider.getExtension().traitRegistrar.registeredTraits;
        if (registeredTraits.size === 0) {
            const createOption = "Create Trait";
            const response = await vscode.window.showErrorMessage("No registered traits. Create a trait first before running this command.", createOption);
            if (response === createOption) {
                const cmd = new RegisterNoteTraitCommand_1.RegisterNoteTraitCommand();
                cmd.run();
            }
        }
        const items = registeredTraits.keys();
        const picked = await vscode.window.showQuickPick(Array.from(items), {
            canPickMany: false,
            title: "Select a Note Trait",
        });
        if (!picked || !registeredTraits.get(picked)) {
            return;
        }
        return { trait: registeredTraits.get(picked) };
    }
    async enrichInputs(inputs) {
        return {
            trait: inputs.trait,
        };
    }
    async execute(opts) {
        const cmd = ExtensionProvider_1.ExtensionProvider.getExtension().traitRegistrar.getRegisteredCommandForTrait(opts.trait);
        if (!cmd) {
            throw new common_all_1.DendronError({ message: "Unexpected unregistered type" });
        }
        await vscode.commands.executeCommand(cmd);
        return opts;
    }
}
exports.CreateNoteWithUserDefinedTrait = CreateNoteWithUserDefinedTrait;
//# sourceMappingURL=CreateNoteWithUserDefinedTrait.js.map