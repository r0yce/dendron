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
exports.BaseExportPodCommand = void 0;
/* eslint-disable no-await-in-loop */
const common_all_1 = require("@dendronhq/common-all");
const pods_core_1 = require("@dendronhq/pods-core");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const PodControls_1 = require("../../components/pods/PodControls");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const base_1 = require("../base");
/**
 * Abstract base class for export pod commands. This class will defer input
 * gathering to derived classes.  In EnrichInputs(), it is responsible for
 * gathering the appropriate input payload. Finally, in execute(), it will
 * construct the derived class' corresponding Pod, and invoke the appropriate
 * export() function based on the specified export scope.
 * @template Config - the type of {@link RunnablePodConfigV2} for the export operation
 * @template R - the return type of the export() operation
 */
class BaseExportPodCommand extends base_1.BaseCommand {
    hierarchySelector;
    _onEngineNoteStateChangedDisposable;
    extension;
    /**
     *
     * @param hierarchySelector a user control that can return a selected
     * hierarchy to export. Should use {@link QuickPickHierarchySelector} by
     * default
     */
    constructor(hierarchySelector, extension) {
        super();
        this.hierarchySelector = hierarchySelector;
        this.extension = extension;
    }
    /**
     * checks if the destination is compatible with export scope
     */
    multiNoteExportCheck(opts) {
        if (opts.destination === "clipboard" &&
            opts.exportScope !== pods_core_1.PodExportScope.Note &&
            opts.exportScope !== pods_core_1.PodExportScope.Selection) {
            throw new common_all_1.DendronError({
                message: "Multi Note Export cannot have clipboard as destination. Please configure your destination by using Dendron: Configure Export Pod V2 command",
            });
        }
    }
    dispose() {
        if (this._onEngineNoteStateChangedDisposable) {
            this._onEngineNoteStateChangedDisposable.dispose();
            this._onEngineNoteStateChangedDisposable = undefined;
        }
    }
    /**
     * Gather the appropriate input payload based on the specified export scope.
     * @param inputs
     * @returns
     */
    async enrichInputs(inputs) {
        let payload;
        switch (inputs.exportScope) {
            case pods_core_1.PodExportScope.Lookup:
            case pods_core_1.PodExportScope.LinksInSelection: {
                const scope = await PodControls_1.PodUIControls.promptForScopeLookup({
                    fromSelection: inputs.exportScope === pods_core_1.PodExportScope.LinksInSelection,
                    key: this.key,
                    logger: this.L,
                });
                if (scope === undefined) {
                    vscode.window.showErrorMessage("Unable to get notes payload.");
                    return;
                }
                payload = scope.selectedItems.map((item) => {
                    return lodash_1.default.omit(item, ["label", "detail", "alwaysShow"]);
                });
                if (!payload) {
                    vscode.window.showErrorMessage("Unable to get notes payload.");
                    return;
                }
                break;
            }
            case pods_core_1.PodExportScope.Note: {
                payload = await this.getPropsForNoteScope();
                if (!payload) {
                    vscode.window.showErrorMessage("Unable to get note payload.");
                    return;
                }
                break;
            }
            case pods_core_1.PodExportScope.Hierarchy: {
                payload = await this.getPropsForHierarchyScope();
                if (!payload) {
                    vscode.window.showErrorMessage("Unable to get hierarchy payload.");
                    return;
                }
                break;
            }
            case pods_core_1.PodExportScope.Vault: {
                const vault = await PodControls_1.PodUIControls.promptForVaultSelection();
                if (!vault) {
                    vscode.window.showErrorMessage("Unable to get vault payload.");
                    return;
                }
                payload = await this.getPropsForVaultScope(vault);
                if (!payload) {
                    vscode.window.showErrorMessage("Unable to get vault payload.");
                    return;
                }
                break;
            }
            case pods_core_1.PodExportScope.Workspace: {
                payload = await this.getPropsForWorkspaceScope();
                if (!payload) {
                    vscode.window.showErrorMessage("Unable to get workspace payload.");
                    return;
                }
                break;
            }
            case pods_core_1.PodExportScope.Selection: {
                payload = await this.getPropsForSelectionScope();
                if (!payload) {
                    return;
                }
                break;
            }
            default:
                (0, common_all_1.assertUnreachable)(inputs.exportScope);
        }
        return {
            payload,
            config: inputs,
        };
    }
    /**
     * Construct the pod and perform export for the appropriate payload scope.
     * @param opts
     */
    async execute(opts) {
        pods_core_1.PodUtils.validate(opts.config, this.getRunnableSchema());
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Running Export ",
            cancellable: true,
        }, async (_progress, token) => {
            token.onCancellationRequested(() => {
                return;
            });
            switch (opts.config.exportScope) {
                case pods_core_1.PodExportScope.Note:
                case pods_core_1.PodExportScope.Selection:
                    this.saveActiveDocumentBeforeExporting(opts);
                    break;
                case pods_core_1.PodExportScope.Vault:
                case pods_core_1.PodExportScope.Lookup:
                case pods_core_1.PodExportScope.LinksInSelection:
                case pods_core_1.PodExportScope.Hierarchy:
                case pods_core_1.PodExportScope.Workspace: {
                    await this.executeExportNotes(opts, _progress);
                    break;
                }
                default:
                    (0, common_all_1.assertUnreachable)(opts.config.exportScope);
            }
        });
    }
    /**
     * Gets notes matching the selected hierarchy(for a specefic vault)
     * @returns
     */
    async getPropsForHierarchyScope() {
        return this.hierarchySelector.getHierarchy().then(async (selection) => {
            if (!selection) {
                return undefined;
            }
            const { hierarchy, vault } = selection;
            const notes = await this.extension
                .getEngine()
                .findNotes({ excludeStub: true, vault });
            return notes.filter((value) => value.fname.startsWith(hierarchy));
        });
    }
    /**
     * If the active text editor document has dirty changes, save first before exporting
     * @returns True if document is dirty, false otherwise
     */
    async saveActiveDocumentBeforeExporting(opts) {
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        if (editor && editor.document.isDirty) {
            const fname = common_all_1.NoteUtils.uri2Fname(editor.document.uri);
            this._onEngineNoteStateChangedDisposable = this.extension
                .getEngine()
                .engineEventEmitter.onEngineNoteStateChanged(async (noteChangeEntries) => {
                const updateNoteEntries = noteChangeEntries.filter((entry) => entry.note.fname === fname && entry.status === "update");
                // Received event from engine about successful save
                if (updateNoteEntries.length > 0) {
                    this.dispose();
                    const savedNote = updateNoteEntries[0].note;
                    // Remove notes that match saved note as they contain old content
                    const filteredPayload = opts.payload.filter((note) => note.fname !== savedNote.fname);
                    // if export scope is selection, export only the selection
                    if (opts.config.exportScope === pods_core_1.PodExportScope.Selection) {
                        const selectionPayload = await this.getPropsForSelectionScope(filteredPayload.concat(savedNote));
                        if (selectionPayload) {
                            opts.payload = selectionPayload;
                            await this.executeExportNotes(opts);
                        }
                    }
                    else {
                        await this.executeExportNotes(opts);
                    }
                }
            });
            await editor.document.save();
            // Dispose of listener after 3 sec (if not already disposed) in case engine events never arrive
            setTimeout(() => {
                if (this._onEngineNoteStateChangedDisposable) {
                    vscode.window.showErrorMessage(`Unable to run export. Please save file and try again.`);
                }
                this.dispose();
            }, 3000);
            return true;
        }
        else {
            // Save is not needed. Go straight to exporting
            await this.executeExportNotes(opts);
            return false;
        }
    }
    async executeExportNotes(opts, progress) {
        const pod = this.createPod(opts.config);
        const result = await pod.exportNotes(opts.payload, progress);
        return this.onExportComplete({
            exportReturnValue: result,
            payload: opts.payload,
            config: opts.config,
        });
    }
    async getPropsForNoteScope() {
        //TODO: Switch this to a lookup controller, allow multiselect
        const fsPath = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
        if (!fsPath) {
            vscode.window.showErrorMessage("you must have a note open to execute this command");
            return;
        }
        const { vaults, engine, wsRoot } = this.extension.getDWorkspace();
        const vault = common_all_1.VaultUtils.getVaultByFilePath({
            vaults,
            wsRoot,
            fsPath,
        });
        const fname = path_1.default.basename(fsPath, ".md");
        const maybeNote = (await engine.findNotes({ fname, vault }))[0];
        if (!maybeNote) {
            vscode.window.showErrorMessage("couldn't find the note somehow");
        }
        return [maybeNote];
    }
    /**
     *
     * @returns all notes in the workspace
     */
    async getPropsForWorkspaceScope() {
        const engine = this.extension.getEngine();
        return engine.findNotes({ excludeStub: true });
    }
    /**
     *
     * @returns all notes in the vault
     */
    async getPropsForVaultScope(vault) {
        const engine = this.extension.getEngine();
        return engine.findNotes({ excludeStub: true, vault });
    }
    addAnalyticsPayload(opts) {
        if (lodash_1.default.isUndefined(opts))
            return;
        return {
            exportScope: opts.config.exportScope,
        };
    }
    async getPropsForSelectionScope(payload) {
        const noteProps = payload || (await this.getPropsForNoteScope());
        if (!noteProps) {
            return;
        }
        // if selection, only export the selection.
        const activeRange = await vsCodeUtils_1.VSCodeUtils.extractRangeFromActiveEditor();
        const { document, range } = activeRange || {};
        const selectedText = document ? document.getText(range).trim() : "";
        if (!selectedText) {
            vscode.window.showWarningMessage("Please select the text in note to export");
            return;
        }
        noteProps[0].body = selectedText;
        return noteProps;
    }
}
exports.BaseExportPodCommand = BaseExportPodCommand;
//# sourceMappingURL=BaseExportPodCommand.js.map