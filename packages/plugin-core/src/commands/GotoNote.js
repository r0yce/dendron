"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GotoNoteCommand = exports.findAnchorPos = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const types_1 = require("../components/lookup/types");
const utils_1 = require("../components/lookup/utils");
const constants_1 = require("../constants");
const analytics_1 = require("../utils/analytics");
const EditorUtils_1 = require("../utils/EditorUtils");
const files_1 = require("../utils/files");
const MeetingTelemHelper_1 = require("../utils/MeetingTelemHelper");
const vsCodeUtils_1 = require("../vsCodeUtils");
const WSUtilsV2_1 = require("../WSUtilsV2");
const base_1 = require("./base");
const GoToNoteInterface_1 = require("./GoToNoteInterface");
const findAnchorPos = (opts) => {
    const { anchor: findAnchor, note } = opts;
    let key;
    switch (findAnchor.type) {
        case "line":
            return new vscode_1.Position(findAnchor.line - 1, 0);
        case "block":
            key = `^${findAnchor.value}`;
            break;
        case "header":
            key = (0, common_all_1.getSlugger)().slug(findAnchor.value);
            break;
        default:
            (0, common_all_1.assertUnreachable)(findAnchor);
    }
    const found = note.anchors[key];
    if (lodash_1.default.isUndefined(found))
        return new vscode_1.Position(0, 0);
    return new vscode_1.Position(found.line, found.column);
};
exports.findAnchorPos = findAnchorPos;
/**
 * Open or create a note. See {@link GotoNoteCommand.execute} for details
 */
class GotoNoteCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.GOTO_NOTE.key;
    extension;
    wsUtils;
    constructor(extension) {
        super();
        this.extension = extension;
        this.wsUtils = extension.wsUtils;
    }
    async getQs(opts, link) {
        if (link.value) {
            // Reference to another file
            opts.qs = link.value;
        }
        else {
            // Same file block reference, implicitly current file
            const note = await this.wsUtils.getActiveNote();
            if (note) {
                // Same file link within note
                opts.qs = note.fname;
                opts.vault = note.vault;
            }
            else {
                const { wsRoot, vaults } = this.extension.getEngine();
                // Same file link within non-note file
                opts.qs = path_1.default.relative(wsRoot, vsCodeUtils_1.VSCodeUtils.getActiveTextEditorOrThrow().document.fileName);
                opts.vault = common_all_1.VaultUtils.getVaultByFilePath({
                    wsRoot,
                    vaults,
                    fsPath: opts.qs,
                });
            }
        }
        return opts;
    }
    async maybeSetOptsFromExistingNote(opts) {
        const engine = this.extension.getEngine();
        const notes = (await engine.findNotesMeta({ fname: opts.qs })).filter((note) => !note.id.startsWith(common_all_1.NoteUtils.FAKE_ID_PREFIX));
        if (notes.length === 1) {
            // There's just one note, so that's the one we'll go with.
            opts.vault = notes[0].vault;
        }
        else if (notes.length > 1) {
            // It's ambiguous which note the user wants to go to, so we have to
            // guess or prompt.
            const resp = await utils_1.PickerUtilsV2.promptVault(notes.map((ent) => ent.vault));
            if (lodash_1.default.isUndefined(resp))
                return null;
            opts.vault = resp;
        }
        // Not an existing note
        return opts;
    }
    async maybeSetOptsFromNonNote(opts) {
        const { vaults, wsRoot } = this.extension.getEngine();
        const nonNote = await (0, common_server_1.findNonNoteFile)({
            fpath: opts.qs,
            wsRoot,
            vaults,
        });
        if (nonNote) {
            opts.qs = nonNote.fullPath;
            opts.kind = GoToNoteInterface_1.TargetKind.NON_NOTE;
        }
        return opts;
    }
    async setOptsFromNewNote(opts) {
        // Depending on the config, we can either
        // automatically pick the vault or we'll prompt for it.
        const { config } = this.extension.getDWorkspace();
        const confirmVaultSetting = common_all_1.ConfigUtils.getLookup(config).note.confirmVaultOnCreate;
        const selectionMode = confirmVaultSetting !== true
            ? types_1.VaultSelectionMode.smart
            : types_1.VaultSelectionMode.alwaysPrompt;
        const currentVault = utils_1.PickerUtilsV2.getVaultForOpenEditor();
        const selectedVault = await utils_1.PickerUtilsV2.getOrPromptVaultForNewNote({
            vault: currentVault,
            fname: opts.qs,
            vaultSelectionMode: selectionMode,
        });
        // If we prompted the user and they selected nothing, then they want to cancel
        if (lodash_1.default.isUndefined(selectedVault)) {
            return null;
        }
        opts.vault = selectedVault;
        // this is needed to populate the new note's backlink after it is created
        opts.originNote = await this.wsUtils.getActiveNote();
        return opts;
    }
    async processInputs(opts) {
        if (opts.qs && opts.vault)
            return opts;
        if (opts.qs && !opts.vault) {
            // Special case: some code expects GotoNote to default to current vault if qs is provided but vault isn't
            opts.vault = utils_1.PickerUtilsV2.getVaultForOpenEditor();
            return opts;
        }
        const link = await EditorUtils_1.EditorUtils.getLinkFromSelectionWithWorkspace();
        if (!link) {
            vscode_1.window.showErrorMessage("selection is not a valid link");
            return null;
        }
        // Get missing opts from the selected link, if possible
        if (!opts.qs)
            opts = await this.getQs(opts, link);
        if (!opts.vault && link.vaultName)
            opts.vault = common_all_1.VaultUtils.getVaultByNameOrThrow({
                vaults: this.extension.getDWorkspace().vaults,
                vname: link.vaultName,
            });
        if (!opts.anchor && link.anchorHeader)
            opts.anchor = link.anchorHeader;
        // If vault is missing, then we haven't found the note yet. Go through possible options until we find it.
        if (opts.vault === undefined) {
            const existingNote = await this.maybeSetOptsFromExistingNote(opts);
            // User cancelled prompt
            if (existingNote === null)
                return null;
            opts = existingNote;
        }
        if (opts.vault === undefined) {
            opts = await this.maybeSetOptsFromNonNote(opts);
        }
        // vault undefined and we're not targeting a {@link TargetKind.NON_NOTE}
        if (opts.vault === undefined && opts.kind !== GoToNoteInterface_1.TargetKind.NON_NOTE) {
            const newNote = await this.setOptsFromNewNote(opts);
            // User cancelled prompt
            if (newNote === null)
                return null;
            opts = newNote;
        }
        return opts;
    }
    /**
     *
     * Warning about `opts`! If `opts.qs` is provided but `opts.vault` is empty,
     * it will default to the current vault. If `opts.qs` is not provided, it will
     * read the selection from the current document as a link to get it. If both
     * `opts.qs` and `opts.vault` is empty, both will be read from the selected link.
     *
     * @param opts.qs - query string. should correspond to {@link NoteProps.fname}
     * @param opts.vault - {@link DVault} for note
     * @param opts.anchor - a {@link DNoteAnchor} to navigate to
     * @returns
     */
    async execute(opts) {
        const ctx = "GotoNoteCommand";
        this.L.info({ ctx, opts, msg: "enter" });
        const { overrides } = opts;
        const client = this.extension.getEngine();
        const { wsRoot } = this.extension.getDWorkspace();
        const processedOpts = await this.processInputs(opts);
        if (processedOpts === null)
            return; // User cancelled a prompt, or did not have a valid link selected
        const { qs, vault } = processedOpts;
        // Non-note files use `qs` for full path, and set vault to null
        if (opts.kind === GoToNoteInterface_1.TargetKind.NON_NOTE && qs) {
            let type;
            if (common_server_1.FileExtensionUtils.isTextFileExtension(path_1.default.extname(qs))) {
                // Text file, open inside of VSCode
                type = GoToNoteInterface_1.GotoFileType.TEXT;
                const editor = await vsCodeUtils_1.VSCodeUtils.openFileInEditor(vscode_1.Uri.from({ scheme: "file", path: qs }), {
                    column: opts.column,
                });
                if (editor && opts.anchor) {
                    await this.extension.wsUtils.trySelectRevealNonNoteAnchor(editor, opts.anchor);
                }
            }
            else {
                // Binary file, open with default app
                type = GoToNoteInterface_1.GotoFileType.BINARY;
                await files_1.PluginFileUtils.openWithDefaultApp(qs);
            }
            return {
                kind: GoToNoteInterface_1.TargetKind.NON_NOTE,
                type,
                fullPath: qs,
            };
        }
        if (qs === undefined || vault === undefined) {
            // There was an error or the user cancelled a prompt
            return;
        }
        // Otherwise, it's a regular note
        let pos;
        const out = await this.extension.pauseWatchers(async () => {
            const notes = await client.findNotes({ fname: qs, vault });
            let note;
            // If note doesn't exist, create note with schema
            if (notes.length === 0) {
                const fname = qs;
                // validate fname before creating new note
                const validationResp = common_all_1.NoteUtils.validateFname(fname);
                if (validationResp.isValid) {
                    const newNote = await common_all_1.NoteUtils.createWithSchema({
                        noteOpts: {
                            fname,
                            vault,
                        },
                        engine: client,
                    });
                    await common_server_1.TemplateUtils.findAndApplyTemplate({
                        note: newNote,
                        engine: client,
                        pickNote: async (choices) => {
                            return WSUtilsV2_1.WSUtilsV2.instance().promptForNoteAsync({
                                notes: choices,
                                quickpickTitle: "Select which template to apply or press [ESC] to not apply a template",
                                nonStubOnly: true,
                            });
                        },
                    });
                    note = lodash_1.default.merge(newNote, overrides || {});
                    const { originNote } = opts;
                    if (originNote) {
                        this.addBacklinkPointingToOrigin({
                            originNote,
                            note,
                        });
                    }
                    await client.writeNote(note);
                    // check if we should send meeting note telemetry.
                    const type = qs.startsWith("user.") ? "userTag" : "general";
                    (0, MeetingTelemHelper_1.maybeSendMeetingNoteTelemetry)(type);
                }
                else {
                    // should not create note if fname is invalid.
                    // let the user know and exit early.
                    this.displayInvalidFilenameError({ fname, validationResp });
                    return;
                }
            }
            else {
                note = notes[0];
                // If note exists and its a stub note, delete stub and create new note
                if (note.stub) {
                    delete note.stub;
                    note = lodash_1.default.merge(note, overrides || {});
                    await client.writeNote(note);
                }
            }
            const npath = common_all_1.NoteUtils.getFullPath({
                note,
                wsRoot,
            });
            const uri = vscode_1.Uri.file(npath);
            const editor = await vsCodeUtils_1.VSCodeUtils.openFileInEditor(uri, {
                column: opts.column,
            });
            this.L.info({ ctx, opts, msg: "exit" });
            if (opts.anchor && editor) {
                pos = (0, exports.findAnchorPos)({ anchor: opts.anchor, note });
                editor.selection = new vscode_1.Selection(pos, pos);
                editor.revealRange(editor.selection);
            }
            return { kind: GoToNoteInterface_1.TargetKind.NOTE, note, pos, source: opts.source };
        });
        return out;
    }
    addAnalyticsPayload(opts, resp) {
        const { source, type } = {
            type: undefined,
            ...opts,
            ...resp,
        };
        const payload = { ...(0, analytics_1.getAnalyticsPayload)(source), fileType: type };
        return payload;
    }
    displayInvalidFilenameError(opts) {
        const { fname, validationResp } = opts;
        const message = `Cannot create note ${fname}: ${validationResp.reason}`;
        vscode_1.window.showErrorMessage(message);
    }
    /**
     * Given an origin note and a newly created note,
     * add a backlink that points to the origin note
     * to newly created note's link metadata
     */
    addBacklinkPointingToOrigin(opts) {
        const { originNote, note } = opts;
        const originLinks = originNote.links;
        const linkToNote = originLinks.find((link) => link.to?.fname === note.fname);
        if (linkToNote) {
            const backlinkToOrigin = common_all_1.BacklinkUtils.createFromDLink(linkToNote);
            if (backlinkToOrigin)
                note.links.push(backlinkToOrigin);
        }
    }
}
exports.GotoNoteCommand = GotoNoteCommand;
//# sourceMappingURL=GotoNote.js.map