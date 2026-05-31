"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenameNoteV2aCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const utils_1 = require("../components/lookup/utils");
const NoteLookupProviderUtils_1 = require("../components/lookup/NoteLookupProviderUtils");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const FileItem_1 = require("../external/fileutils/FileItem");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
const autoCompleter_1 = require("../utils/autoCompleter");
const AutoCompletableRegistrar_1 = require("../utils/registers/AutoCompletableRegistrar");
/**
 * This is not `Dendron: Rename Note`. For that, See [[../packages/plugin-core/src/commands/RenameNoteCommand.ts]]
 * This is an plugin internal command that is used as part of refactor hierarchy and the rename provider implementation.
 *
 * TODO: refactor this class to avoid confusion.
 * Possibly consolidate renaming logic in one place.
 */
class RenameNoteV2aCommand extends base_1.BaseCommand {
    key = constants_1.DENDRON_COMMANDS.RENAME_NOTE_V2A.key;
    silent;
    async gatherInputs() {
        const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
        const lc = extension.lookupControllerFactory.create({
            nodeType: "note",
            title: "Rename note",
        });
        const provider = extension.noteLookupProviderFactory.create("rename", {
            allowNewNote: true,
        });
        provider.registerOnAcceptHook(utils_1.ProviderAcceptHooks.oldNewLocationHook);
        const initialValue = path_1.default.basename(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "", ".md");
        return new Promise((resolve) => {
            let disposable;
            NoteLookupProviderUtils_1.NoteLookupProviderUtils.subscribe({
                id: "rename",
                controller: lc,
                logger: this.L,
                onDone: (event) => {
                    resolve({ move: event.data.onAcceptHookResp });
                    disposable?.dispose();
                    vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, false);
                },
            });
            lc.show({
                title: "Rename note",
                placeholder: "foo",
                provider,
                initialValue,
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
    async enrichInputs(inputs) {
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        const oldUri = editor.document.uri;
        const vault = utils_1.PickerUtilsV2.getOrPromptVaultForOpenEditor();
        const move = inputs.move[0];
        const fname = move.newLoc.fname;
        const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot });
        const newUri = vscode_1.Uri.file(path_1.default.join(vpath, fname + ".md"));
        return {
            files: [{ oldUri, newUri }],
            silent: false,
            closeCurrentFile: true,
            openNewFile: true,
        };
    }
    async sanityCheck() {
        if (lodash_1.default.isUndefined(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor())) {
            return "No document open";
        }
        return;
    }
    async showResponse(res) {
        const { changed } = res;
        if (changed.length > 0 && !this.silent) {
            vscode_1.window.showInformationMessage(`Dendron updated ${changed.length} files`);
        }
    }
    async execute(opts) {
        const ctx = "RenameNoteV2a";
        this.L.info({ ctx, msg: "enter", opts });
        const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
        try {
            const { files } = opts;
            const { newUri, oldUri } = files[0];
            if (ext.fileWatcher && !opts.noModifyWatcher) {
                ext.fileWatcher.pause = true;
            }
            const engine = ext.getEngine();
            const oldFname = common_all_1.DNodeUtils.fname(oldUri.fsPath);
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vault = common_all_1.VaultUtils.getVaultByFilePath({
                fsPath: oldUri.fsPath,
                wsRoot,
                vaults: engine.vaults,
            });
            const resp = await engine.renameNote({
                oldLoc: {
                    fname: oldFname,
                    vaultName: common_all_1.VaultUtils.getName(vault),
                },
                newLoc: {
                    fname: common_all_1.DNodeUtils.fname(newUri.fsPath),
                    vaultName: common_all_1.VaultUtils.getName(vault),
                },
            });
            const changed = resp.data;
            // re-link
            if (!this.silent) {
                if (opts.closeCurrentFile) {
                    await vsCodeUtils_1.VSCodeUtils.closeCurrentFileEditor();
                }
                if (opts.openNewFile) {
                    await vsCodeUtils_1.VSCodeUtils.openFileInEditor(new FileItem_1.FileItem(files[0].newUri));
                }
            }
            return {
                changed,
            };
        }
        finally {
            if (ext.fileWatcher && !opts.noModifyWatcher) {
                setTimeout(() => {
                    if (ext.fileWatcher) {
                        ext.fileWatcher.pause = false;
                    }
                    this.L.info({ ctx, state: "exit:pause_filewatcher" });
                }, 3000);
            }
            else {
                this.L.info({ ctx, state: "exit" });
            }
        }
    }
}
exports.RenameNoteV2aCommand = RenameNoteV2aCommand;
//# sourceMappingURL=RenameNoteV2a.js.map