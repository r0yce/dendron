"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DendronEngineV3Web = void 0;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const inject_1 = require("../../di/inject");
const vscode_uri_1 = require("vscode-uri");
const NoteParserV2_1 = require("./NoteParserV2");
let DendronEngineV3Web = class DendronEngineV3Web extends common_all_1.EngineV3Base {
    fileStore;
    _onNoteChangedEmitter = new common_all_1.EventEmitter();
    wsRootURI;
    constructor(wsRootURI, vaults, fileStore, noteStore) {
        super({
            logger: new common_all_1.ConsoleLogger(),
            noteStore,
            vaults,
            queryStore: new common_all_1.FuseQueryStore(),
            wsRoot: wsRootURI.fsPath,
        });
        this.fileStore = fileStore;
        this.wsRootURI = wsRootURI;
    }
    get onEngineNoteStateChanged() {
        return this._onNoteChangedEmitter.event;
    }
    dispose() {
        this._onNoteChangedEmitter.dispose();
    }
    /**
     * Does not throw error but returns it
     */
    async init() {
        try {
            const { data: notes, error: storeError } = await this.initNotesNew(this.vaults);
            // TODO: add schemas to notes
            if (lodash_1.default.isUndefined(notes)) {
                return {
                    error: common_all_1.DendronError.createFromStatus({
                        status: common_all_1.ERROR_STATUS.UNKNOWN,
                        severity: common_all_1.ERROR_SEVERITY.FATAL,
                    }),
                };
            }
            this.queryStore.replaceNotesIndex(notes);
            const bulkWriteOpts = lodash_1.default.values(notes).map((note) => {
                const noteMeta = lodash_1.default.omit(note, ["body"]);
                return { key: note.id, noteMeta };
            });
            this.noteStore.bulkWriteMetadata(bulkWriteOpts);
            // TODO: update schema index
            //this.updateIndex("schema");
            const hookErrors = [];
            // this.hooks.onCreate = this.hooks.onCreate.filter((hook) => {
            //   const { valid, error } = HookUtils.validateHook({
            //     hook,
            //     wsRoot: this.wsRoot,
            //   });
            //   if (!valid && error) {
            //     this.logger.error({ msg: "bad hook", hook, error });
            //     hookErrors.push(error);
            //   }
            //   return valid;
            // });
            const allErrors = storeError ? hookErrors.concat(storeError) : hookErrors;
            let error;
            switch (lodash_1.default.size(allErrors)) {
                case 0: {
                    error = null;
                    break;
                }
                case 1: {
                    error = new common_all_1.DendronError(allErrors[0]);
                    break;
                }
                default:
                    error = new common_all_1.DendronCompositeError(allErrors);
            }
            // this.logger.info({ ctx: "init:ext", error, storeError, hookErrors });
            return { error };
        }
        catch (error) {
            const { message, stack, status } = error;
            const payload = { message, stack };
            return {
                error: common_all_1.DendronError.createPlainError({
                    payload,
                    message,
                    status,
                    severity: common_all_1.ERROR_SEVERITY.FATAL,
                }),
            };
        }
    }
    async renameNote() {
        throw Error("renameNote not implemented");
    }
    async writeNote(note, opts) {
        let changes = [];
        const ctx = "DendronEngineV3Web:writeNewNote";
        this.logger.info({
            ctx,
            msg: `enter with ${opts}`,
            note: common_all_1.NoteUtils.toLogObj(note),
        });
        // // Apply hooks
        // if (opts?.runHooks === false) {
        //   this.logger.info({
        //     ctx,
        //     msg: "hooks disabled for write",
        //   });
        // } else {
        //   const hooks = _.filter(this.hooks.onCreate, (hook) =>
        //     NoteUtils.match({ notePath: note.fname, pattern: hook.pattern })
        //   );
        //   const resp = await _.reduce<DHookEntry, Promise<RequireHookResp>>(
        //     hooks,
        //     async (notePromise, hook) => {
        //       const { note } = await notePromise;
        //       const script = HookUtils.getHookScriptPath({
        //         wsRoot: this.wsRoot,
        //         basename: hook.id + ".js",
        //       });
        //       return HookUtils.requireHook({
        //         note,
        //         fpath: script,
        //         wsRoot: this.wsRoot,
        //       });
        //     },
        //     Promise.resolve({ note })
        //   ).catch(
        //     (err) =>
        //       new DendronError({
        //         severity: ERROR_SEVERITY.MINOR,
        //         message: "error with hook",
        //         payload: stringifyError(err),
        //       })
        //   );
        //   if (resp instanceof DendronError) {
        //     error = resp;
        //     this.logger.error({ ctx, error: stringifyError(error) });
        //   } else {
        //     const valResp = NoteUtils.validate(resp.note);
        //     if (valResp instanceof DendronError) {
        //       error = valResp;
        //       this.logger.error({ ctx, error: stringifyError(error) });
        //     } else {
        //       note = resp.note;
        //       this.logger.info({ ctx, msg: "fin:RunHooks", payload: resp.payload });
        //     }
        //   }
        // }
        // Check if another note with same fname and vault exists
        const resp = await this.noteStore.find({
            fname: note.fname,
            vault: note.vault,
        });
        const existingNote = resp.data ? resp.data[0] : undefined;
        // If a note exists with a different id but same fname/vault, then we throw an error unless its a stub or override is set
        if (existingNote && existingNote.id !== note.id) {
            // If note is a stub or client wants to override existing note, we need to update parent/children relationships since ids are different
            // The parent of this note needs to have the old note removed (because the id is now different)
            // The new note needs to have the old note's children
            if (existingNote.stub || opts?.overrideExisting) {
                // make sure existing note actually has a parent.
                if (!existingNote.parent) {
                    // TODO: We should be able to handle rewriting of root. This happens
                    // with certain operations such as Doctor FixFrontmatter
                    return {
                        error: new common_all_1.DendronError({
                            status: common_all_1.ERROR_STATUS.NO_PARENT_FOR_NOTE,
                            message: `No parent found for ${existingNote.fname}`,
                        }),
                    };
                }
                const parentResp = await this.noteStore.get(existingNote.parent);
                if (parentResp.error) {
                    return {
                        error: new common_all_1.DendronError({
                            status: common_all_1.ERROR_STATUS.NO_PARENT_FOR_NOTE,
                            message: `No parent found for ${existingNote.fname}`,
                            innerError: parentResp.error,
                        }),
                    };
                }
                // Save the state of the parent to later record changed entry.
                const parent = parentResp.data;
                const prevParentState = { ...parent };
                // Update existing note's parent so that it doesn't hold the existing note's id as children
                common_all_1.DNodeUtils.removeChild(parent, existingNote);
                // Update parent note of existing note so that the newly created note is a child
                common_all_1.DNodeUtils.addChild(parent, note);
                // Add an entry for the updated parent
                changes.push({
                    prevNote: prevParentState,
                    note: parent,
                    status: "update",
                });
                // Move children to new note
                changes = changes.concat(await this.updateChildrenWithNewParent(existingNote, note));
                // Delete the existing note from metadata store. Since fname/vault are the same, no need to touch filesystem
                changes.push({ note: existingNote, status: "delete" });
                changes.push({ note, status: "create" });
            }
            else {
                return {
                    error: new common_all_1.DendronError({
                        message: `Cannot write note with id ${note.id}. Note ${existingNote.id} with same fname and vault exists`,
                    }),
                };
            }
        }
        else if (existingNote && existingNote.id === note.id) {
            // If a note exist with the same id, then we treat this as an update
            changes.push({ prevNote: existingNote, note, status: "update" });
        }
        else {
            // If no note exists, then we treat this as a create
            changes.push({ note, status: "create" });
            // If existing note does not exist, check if we need to add parents
            // eg. if user created `baz.one.two` and neither `baz` or `baz.one` exist, then they need to be created
            // this is the default behavior
            if (!opts?.noAddParent) {
                const ancestorResp = await this.findClosestAncestor(note.fname, note.vault);
                if (ancestorResp.data) {
                    const ancestor = ancestorResp.data;
                    const prevAncestorState = { ...ancestor };
                    // Create stubs for any uncreated notes between ancestor and note
                    const stubNodes = common_all_1.NoteUtils.createStubs(ancestor, note);
                    stubNodes.forEach((stub) => {
                        changes.push({
                            status: "create",
                            note: stub,
                        });
                    });
                    changes.push({
                        status: "update",
                        prevNote: prevAncestorState,
                        note: ancestor,
                    });
                }
                else {
                    this.logger.error({
                        ctx,
                        msg: `Unable to find ancestor for note ${note.fname}`,
                    });
                    return { error: ancestorResp.error };
                }
            }
        }
        // Write to metadata store and/or filesystem
        const writeResp = opts?.metaOnly
            ? await this.noteStore.writeMetadata({ key: note.id, noteMeta: note })
            : await this.noteStore.write({ key: note.id, note });
        if (writeResp.error) {
            return {
                error: new common_all_1.DendronError({
                    message: `Unable to write note ${note.id}`,
                    severity: common_all_1.ERROR_SEVERITY.MINOR,
                    payload: writeResp.error,
                }),
            };
        }
        // TODO: Add schema
        // Propragate metadata for all other changes
        await this.queryStore.updateNotesIndex(changes);
        await this.updateNoteMetadataStore(changes);
        this._onNoteChangedEmitter.fire(changes);
        this.logger.info({
            ctx,
            msg: "exit",
            changed: changes.map((n) => common_all_1.NoteUtils.toLogObj(n.note)),
        });
        return {
            data: changes,
        };
    }
    async writeSchema() {
        throw Error("writeSchema not implemented");
    }
    async deleteNote(id, opts) {
        const ctx = "DendronEngineV3Web:delete";
        const changes = await super.deleteNote(id, opts);
        if (changes.error) {
            return changes;
        }
        if (changes.data)
            this._onNoteChangedEmitter.fire(changes.data);
        this.logger.info({
            ctx,
            msg: "exit",
            changed: changes.data?.map((n) => common_all_1.NoteUtils.toLogObj(n.note)),
        });
        return changes;
    }
    async initNotesNew(vaults) {
        const ctx = "DendronEngineV3Web:initNotes";
        this.logger.info({ ctx, msg: "enter" });
        let errors = [];
        let notesFname = {};
        // const start = process.hrtime();
        const allNotesList = await Promise.all(vaults.map(async (vault) => {
            // Get list of files from filesystem
            const maybeFiles = await this.fileStore.readDir({
                root: vscode_uri_1.Utils.joinPath(this.wsRootURI, common_all_1.VaultUtils.getRelPath(vault)),
                include: ["*.md"],
            });
            if (maybeFiles.error) {
                // Keep initializing other vaults
                errors = errors.concat([
                    new common_all_1.DendronError({
                        message: `Unable to read notes for vault ${vault.name}`,
                        severity: common_all_1.ERROR_SEVERITY.MINOR,
                        payload: maybeFiles.error,
                    }),
                ]);
                return {};
            }
            // TODO: Remove once this works inside file store.
            const filteredFiles = maybeFiles.data.filter((file) => file.endsWith(".md"));
            // // Load cache from vault
            // const cachePath = path.join(vpath, CONSTANTS.DENDRON_CACHE_FILE);
            // const notesCache = new NotesFileSystemCache({
            //   cachePath,
            //   noCaching: this.config.noCaching,
            //   logger: this.logger,
            // });
            // TODO: Currently mocked as empty
            // const notesDict: NoteDicts = {
            //   notesById: {},
            //   notesByFname: {},
            // };
            const { noteDicts, errors: parseErrors } = await new NoteParserV2_1.NoteParserV2(this.wsRootURI).parseFiles(filteredFiles, vault);
            errors = errors.concat(parseErrors);
            if (noteDicts) {
                const { notesById, notesByFname } = noteDicts;
                notesFname = common_all_1.NoteFnameDictUtils.merge(notesFname, notesByFname);
                // this.logger.info({
                //   ctx,
                //   vault,
                //   numEntries: _.size(notesById),
                //   numCacheUpdates: notesCache.numCacheMisses,
                // });
                return notesById;
            }
            return {};
        }));
        const allNotes = Object.assign({}, ...allNotesList);
        const notesWithLinks = lodash_1.default.filter(allNotes, (note) => !lodash_1.default.isEmpty(note.links));
        this.addBacklinks({
            notesById: allNotes,
            notesByFname: notesFname,
        }, notesWithLinks);
        // const duration = getDurationMilliseconds(start);
        // this.logger.info({ ctx, msg: `time to init notes: "${duration}" ms` });
        return {
            data: allNotes,
            error: new common_all_1.DendronCompositeError(errors),
        };
    }
    /**
     * Create and add backlinks from all notes with a link pointing to another note
     */
    addBacklinks(noteDicts, notesWithLinks) {
        notesWithLinks.forEach((noteFrom) => {
            try {
                noteFrom.links.forEach((link) => {
                    const maybeBacklink = common_all_1.BacklinkUtils.createFromDLink(link);
                    if (maybeBacklink) {
                        const notes = common_all_1.NoteDictsUtils.findByFname({
                            fname: link.to.fname,
                            noteDicts,
                            skipCloneDeep: true,
                        });
                        notes.forEach((noteTo) => {
                            common_all_1.BacklinkUtils.addBacklinkInPlace({
                                note: noteTo,
                                backlink: maybeBacklink,
                            });
                        });
                    }
                });
            }
            catch (err) {
                const error = (0, common_all_1.error2PlainObject)(err);
                this.logger.error({ error, noteFrom, message: "issue with backlinks" });
            }
        });
    }
    /**
     * Recursively search through fname to find next available ancestor note.
     *
     * E.g, if fpath = "baz.foo.bar", search for "baz.foo", then "baz", then "root" until first valid note is found
     * @param fpath of note to find ancestor of
     * @param vault of ancestor note
     * @returns closest ancestor note
     */
    async findClosestAncestor(fpath, vault) {
        const dirname = common_all_1.DNodeUtils.dirName(fpath);
        // Reached the end, must be root note
        if (dirname === "") {
            const rootResp = await this.noteStore.find({ fname: "root", vault });
            if (rootResp.error || rootResp.data.length === 0) {
                return {
                    error: common_all_1.DendronError.createFromStatus({
                        status: common_all_1.ERROR_STATUS.NO_ROOT_NOTE_FOUND,
                        message: `No root found for ${fpath}.`,
                        innerError: rootResp.error,
                        severity: common_all_1.ERROR_SEVERITY.MINOR,
                    }),
                };
            }
            return { data: rootResp.data[0] };
        }
        const parentResp = await this.noteStore.find({ fname: dirname, vault });
        if (parentResp.data && parentResp.data.length > 0) {
            return { data: parentResp.data[0] };
        }
        else {
            return this.findClosestAncestor(dirname, vault);
        }
    }
};
exports.DendronEngineV3Web = DendronEngineV3Web;
exports.DendronEngineV3Web = DendronEngineV3Web = __decorate([
    (0, inject_1.singleton)(),
    __param(0, (0, inject_1.inject)("wsRoot")),
    __param(1, (0, inject_1.inject)("vaults")),
    __param(2, (0, inject_1.inject)("IFileStore")),
    __param(3, (0, inject_1.inject)("INoteStore")),
    __metadata("design:paramtypes", [vscode_uri_1.URI, Array, Object, Object])
], DendronEngineV3Web);
//# sourceMappingURL=DendronEngineV3Web.js.map