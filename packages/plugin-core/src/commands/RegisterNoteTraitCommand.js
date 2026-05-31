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
exports.RegisterNoteTraitCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const UserDefinedTraitV1_1 = require("../traits/UserDefinedTraitV1");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
const noteTraitTemplate = `
/**
 * Define your custom trait behavior in this file by modifying the functions in
 * 'module.exports' below. See
 * https://wiki.dendron.so/notes/EQoaBI8A0ZcswKQC3UMpO/ for examples and
 * documentation.
 *
 * NOTE: This is an alpha feature, so this API may have breaking changes in
 * future releases.
 */

/**
 * @typedef OnCreateContext Properties that can be utilized during note creation
 * @type {object}
 * @property {string} currentNoteName The name of the currently opened Dendron
 * note, or the specified name of the note about to be created
 * @property {string} selectedText Any currently selected text in the editor
 * @property {number} clipboard The current contents of the clipboard
 */

/**
 * @typedef SetNameModifierReturnType Properties that can be utilized during
 * note creation
 * @type {object}
 * @property {string} name The name to use for the note
 * @property {boolean} promptUserForModification if true, the modified name will
 * appear in a lookup control to allow the user to further edit the note name
 * before confirming.
 */

module.exports = {
  OnWillCreate: {
    /**
     * Specify behavior to modify the name of the note.
     * @param {OnCreateContext} props
     * @returns {SetNameModifierReturnType} the name to use for the note. If
     * promptUserForModification is true, the modified name will appear in a
     * lookup control to allow the user to further edit the note name before
     * confirming.
     */
    setNameModifier(props) {
      // This example sets a prefix of 'my-hierarchy', and then adds a date
      // hierarchy using the luxon module. PromptUserForModification is set to
      // true so that the user has the option to alter the title name before
      // creating the note.
      return {
        // luxon is available for Date functions. See
        // https://moment.github.io/luxon/api-docs/index.html for documentation
        name: "my-hierarchy." + luxon.DateTime.local().toFormat("yyyy.MM.dd"),
        promptUserForModification: true,
      };
    },
  },
  OnCreate: {
    /**
     * Specify behavior for altering the title of the note when it is created.
     * @param {OnCreateContext} props
     * @returns {string} the title to set for the note
     */
    setTitle(props) {
      // This example will use the currentNoteName property, extract the
      // yyyy.MM.dd date portion of the note name, and then reformat it with
      // dashes.
      return props.currentNoteName.split(".").slice(-3).join("-");
    },
    /**
     * Set a note template to be applied. This method is optional, uncomment out
     * the lines below if you want to apply a template.
     * @returns the name of the desired template note from this function
     */
    // setTemplate: () => {
    //   return "root";
    // },
  },
};
`;
/**
 * Command for a user to register a new note type with custom functionality.
 * This command is not directly exposed via the command palette, for the user
 * facing command see ConfigureNoteTraitsCommand
 */
class RegisterNoteTraitCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.REGISTER_NOTE_TRAIT.key;
    async gatherInputs() {
        let traitId = await vsCodeUtils_1.VSCodeUtils.showInputBox({
            title: "Create New Note Trait",
            placeHolder: "name of trait",
            validateInput: (value) => {
                return ExtensionProvider_1.ExtensionProvider.getExtension().traitRegistrar.registeredTraits.has(value)
                    ? "Trait ID already exists."
                    : null;
            },
        });
        if (!traitId) {
            return undefined;
        }
        // Clean up and replace any spaces
        traitId = traitId.trim().replace(" ", "-");
        return { traitId };
    }
    async execute(opts) {
        vscode.window.showInformationMessage("Enter Your Trait Functionality");
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        const { wsRoot } = engine;
        const scriptPath = path_1.default.join(wsRoot, common_all_1.CONSTANTS.DENDRON_USER_NOTE_TRAITS_BASE, opts.traitId + ".js");
        fs_extra_1.default.ensureDirSync(path_1.default.dirname(scriptPath));
        if (fs_extra_1.default.existsSync(scriptPath)) {
            const error = common_all_1.DendronError.createPlainError({
                message: `${scriptPath} exists`,
            });
            this.L.error({ error });
            return { error };
        }
        fs_extra_1.default.writeFileSync(scriptPath, noteTraitTemplate);
        const newNoteTrait = new UserDefinedTraitV1_1.UserDefinedTraitV1(opts.traitId, scriptPath);
        try {
            await newNoteTrait.initialize();
        }
        catch (error) {
            const msg = `Error registering note trait ${opts.traitId}\n${error.stack}`;
            this.L.error({
                msg,
            });
        }
        const resp = ExtensionProvider_1.ExtensionProvider.getExtension().traitRegistrar.registerTrait(newNoteTrait);
        if (resp.error) {
            const msg = `Error registering note trait ${opts.traitId}\n${resp.error.innerError?.stack}`;
            this.L.error({
                msg,
            });
        }
        await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode.Uri.file(scriptPath));
        return;
    }
}
exports.RegisterNoteTraitCommand = RegisterNoteTraitCommand;
//# sourceMappingURL=RegisterNoteTraitCommand.js.map