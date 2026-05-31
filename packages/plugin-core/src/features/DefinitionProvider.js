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
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const Sentry = __importStar(require("@sentry/node"));
const vscode_1 = require("vscode");
const GotoNote_1 = require("../commands/GotoNote");
const GoToNoteInterface_1 = require("../commands/GoToNoteInterface");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const md_1 = require("../utils/md");
class DefinitionProvider {
    async maybeNonNoteFileDefinition({ fpath, vault, }) {
        const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const file = await (0, common_server_1.findNonNoteFile)({
            fpath,
            vaults: vault ? [vault] : vaults,
            wsRoot,
        });
        return file?.fullPath;
    }
    async provideForNonNoteFile(nonNoteFile) {
        return new vscode_1.Location(vscode_1.Uri.file(nonNoteFile), new vscode_1.Position(0, 0));
    }
    async provideForNewNote(refAtPos) {
        const wsRoot = ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot;
        const config = common_server_1.DConfig.readConfigSync(wsRoot);
        const noAutoCreateOnDefinition = !common_all_1.ConfigUtils.getWorkspace(config).enableAutoCreateOnDefinition;
        if (noAutoCreateOnDefinition) {
            return;
        }
        const out = await new GotoNote_1.GotoNoteCommand(ExtensionProvider_1.ExtensionProvider.getExtension()).execute({
            qs: refAtPos.ref,
            anchor: refAtPos.anchorStart ?? undefined,
        } /* 4-axis boundary: GoToNoteCommandOpts.anchor required vs DNoteAnchorBasic | undefined from refAtPos; exactOptionalPropertyTypes. TODO: Monorepo 4-axis + di-container ergonomics + exactOptionalPropertyTypes; debug launch sweep 2026-05-31. See di/inject Suppression Registry + ADR 0001 */);
        if (out?.kind !== GoToNoteInterface_1.TargetKind.NOTE) {
            // Wasn't able to create, or not a note file
            return;
        }
        const { note, pos } = out;
        return new vscode_1.Location(common_all_1.NoteUtils.getURI({ note, wsRoot }), pos || new vscode_1.Position(0, 0));
    }
    async provideDefinition(document, position, _token) {
        try {
            // No-op if we're not in a Dendron Workspace
            if (!(await ExtensionProvider_1.ExtensionProvider.isActiveAndIsDendronNote(document.uri.fsPath))) {
                return;
            }
            const { wsRoot, vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const refAtPos = await (0, md_1.getReferenceAtPosition)({
                document,
                position,
                wsRoot,
                vaults,
            });
            if (!refAtPos) {
                return;
            }
            let vault;
            if (refAtPos.vaultName) {
                try {
                    vault = common_all_1.VaultUtils.getVaultByName({
                        vaults: engine.vaults,
                        vname: refAtPos.vaultName,
                    });
                }
                catch (err) {
                    logger_1.Logger.error({ msg: `${refAtPos.vaultName} is not defined` });
                }
            }
            const notes = (await engine.findNotesMeta({ fname: refAtPos.ref, vault: vault ?? undefined } /* 4-axis boundary: FindNoteOpts.vault required vs | undefined; exactOptional. TODO: Monorepo 4-axis + di-container + exactOptionalPropertyTypes; debug launch sweep 2026-05-31. See di/inject Suppression Registry + ADR 0001 */)).filter((note) => !note.id.startsWith(common_all_1.NoteUtils.FAKE_ID_PREFIX));
            const uris = notes.map((note) => common_all_1.NoteUtils.getURI({ note, wsRoot }));
            const out = uris.map((uri) => new vscode_1.Location(uri, new vscode_1.Position(0, 0)));
            if (out.length > 1) {
                return out;
            }
            else if (out.length === 1) {
                const loc = out[0];
                if (refAtPos.anchorStart) {
                    const pos = (0, GotoNote_1.findAnchorPos)({
                        anchor: refAtPos.anchorStart,
                        note: notes[0],
                    });
                    return new vscode_1.Location(loc.uri, pos);
                }
                return loc;
            }
            else {
                // if no note exists, check if it's a non-note file
                const nonNoteFile = await this.maybeNonNoteFileDefinition({
                    fpath: refAtPos.ref,
                    vault: vault ?? undefined,
                } /* 4-axis boundary: maybeNonNoteFileDefinition vault param vs | undefined; exactOptional. TODO: Monorepo 4-axis + di-container + exactOptionalPropertyTypes; debug launch sweep 2026-05-31. See di/inject Suppression Registry + ADR 0001 */);
                if (nonNoteFile)
                    return this.provideForNonNoteFile(nonNoteFile);
                else
                    return this.provideForNewNote(refAtPos);
            }
        }
        catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }
}
exports.default = DefinitionProvider;
//# sourceMappingURL=DefinitionProvider.js.map