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
exports.CommandRegistrar = void 0;
const vscode = __importStar(require("vscode"));
const CreateNoteWithTraitCommand_1 = require("../commands/CreateNoteWithTraitCommand");
/**
 * Manages registration of new VS Code commands. This service is intended for
 * use of dynamically created (and registered) commands. Static commands that
 * are registered onActivate() should not use this class
 */
class CommandRegistrar {
    _extension;
    context;
    disposables;
    CUSTOM_COMMAND_PREFIX = "dendron.customCommand.";
    registeredCommands;
    constructor(extension) {
        this._extension = extension;
        this.context = extension.context;
        this.registeredCommands = {};
        this.disposables = {};
    }
    registerCommandForTrait(trait) {
        const commandId = trait.id;
        const cmd = new CreateNoteWithTraitCommand_1.CreateNoteWithTraitCommand(this._extension, commandId, trait);
        const registeredCmdName = this.CUSTOM_COMMAND_PREFIX + commandId;
        this.registeredCommands[commandId] = registeredCmdName;
        const disp = vscode.commands.registerCommand(registeredCmdName, () => cmd.run(), this);
        this.context.subscriptions.push(disp);
        this.disposables[commandId] = disp;
        return registeredCmdName;
    }
    unregisterTrait(trait) {
        if (trait.id in this.registeredCommands) {
            delete this.registeredCommands[trait.id];
        }
        if (trait.id in this.disposables) {
            this.disposables[trait.id]?.dispose();
            delete this.disposables[trait.id];
        }
    }
}
exports.CommandRegistrar = CommandRegistrar;
//# sourceMappingURL=CommandRegistrar.js.map