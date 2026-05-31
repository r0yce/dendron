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
exports.DoctorUtils = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const Doctor_1 = require("../../commands/Doctor");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const logger_1 = require("../../logger");
const analytics_1 = require("../../utils/analytics");
const vsCodeUtils_1 = require("../../vsCodeUtils");
class DoctorUtils {
    static async findDuplicateNoteFromDocument(document) {
        const ctx = "findDuplicateNoteFromDocument";
        const fsPath = document.uri.fsPath;
        // return if file is not a markdown
        if (!fsPath.endsWith(".md"))
            return;
        // return if file is in source control view
        if (document.uri.scheme === "git")
            return;
        const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
        const { vaults, wsRoot, engine } = extension.getDWorkspace();
        let vault;
        try {
            vault = common_all_1.VaultUtils.getVaultByFilePath({
                vaults,
                wsRoot,
                fsPath,
            });
        }
        catch (error) {
            // document doesn't exist in workspace.
            return;
        }
        // we do this because the note in document would _not_ be in our store
        // if it is a duplicate note.
        const resp = (0, common_server_1.file2Note)(fsPath, vault);
        if (common_all_1.ErrorUtils.isErrorResp(resp)) {
            // not in file system, we do nothing.
            logger_1.Logger.error({ ctx, error: resp.error });
            return;
        }
        const currentNote = resp.data;
        // find the potentially-duplicate note that's currently in our store.
        const noteById = (await engine.getNote(currentNote.id)).data;
        let hasDuplicate = false;
        if (noteById !== undefined) {
            if (currentNote.id === noteById.id) {
                // id of note in store and from document is the same. we _might_ have hit a duplicate.
                if (common_all_1.VaultUtils.isEqualV2(currentNote.vault, noteById.vault)) {
                    // if they are in the same vault, if their fname is different, they are duplicates.
                    // otherwise, the note in our store and the note from document is the same note. not a duplicate.
                    hasDuplicate = currentNote.fname !== noteById.fname;
                }
                else {
                    // if they are in different vaults, they are duplicate.
                    hasDuplicate = true;
                }
            }
            if (hasDuplicate) {
                logger_1.Logger.warn({
                    uri: document.uri.fsPath,
                    msg: "duplicate note id found",
                    id: currentNote.id,
                });
            }
            const resp = hasDuplicate
                ? { note: currentNote, duplicate: noteById }
                : { note: currentNote };
            return resp;
        }
        return { note: currentNote };
    }
    static async findDuplicateNoteAndPromptIfNecessary(document, source) {
        const resp = await DoctorUtils.findDuplicateNoteFromDocument(document);
        if (resp !== undefined) {
            const { note, duplicate } = resp;
            if (duplicate !== undefined) {
                const error = new common_all_1.DuplicateNoteError({
                    noteA: duplicate,
                    noteB: note,
                });
                vsCodeUtils_1.VSCodeUtils.showMessage(vsCodeUtils_1.MessageSeverity.WARN, error.message, {}, { title: "Fix It" }).then((resp) => {
                    if (resp && resp.title === "Fix It") {
                        const cmd = {
                            command: new Doctor_1.DoctorCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).key,
                            title: "Fix the frontmatter",
                            arguments: [
                                {
                                    scope: "file",
                                    action: engine_server_1.DoctorActionsEnum.REGENERATE_NOTE_ID,
                                    data: { note: duplicate },
                                },
                            ],
                        };
                        analytics_1.AnalyticsUtils.track(common_all_1.WorkspaceEvents.DuplicateNoteFound, {
                            state: "resolved",
                        });
                        vscode.commands.executeCommand(cmd.command, ...cmd.arguments);
                    }
                });
                analytics_1.AnalyticsUtils.track(common_all_1.WorkspaceEvents.DuplicateNoteFound, {
                    source,
                });
            }
        }
    }
    static async validateFilenameFromDocumentAndPromptIfNecessary(document) {
        const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
        const wsUtils = extension.wsUtils;
        const filename = path_1.default.basename(document.fileName, ".md");
        const note = await wsUtils.getNoteFromDocument(document);
        if (!note)
            return true;
        const result = common_all_1.NoteUtils.validateFname(filename);
        if (result.isValid)
            return true;
        const error = new common_all_1.DendronError({
            message: "This note has an invalid filename. Please click the button below to fix it.",
        });
        vsCodeUtils_1.VSCodeUtils.showMessage(vsCodeUtils_1.MessageSeverity.WARN, error.message, {}, { title: "Fix Invalid Filenames" }).then(async (resp) => {
            if (resp && resp.title === "Fix Invalid Filenames") {
                const cmd = {
                    command: new Doctor_1.DoctorCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).key,
                    title: "Fix Invalid Filenames",
                    arguments: [
                        {
                            scope: "file",
                            action: engine_server_1.DoctorActionsEnum.FIX_INVALID_FILENAMES,
                            data: { note },
                        },
                    ],
                };
                vscode.commands.executeCommand(cmd.command, ...cmd.arguments);
            }
        });
        return false;
    }
}
exports.DoctorUtils = DoctorUtils;
//# sourceMappingURL=utils.js.map