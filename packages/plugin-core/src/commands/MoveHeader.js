"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoveHeaderCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const unified_1 = require("@dendronhq/unified");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const unist_util_visit_1 = __importDefault(require("unist-util-visit"));
const NoteLookupProviderUtils_1 = require("../components/lookup/NoteLookupProviderUtils");
const NotePickerUtils_1 = require("../components/lookup/NotePickerUtils");
const utils_1 = require("../components/lookup/utils");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const windowDecorations_1 = require("../features/windowDecorations");
const autoCompleter_1 = require("../utils/autoCompleter");
const md_1 = require("../utils/md");
const ProxyMetricUtils_1 = require("../utils/ProxyMetricUtils");
const AutoCompletableRegistrar_1 = require("../utils/registers/AutoCompletableRegistrar");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
class MoveHeaderCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.MOVE_HEADER.key;
    headerNotSelectedError = new common_all_1.DendronError({
        message: "You must first select the header you want to move.",
        severity: common_all_1.ERROR_SEVERITY.MINOR,
    });
    noActiveNoteError = new common_all_1.DendronError({
        message: "No note open.",
        severity: common_all_1.ERROR_SEVERITY.MINOR,
    });
    noNodesToMoveError = new common_all_1.DendronError({
        message: "There are no nodes to move. If your selection is valid, try again after reloading VSCode.",
        severity: common_all_1.ERROR_SEVERITY.MINOR,
    });
    noDestError = new common_all_1.DendronError({
        message: "No destination provided.",
        severity: common_all_1.ERROR_SEVERITY.MINOR,
    });
    getProc = (engine, note) => {
        return unified_1.MDUtilsV5.procRemarkFull({
            noteToRender: note,
            fname: note.fname,
            vault: note.vault,
            dest: common_all_1.DendronASTDest.MD_DENDRON,
            config: common_server_1.DConfig.readConfigSync(engine.wsRoot),
        });
    };
    /**
     * Helper for {@link MoveHeaderCommand.gatherInputs}
     * Validates and processes inputs to be passed for further action
     * @param engine
     * @returns {}
     */
    async validateAndProcessInput(engine) {
        const { editor, selection } = vsCodeUtils_1.VSCodeUtils.getSelection();
        // basic input validation
        if (!editor)
            throw this.noActiveNoteError;
        if (!selection)
            throw this.headerNotSelectedError;
        const line = editor.document.lineAt(selection.start.line).text;
        const maybeNote = await ExtensionProvider_1.ExtensionProvider.getWSUtils().getNoteFromDocument(editor.document);
        if (!maybeNote) {
            throw this.noActiveNoteError;
        }
        // parse selection and get the target header node
        const proc = this.getProc(engine, maybeNote);
        // TODO: shoudl account for line number
        const bodyAST = proc.parse(maybeNote.body);
        const parsedLine = proc.parse(line);
        let targetHeader;
        let targetIndex;
        // Find the first occurring heading node in selected line.
        // This should be our target.
        (0, unist_util_visit_1.default)(parsedLine, [unified_1.DendronASTTypes.HEADING], (heading, index) => {
            targetHeader = heading;
            targetIndex = index;
            return false;
        });
        if (!targetHeader || lodash_1.default.isUndefined(targetIndex)) {
            throw this.headerNotSelectedError;
        }
        const resp = unified_1.MdastUtils.findHeader({
            nodes: bodyAST.children,
            match: targetHeader,
        });
        if (!resp) {
            throw Error("did not find header");
        }
        return {
            proc,
            origin: maybeNote,
            targetHeader,
            targetHeaderIndex: resp.index,
        };
    }
    /**
     * Helper for {@link MoveHeaderCommand.gatherInputs}
     * Prompts user to do a lookup on the desired destination.
     * @param opts
     * @returns
     */
    promptForDestination(lookupController, opts) {
        const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
        const lookupProvider = extension.noteLookupProviderFactory.create(this.key, {
            allowNewNote: true,
            noHidePickerOnAccept: false,
        });
        lookupController.show({
            title: "Select note to move header to",
            placeholder: "note",
            provider: lookupProvider,
            initialValue: NotePickerUtils_1.NotePickerUtils.getInitialValueFromOpenEditor(),
            nonInteractive: opts?.nonInteractive,
        });
        return lookupController;
    }
    /**
     * Get the destination note given a quickpick and the selected item.
     * @param opts
     * @returns
     */
    async prepareDestination(opts) {
        const { engine, quickpick, selectedItems } = opts;
        const vault = quickpick.vault || utils_1.PickerUtilsV2.getVaultForOpenEditor();
        let dest;
        if (lodash_1.default.isUndefined(selectedItems)) {
            dest = undefined;
        }
        else {
            const selected = selectedItems[0];
            const isCreateNew = utils_1.PickerUtilsV2.isCreateNewNotePicked(selected);
            if (isCreateNew) {
                // check if we really want to create a new note.
                // if a user selects a vault in the picker that
                // already has the note, we should not create a new one.
                const fname = selected.fname;
                const maybeNote = (await engine.findNotes({ fname, vault }))[0];
                if (lodash_1.default.isUndefined(maybeNote)) {
                    dest = common_all_1.NoteUtils.create({ fname, vault });
                }
                else {
                    dest = maybeNote;
                }
            }
            else {
                dest = selected;
            }
        }
        return dest;
    }
    async gatherInputs(opts) {
        // validate and process input
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        const { proc, origin, targetHeader, targetHeaderIndex } = await this.validateAndProcessInput(engine);
        // extract nodes that need to be moved
        const originTree = proc.parse(origin.body);
        const nodesToMove = unified_1.RemarkUtils.extractHeaderBlock(originTree, targetHeader.depth, targetHeaderIndex);
        if (nodesToMove.length === 0) {
            throw this.noNodesToMoveError;
        }
        const lcOpts = {
            nodeType: "note",
            disableVaultSelection: opts?.useSameVault,
            vaultSelectCanToggle: false,
        };
        const lc = ExtensionProvider_1.ExtensionProvider.getExtension().lookupControllerFactory.create(lcOpts);
        return new Promise((resolve) => {
            let disposable;
            NoteLookupProviderUtils_1.NoteLookupProviderUtils.subscribe({
                id: this.key,
                controller: lc,
                logger: this.L,
                onDone: async (event) => {
                    const data = event.data;
                    const quickpick = lc.quickPick;
                    const dest = await this.prepareDestination({
                        engine,
                        quickpick,
                        selectedItems: data.selectedItems,
                    });
                    resolve({
                        dest,
                        origin,
                        nodesToMove,
                        engine,
                    });
                    disposable?.dispose();
                    vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, false);
                },
            });
            this.promptForDestination(lc, opts);
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
    /**
     * Helper for {@link MoveHeaderCommand.execute}
     * Given a list of nodes to move, appends them to the destination
     * @param engine
     * @param dest
     * @param nodesToMove
     */
    async appendHeaderToDestination(opts) {
        const { engine, dest, origin, nodesToMove } = opts;
        // find where the extracted block starts and ends
        const startOffset = nodesToMove[0].position?.start.offset;
        const endOffset = lodash_1.default.last(nodesToMove).position?.end.offset;
        const originBody = origin.body;
        const destContentToAppend = originBody.slice(startOffset, endOffset);
        // add the stringified blocks to destination note body
        dest.body = `${dest.body}\n\n${destContentToAppend}`;
        await engine.writeNote(dest);
    }
    /**
     * Helper for {@link MoveHeaderCommand.execute}
     * given a copy of origin, and the modified content of origin,
     * find the difference and return the updated anchor names
     * @param originDeepCopy
     * @param modifiedOriginContent
     * @returns anchorNamesToUpdate
     */
    findAnchorNamesToUpdate(originDeepCopy, modifiedOriginContent) {
        const anchorsBefore = unified_1.RemarkUtils.findAnchors(originDeepCopy.body);
        const anchorsAfter = unified_1.RemarkUtils.findAnchors(modifiedOriginContent);
        const anchorsToUpdate = lodash_1.default.differenceWith(anchorsBefore, anchorsAfter, unified_1.RemarkUtils.hasIdenticalChildren);
        const anchorNamesToUpdate = lodash_1.default.map(anchorsToUpdate, (anchor) => {
            const slugger = (0, common_all_1.getSlugger)();
            const payload = unified_1.AnchorUtils.anchorNode2anchor(anchor, slugger);
            return payload[0];
        });
        return anchorNamesToUpdate;
    }
    /**
     * Helper for {@link MoveHeaderCommand.updateReferences}
     * Given a {@link Location}, find the respective note.
     * @param location
     * @param engine
     * @returns note
     */
    async getNoteByLocation(location, engine) {
        const fsPath = location.uri.fsPath;
        const fname = common_all_1.NoteUtils.normalizeFname(path_1.default.basename(fsPath));
        const vault = ExtensionProvider_1.ExtensionProvider.getWSUtils().getVaultFromUri(location.uri);
        return (await engine.findNotes({ fname, vault }))[0];
    }
    /**
     * Helper for {@link MoveHeaderCommand.updateReferences}
     * Given an note, origin note, and a list of anchor names,
     * return all links that should be updated in {@link note},
     * is a descending order of location offset.
     * @param note
     * @param engine
     * @param origin
     * @param anchorNamesToUpdate
     * @returns
     */
    findLinksToUpdate(note, origin, anchorNamesToUpdate, config) {
        const links = unified_1.LinkUtils.findLinksFromBody({
            note,
            config,
        }).filter((link) => {
            return (link.to?.fname?.toLowerCase() === origin.fname.toLowerCase() &&
                link.to?.anchorHeader &&
                anchorNamesToUpdate.includes(link.to.anchorHeader));
        });
        // modify it from the bottom
        // to avoid dealing with offsetting locations
        const linksToUpdate = lodash_1.default.orderBy(links, (link) => {
            return link.position?.start.offset;
        }, "desc");
        return linksToUpdate;
    }
    /**
     * Helper for {@link MoveHeaderCommand.updateReferences}
     * Given a note that has links to update, and a list of links,
     * modify the note's body to have updated links.
     * @param note Note that has links to update
     * @param linksToUpdate list of links to update
     * @param dest Note that was the destination of move header commnad
     * @returns
     */
    async updateLinksInNote(opts) {
        const { note, engine, linksToUpdate, dest } = opts;
        const notesWithSameName = await engine.findNotesMeta({ fname: dest.fname });
        return lodash_1.default.reduce(linksToUpdate, (note, linkToUpdate) => {
            const oldLink = unified_1.LinkUtils.dlink2DNoteLink(linkToUpdate);
            // original link had vault prefix?
            //   keep it
            // original link didn't have vault prefix?
            //   add vault prefix if there are notes with same name in other vaults.
            //   don't add otherwise.
            const isXVault = oldLink.data.xvault || notesWithSameName.length > 1;
            const newLink = {
                ...oldLink,
                from: {
                    ...oldLink.from,
                    fname: dest.fname,
                    vaultName: common_all_1.VaultUtils.getName(dest.vault),
                },
                data: {
                    xvault: isXVault,
                },
            };
            const newBody = unified_1.LinkUtils.updateLink({
                note: note,
                oldLink,
                newLink,
            });
            note.body = newBody;
            return note;
        }, note);
    }
    /**
     * Helper for {@link MoveHeaderCommand.execute}
     * Given a list of found references, update those references
     * so that they point to the correct header in a destination note.
     * @param foundReferences
     * @param anchorNamesToUpdate
     * @param engine
     * @param origin
     * @param dest
     * @returns updated
     */
    async updateReferences(foundReferences, anchorNamesToUpdate, engine, origin, dest) {
        let noteChangeEntries = [];
        const ctx = `${this.key}:updateReferences`;
        const refsToProcess = (await Promise.all(foundReferences
            .filter((ref) => !ref.isCandidate)
            .filter((ref) => (0, md_1.hasAnchorsToUpdate)(ref, anchorNamesToUpdate))
            .map((ref) => this.getNoteByLocation(ref.location, engine)))).filter(common_all_1.isNotUndefined);
        const config = common_server_1.DConfig.readConfigSync(engine.wsRoot);
        await (0, common_all_1.asyncLoopOneAtATime)(refsToProcess, async (note) => {
            try {
                const vaultPath = (0, common_server_1.vault2Path)({
                    vault: note.vault,
                    wsRoot: engine.wsRoot,
                });
                const resp = (0, common_server_1.file2Note)(path_1.default.join(vaultPath, note.fname + ".md"), note.vault);
                if (common_all_1.ErrorUtils.isErrorResp(resp)) {
                    throw new Error();
                }
                const _note = resp.data;
                const linksToUpdate = this.findLinksToUpdate(_note, origin, anchorNamesToUpdate, config);
                const modifiedNote = await this.updateLinksInNote({
                    note: _note,
                    engine,
                    linksToUpdate,
                    dest,
                });
                note.body = modifiedNote.body;
                const writeResp = await engine.writeNote(note);
                if (writeResp.data) {
                    noteChangeEntries = noteChangeEntries.concat(writeResp.data);
                }
            }
            catch (error) {
                // TODO: should notify which one we failed during update.
                this.L.error({ ctx, error });
            }
        });
        return noteChangeEntries;
    }
    /**
     * Helper for {@link MoveHeaderCommand.execute}
     * Given a origin note and a list of nodes to move,
     * remove the nodes from the origin's note body
     * and return the modified origin content rendered as string
     * @param origin origin note
     * @param nodesToMove nodes that will be moved
     * @param engine
     * @returns
     */
    async removeBlocksFromOrigin(origin, nodesToMove, engine) {
        // find where the extracted block starts and ends
        const startOffset = nodesToMove[0].position?.start.offset;
        const endOffset = lodash_1.default.last(nodesToMove).position?.end.offset;
        // remove extracted blocks
        const originBody = origin.body;
        const modifiedOriginContent = [
            originBody.slice(0, startOffset),
            originBody.slice(endOffset),
        ].join("");
        origin.body = modifiedOriginContent;
        await engine.writeNote(origin);
        return modifiedOriginContent;
    }
    async execute(opts) {
        const ctx = "MoveHeaderCommand";
        this.L.info({ ctx, opts });
        const { origin, nodesToMove, engine } = opts;
        const dest = opts.dest;
        if (lodash_1.default.isUndefined(dest)) {
            // we failed to get a destination. exit.
            throw this.noDestError;
        }
        // deep copy the origin before mutating it
        const originDeepCopy = lodash_1.default.cloneDeep(origin);
        // remove blocks from origin
        const modifiedOriginContent = await this.removeBlocksFromOrigin(origin, nodesToMove, engine);
        // append header to destination
        await this.appendHeaderToDestination({
            engine,
            dest,
            origin: originDeepCopy,
            nodesToMove,
        });
        (0, windowDecorations_1.delayedUpdateDecorations)();
        // update all references to old block
        const anchorNamesToUpdate = this.findAnchorNamesToUpdate(originDeepCopy, modifiedOriginContent);
        const foundReferences = await (0, md_1.findReferences)(origin.fname);
        const updated = await this.updateReferences(foundReferences, anchorNamesToUpdate, engine, origin, dest);
        return { ...opts, changed: updated };
    }
    trackProxyMetrics({ out, noteChangeEntryCounts, }) {
        const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
        const engine = extension.getEngine();
        const { vaults } = engine;
        // only look at origin note
        const { origin } = out;
        const headers = lodash_1.default.toArray(origin.anchors).filter((anchor) => {
            return anchor !== undefined && anchor.type === "header";
        });
        const numOriginHeaders = headers.length;
        const originHeaderDepths = headers.map((header) => header.depth);
        const maxOriginHeaderDepth = lodash_1.default.max(originHeaderDepths);
        const meanOriginHeaderDepth = lodash_1.default.mean(originHeaderDepths);
        const movedHeaders = out.nodesToMove.filter((node) => {
            return node.type === "heading";
        });
        const numMovedHeaders = movedHeaders.length;
        const movedHeaderDepths = movedHeaders.map((header) => header.depth);
        const maxMovedHeaderDepth = lodash_1.default.max(movedHeaderDepths);
        const meanMovedHeaderDepth = lodash_1.default.mean(movedHeaderDepths);
        ProxyMetricUtils_1.ProxyMetricUtils.trackRefactoringProxyMetric({
            props: {
                command: this.key,
                numVaults: vaults.length,
                traits: origin.traits || [],
                numChildren: origin.children.length,
                numLinks: origin.links.length,
                numChars: origin.body.length,
                noteDepth: common_all_1.DNodeUtils.getDepth(origin),
            },
            extra: {
                ...noteChangeEntryCounts,
                numOriginHeaders,
                maxOriginHeaderDepth,
                meanOriginHeaderDepth,
                numMovedHeaders,
                maxMovedHeaderDepth,
                meanMovedHeaderDepth,
            },
        });
    }
    addAnalyticsPayload(_opts, out) {
        const noteChangeEntryCounts = out !== undefined
            ? { ...(0, common_all_1.extractNoteChangeEntryCounts)(out.changed) }
            : {
                createdCount: 0,
                updatedCount: 0,
                deletedCount: 0,
            };
        try {
            this.trackProxyMetrics({ out, noteChangeEntryCounts });
        }
        catch (error) {
            this.L.error({ error });
        }
        return noteChangeEntryCounts;
    }
}
exports.MoveHeaderCommand = MoveHeaderCommand;
//# sourceMappingURL=MoveHeader.js.map