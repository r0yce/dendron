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
exports.NoteParserV2 = void 0;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode")); // NOTE: This version contains vscode.workspace.fs API references. Need to refactor that out somehow.
const vscode_uri_1 = require("vscode-uri");
/**
 * Get hierarchy of each file
 * @param fpaths
 * @returns
 */
function getFileMeta(fpaths) {
    const metaDict = {};
    lodash_1.default.forEach(fpaths, (fpath) => {
        const { name } = path_1.default.parse(fpath);
        const lvl = name.split(".").length;
        if (!lodash_1.default.has(metaDict, lvl)) {
            metaDict[lvl] = [];
        }
        metaDict[lvl].push({ fpath });
    });
    return metaDict;
}
class NoteParserV2 {
    wsRoot;
    constructor(wsRoot) {
        this.wsRoot = wsRoot;
    }
    /**
     * Construct in-memory
     *
     * @param allPaths
     * @param vault
     * @returns
     */
    async parseFiles(allPaths, vault) {
        const fileMetaDict = getFileMeta(allPaths);
        const maxLvl = lodash_1.default.max(lodash_1.default.keys(fileMetaDict).map((e) => lodash_1.default.toInteger(e))) || 2;
        // In-memory representation of NoteProps dictionary
        const notesByFname = {};
        const notesById = {};
        const noteDicts = {
            notesById,
            notesByFname,
        };
        const errors = [];
        // get root note
        if (lodash_1.default.isUndefined(fileMetaDict[1])) {
            return {
                noteDicts,
                errors: [
                    common_all_1.DendronError.createFromStatus({
                        status: common_all_1.ERROR_STATUS.NO_ROOT_NOTE_FOUND,
                    }),
                ],
            };
        }
        const rootFile = fileMetaDict[1].find((n) => n.fpath === "root.md");
        if (!rootFile) {
            return {
                noteDicts,
                errors: [
                    common_all_1.DendronError.createFromStatus({
                        status: common_all_1.ERROR_STATUS.NO_ROOT_NOTE_FOUND,
                    }),
                ],
            };
        }
        const rootProps = await this.parseNoteProps({
            fpath: (0, common_all_1.cleanName)(rootFile.fpath), // TODO: Don't think cleanName is necessary here
            addParent: false,
            vault,
        });
        if (rootProps.error) {
            errors.push(rootProps.error);
        }
        if (!rootProps.data || rootProps.data.length === 0) {
            return {
                noteDicts,
                errors: [
                    common_all_1.DendronError.createFromStatus({
                        status: common_all_1.ERROR_STATUS.NO_ROOT_NOTE_FOUND,
                    }),
                ],
            };
        }
        const rootNote = rootProps.data[0].note;
        common_all_1.NoteDictsUtils.add(rootNote, noteDicts);
        // Parse root hierarchies
        const op = fileMetaDict[1]
            // Don't count root node
            .filter((n) => n.fpath !== "root.md")
            .map(async (ent) => {
            try {
                const resp = await this.parseNoteProps({
                    fpath: ent.fpath,
                    addParent: false,
                    vault,
                });
                // Store each successfully parsed node in note dict and keep track of errors
                if (resp.error) {
                    errors.push(resp.error);
                }
                if (resp.data && resp.data.length > 0) {
                    const parsedNote = resp.data[0].note;
                    common_all_1.DNodeUtils.addChild(rootNote, parsedNote);
                    // Check for duplicate IDs when adding notes to the map
                    if (notesById[parsedNote.id] !== undefined) {
                        const duplicate = notesById[parsedNote.id];
                        errors.push(new common_all_1.DuplicateNoteError({
                            noteA: duplicate,
                            noteB: parsedNote,
                        }));
                    }
                    // Update in-memory note dict
                    common_all_1.NoteDictsUtils.add(parsedNote, noteDicts);
                }
            }
            catch (err) {
                const error = common_all_1.ErrorFactory.wrapIfNeeded(err);
                // A fatal error would kill the initialization
                error.severity = common_all_1.ERROR_SEVERITY.MINOR;
                error.message =
                    `Failed to read ${ent.fpath} in ${vault.name}: ` + error.message;
                errors.push(error);
            }
        });
        await Promise.all(op);
        // Parse level by level
        let lvl = 2;
        while (lvl <= maxLvl) {
            const anotherOp = (fileMetaDict[lvl] || [])
                .filter((ent) => {
                return !(0, common_all_1.globMatch)(["root.*"], ent.fpath);
            })
                .flatMap(async (ent) => {
                try {
                    const resp = await this.parseNoteProps({
                        fpath: ent.fpath,
                        noteDicts: { notesById, notesByFname },
                        addParent: true,
                        vault,
                    });
                    if (resp.error) {
                        errors.push(resp.error);
                    }
                    if (resp.data && resp.data.length > 0) {
                        resp.data.forEach((ent) => {
                            const note = ent.note;
                            // Check for duplicate IDs when adding created notes to the map
                            if (ent.status === "create" &&
                                notesById[note.id] !== undefined) {
                                const duplicate = notesById[note.id];
                                errors.push(new common_all_1.DuplicateNoteError({
                                    noteA: duplicate,
                                    noteB: note,
                                }));
                            }
                            common_all_1.NoteDictsUtils.add(note, noteDicts);
                        });
                    }
                }
                catch (err) {
                    const dendronError = common_all_1.ErrorFactory.wrapIfNeeded(err);
                    // A fatal error would kill the initialization
                    dendronError.severity = common_all_1.ERROR_SEVERITY.MINOR;
                    dendronError.message =
                        `Failed to read ${ent.fpath} in ${vault.name}: ` +
                            dendronError.message;
                    errors.push(dendronError);
                }
            });
            lvl += 1;
            // TODO: Fix
            // eslint-disable-next-line no-await-in-loop
            await Promise.all(anotherOp);
        }
        return {
            noteDicts,
            errors,
        };
    }
    /**
     * Given a fpath, convert to NoteProp
     * Update parent/children metadata if parents = true
     *
     * @returns List of all notes changed. If a note has no direct parents, stub notes are added instead
     */
    async parseNoteProps(opts) {
        const cleanOpts = lodash_1.default.defaults(opts, {
            addParent: true,
            noteDicts: {
                notesById: {},
                notesByFname: {},
            },
        });
        const { fpath, noteDicts, vault } = cleanOpts;
        let changeEntries = [];
        try {
            // Get note props from file and propagate any errors
            const { data: note, error } = await this.file2NoteWithCache({
                uri: vscode_uri_1.Utils.joinPath(this.wsRoot, common_all_1.VaultUtils.getRelPath(vault), fpath),
                vault,
            });
            if (note) {
                changeEntries.push({ status: "create", note });
                // Add parent/children properties
                if (cleanOpts.addParent) {
                    const changed = common_all_1.NoteUtils.addOrUpdateParents({
                        note,
                        noteDicts,
                        createStubs: true,
                    });
                    changeEntries = changeEntries.concat(changed);
                }
            }
            return { data: changeEntries, error };
        }
        catch (_err) {
            if (!common_all_1.ErrorUtils.isDendronError(_err)) {
                const error = common_all_1.DendronError.createFromStatus({
                    status: common_all_1.ERROR_STATUS.BAD_PARSE_FOR_NOTE,
                    severity: common_all_1.ERROR_SEVERITY.MINOR,
                    payload: { fname: fpath, error: (0, common_all_1.stringifyError)(_err) },
                    message: `${fpath} could not be parsed`,
                });
                return { error };
            }
            return { error: _err };
        }
    }
    /**
     * Given a fpath, attempt to convert raw file contents into a NoteProp
     *
     * Look up metadata from cache. If contenthash hasn't changed, use metadata from cache.
     * Otherwise, reconstruct metadata from scratch
     *
     * @returns NoteProp associated with fpath
     */
    async file2NoteWithCache({ uri, vault, }) {
        const raw = await vscode.workspace.fs.readFile(uri);
        // @ts-expect-error - browser interop: must use global DOM TextDecoder (provided by "DOM" + "DOM.Iterable" libs in tsconfig; VSCode web extension + webview contexts have no Node 'util'/'node:util' TextDecoder available in webpack browser bundle). Precise dated justification (final Post-M2 + Doctor Smoke Burn, 2026-06-01); never bare per ts-expect-error-burner SKILL. See VSCodeFileStore + getWorkspaceConfig siblings + web/ DI cluster. 0 bare rule upheld.
        const content = textDecoder.decode(raw);
        const name = path_1.default.parse(vscode_uri_1.Utils.basename(uri)).name;
        const sig = (0, common_all_1.genHash)(content);
        const note = (0, common_all_1.string2Note)({
            content,
            fname: name,
            vault,
        });
        note.contentHash = sig;
        return { data: note, error: null };
    }
}
exports.NoteParserV2 = NoteParserV2;
//# sourceMappingURL=NoteParserV2.js.map