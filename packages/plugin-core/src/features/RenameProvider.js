"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const logger_1 = require("../logger");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = __importDefault(require("vscode"));
const RenameNoteV2a_1 = require("../commands/RenameNoteV2a");
const ExtensionProvider_1 = require("../ExtensionProvider");
const analytics_1 = require("../utils/analytics");
const md_1 = require("../utils/md");
const vsCodeUtils_1 = require("../vsCodeUtils");
const WSUtils_1 = require("../WSUtils");
class RenameProvider {
    _targetNote;
    refAtPos;
    L = logger_1.Logger;
    set targetNote(value) {
        this._targetNote = value;
    }
    async getRangeForReference(opts) {
        const { reference, document } = opts;
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        const { vaults } = engine;
        const { label, vaultName, range, ref, refType, refText } = reference;
        const targetVault = vaultName
            ? common_all_1.VaultUtils.getVaultByName({ vaults, vname: vaultName })
            : WSUtils_1.WSUtils.getVaultFromDocument(document);
        if (targetVault === undefined) {
            throw new common_all_1.DendronError({
                message: `Cannot rename note with specified vault (${vaultName}). Vault does not exist.`,
            });
        }
        else {
            const fname = ref;
            const targetNote = (await engine.findNotes({ fname, vault: targetVault }))[0];
            if (targetNote === undefined) {
                throw new common_all_1.DendronError({
                    message: `Cannot rename note ${ref} that doesn't exist.`,
                });
            }
            this._targetNote = targetNote;
            const currentNote = await WSUtils_1.WSUtils.getNoteFromDocument(document);
            if (lodash_1.default.isEqual(currentNote, targetNote)) {
                throw new common_all_1.DendronError({
                    message: `Cannot rename symbol that references current note.`,
                });
            }
            switch (refType) {
                case "wiki":
                case "refv2": {
                    const fullRefText = refType === "wiki" ? `[[${refText}]]` : `![[${refText}]]`;
                    const anchorLength = refText.length - ref.length;
                    const startOffset = refType === "wiki"
                        ? fullRefText.indexOf(ref)
                        : fullRefText.indexOf(ref) - 1;
                    const labelOffset = label ? `${label}|`.length : 0;
                    const vaultPrefixOffset = vaultName
                        ? `dendron://${vaultName}/`.length
                        : 0;
                    const anchorOffset = anchorLength + 2;
                    const start = new vscode_1.default.Position(range.start.line, range.start.character + startOffset);
                    const end = new vscode_1.default.Position(range.end.line, range.end.character - anchorOffset + vaultPrefixOffset + labelOffset);
                    return new vscode_1.default.Range(start, end);
                }
                case "hashtag":
                case "usertag": {
                    const start = new vscode_1.default.Position(reference.range.start.line, reference.range.start.character + 1);
                    const end = reference.range.end;
                    return new vscode_1.default.Range(start, end);
                }
                case "fmtag": {
                    return reference.range;
                }
                case undefined:
                    throw new common_all_1.DendronError({
                        message: "Unknown reference type",
                        payload: {
                            ctx: "RenameProvider.getRangeForReference",
                            refType,
                        },
                    });
                default: {
                    (0, common_all_1.assertUnreachable)(refType);
                }
            }
        }
        return;
    }
    trackProxyMetrics({ note, noteChangeEntryCounts, }) {
        const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
        const engine = extension.getEngine();
        const { vaults } = engine;
        analytics_1.AnalyticsUtils.track(common_all_1.EngagementEvents.RefactoringCommandUsed, {
            command: "RenameProvider",
            ...noteChangeEntryCounts,
            numVaults: vaults.length,
            traits: note.traits ?? [],
            numChildren: note.children.length,
            numLinks: note.links.length,
            numChars: note.body.length,
            noteDepth: common_all_1.DNodeUtils.getDepth(note),
        });
    }
    async executeRename(opts) {
        const { newName } = opts;
        if (this._targetNote !== undefined) {
            const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
            const { wsRoot } = engine;
            const renameCmd = new RenameNoteV2a_1.RenameNoteV2aCommand();
            const targetVault = this._targetNote.vault;
            const vpath = (0, common_server_1.vault2Path)({ wsRoot, vault: targetVault });
            const rootUri = vscode_1.default.Uri.file(vpath);
            const oldUri = vsCodeUtils_1.VSCodeUtils.joinPath(rootUri, `${this._targetNote.fname}.md`);
            let newNamePrefix = "";
            if (this.refAtPos?.refType === "hashtag" ||
                this.refAtPos?.refType === "fmtag") {
                newNamePrefix = "tags.";
            }
            else if (this.refAtPos?.refType === "usertag") {
                newNamePrefix = "user.";
            }
            const newUri = vsCodeUtils_1.VSCodeUtils.joinPath(rootUri, `${newNamePrefix}${newName}.md`);
            const resp = await renameCmd.execute({
                files: [{ oldUri, newUri }],
                silent: false,
                closeCurrentFile: false,
                openNewFile: false,
                noModifyWatcher: true,
            });
            const noteChangeEntryCounts = (0, common_all_1.extractNoteChangeEntryCounts)(resp.changed);
            try {
                this.trackProxyMetrics({
                    note: this._targetNote,
                    noteChangeEntryCounts,
                });
            }
            catch (error) {
                this.L.error({ error });
            }
            const changed = resp.changed;
            if (changed.length > 0) {
                const createdCount = changed.filter((change) => change.status === "create").length;
                const updatedCount = changed.filter((change) => change.status === "update").length;
                const deletedCount = changed.filter((change) => change.status === "delete").length;
                const msg = `Created ${createdCount}, updated ${updatedCount}, and deleted ${deletedCount} files.`;
                vscode_1.default.window.showInformationMessage(msg);
            }
            return resp;
        }
        return;
    }
    async prepareRename(document, position) {
        if (!(await ExtensionProvider_1.ExtensionProvider.isActiveAndIsDendronNote(document.uri.fsPath))) {
            throw new common_all_1.DendronError({
                message: "Rename is not supported for non dendron notes",
            });
        }
        const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const reference = await (0, md_1.getReferenceAtPosition)({
            document,
            position,
            wsRoot,
            vaults,
        });
        if (reference !== null) {
            this.refAtPos = reference;
            return this.getRangeForReference({ reference, document });
        }
        else {
            throw new common_all_1.DendronError({
                message: "Rename is not supported for this symbol",
            });
        }
    }
    async provideRenameEdits(_document, _position, newName) {
        await this.executeRename({ newName });
        // return a dummy edit.
        return new vscode_1.default.WorkspaceEdit();
    }
}
exports.default = RenameProvider;
//# sourceMappingURL=RenameProvider.js.map