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
exports.InsertNoteLinkCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const vscode = __importStar(require("vscode"));
const buttons_1 = require("../components/lookup/buttons");
const NoteLookupProviderUtils_1 = require("../components/lookup/NoteLookupProviderUtils");
const constants_1 = require("../constants");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
const ExtensionProvider_1 = require("../ExtensionProvider");
const autoCompleter_1 = require("../utils/autoCompleter");
const AutoCompletableRegistrar_1 = require("../utils/registers/AutoCompletableRegistrar");
class InsertNoteLinkCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.INSERT_NOTE_LINK.key;
    async gatherInputs(opts) {
        const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
        const config = extension.getDWorkspace().config;
        const insertNoteLinkConfig = common_all_1.ConfigUtils.getCommands(config).insertNoteLink;
        const aliasModeConfig = insertNoteLinkConfig.aliasMode;
        const multiSelectConfig = insertNoteLinkConfig.enableMultiSelect;
        const copts = lodash_1.default.defaults(opts || {}, {
            multiSelect: multiSelectConfig || false,
            aliasMode: aliasModeConfig || "none",
        });
        const lc = extension.lookupControllerFactory.create({
            nodeType: "note",
            disableVaultSelection: true,
            extraButtons: [buttons_1.MultiSelectBtn.create({ pressed: copts.multiSelect })],
        });
        const provider = extension.noteLookupProviderFactory.create(this.key, {
            allowNewNote: false,
            noHidePickerOnAccept: false,
        });
        return new Promise((resolve) => {
            let disposable;
            NoteLookupProviderUtils_1.NoteLookupProviderUtils.subscribe({
                id: this.key,
                controller: lc,
                logger: this.L,
                onDone: (event) => {
                    const data = event.data;
                    resolve({ notes: data.selectedItems, ...copts });
                    disposable?.dispose();
                    vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, false);
                },
            });
            lc.show({
                title: "Select note to link to",
                placeholder: "note",
                provider,
            });
            vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, true);
            disposable = AutoCompletableRegistrar_1.AutoCompletableRegistrar.OnAutoComplete(() => {
                if (lc.quickPick) {
                    lc.quickPick.value = autoCompleter_1.AutoCompleter.getAutoCompletedValue(lc.quickPick);
                    lc.provider.onUpdatePickerItems({
                        picker: lc.quickPick,
                    });
                }
            });
        });
    }
    async promptForAlias(note) {
        const value = await vsCodeUtils_1.VSCodeUtils.showInputBox({
            prompt: `Alias for note link of ${note.fname}. Leave blank to skip aliasing.`,
            ignoreFocusOut: true,
            placeHolder: "alias",
            title: "Type alias",
            value: note.title,
        });
        return value;
    }
    async execute(opts) {
        const ctx = "InsertNoteLinkCommand";
        this.L.info({ ctx, notes: opts.notes.map((n) => common_all_1.NoteUtils.toLogObj(n)) });
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        if (!editor) {
            vscode.window.showErrorMessage("You need to have a note open to insert note links.");
            return opts;
        }
        let links = [];
        switch (opts.aliasMode) {
            case common_all_1.InsertNoteLinkAliasModeEnum.snippet: {
                links = opts.notes.map((note, index) => {
                    return common_all_1.NoteUtils.createWikiLink({
                        note,
                        alias: { mode: "snippet", tabStopIndex: index + 1 },
                    });
                });
                break;
            }
            case common_all_1.InsertNoteLinkAliasModeEnum.selection: {
                let maybeAliasValue = "";
                const { range } = (await vsCodeUtils_1.VSCodeUtils.extractRangeFromActiveEditor()) || {};
                const { text } = vsCodeUtils_1.VSCodeUtils.getSelection();
                maybeAliasValue = text;
                if (!lodash_1.default.isUndefined(range)) {
                    await vsCodeUtils_1.VSCodeUtils.deleteRange(editor.document, range);
                }
                else {
                    vscode.window.showWarningMessage("Selection doesn't contain any text. Ignoring aliases.");
                }
                links = opts.notes.map((note) => {
                    return common_all_1.NoteUtils.createWikiLink({
                        note,
                        alias: { mode: "value", value: maybeAliasValue },
                    });
                });
                break;
            }
            case common_all_1.InsertNoteLinkAliasModeEnum.prompt: {
                for (const note of opts.notes) {
                    // eslint-disable-next-line no-await-in-loop
                    const value = await this.promptForAlias(note);
                    if (value !== "") {
                        links.push(common_all_1.NoteUtils.createWikiLink({
                            note,
                            alias: { mode: "value", value },
                        }));
                    }
                    else {
                        links.push(common_all_1.NoteUtils.createWikiLink({ note, alias: { mode: "none" } }));
                    }
                }
                break;
            }
            case common_all_1.InsertNoteLinkAliasModeEnum.title: {
                links = opts.notes.map((note) => {
                    return common_all_1.NoteUtils.createWikiLink({ note, alias: { mode: "title" } });
                });
                break;
            }
            case common_all_1.InsertNoteLinkAliasModeEnum.none:
            default: {
                links = opts.notes.map((note) => {
                    return common_all_1.NoteUtils.createWikiLink({ note, alias: { mode: "none" } });
                });
                break;
            }
        }
        const current = editor.selection;
        if (opts.aliasMode === common_all_1.InsertNoteLinkAliasModeEnum.snippet) {
            const snippet = new vscode.SnippetString(links.join("\n"));
            await editor.insertSnippet(snippet, current);
        }
        else {
            await editor.edit((builder) => {
                builder.insert(current.start, links.join("\n"));
            });
        }
        return opts;
    }
}
exports.InsertNoteLinkCommand = InsertNoteLinkCommand;
//# sourceMappingURL=InsertNoteLink.js.map