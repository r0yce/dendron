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
const common_all_1 = require("@dendronhq/common-all");
const dev_1 = require("../utils/dev");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const unified_1 = require("@dendronhq/unified");
const Sentry = __importStar(require("@sentry/node"));
const fs_1 = __importDefault(require("fs"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const analytics_1 = require("../utils/analytics");
const md_1 = require("../utils/md");
const vsCodeUtils_1 = require("../vsCodeUtils");
const WSUtilsV2_1 = require("../WSUtilsV2");
const Backlink_1 = require("./Backlink");
/**
 * Provides the data to support the backlinks tree view panel
 */
class BacklinksTreeDataProvider {
    MAX_LINES_OF_CONTEX̣T = 10;
    FRONTMATTER_TAG_CONTEXT_PLACEHOLDER = "_Link is a Frontmatter Tag_";
    _onDidChangeTreeDataEmitter;
    _onEngineNoteStateChangedDisposable;
    _onDidChangeActiveTextEditorDisposable;
    _engineEvents;
    _sortOrder = undefined;
    _isLinkCandidateEnabled;
    /**
     * Signals to vscode UI engine that the backlinks view needs to be refreshed.
     */
    onDidChangeTreeData;
    /**
     *
     * @param engineEvents - specifies when note state has been changed on the
     * engine
     */
    constructor(engineEvents, config) {
        this._isLinkCandidateEnabled = config.dev?.enableLinkCandidates;
        // Set default sort order to use last updated
        this.sortOrder =
            engine_server_1.MetadataService.instance().BacklinksPanelSortOrder ??
                common_all_1.BacklinkPanelSortOrder.LastUpdated;
        this._onDidChangeTreeDataEmitter = new vscode_1.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeDataEmitter.event;
        this._engineEvents = engineEvents;
        if (config.workspace.enablePerfMode) {
            const ctx = "BacklinksTreeDataProvider.cons";
            logger_1.Logger.info({
                ctx,
                msg: "perf mode enabled, not subscribing to backlink updates",
            });
            return;
        }
        this.setupSubscriptions();
    }
    /**
     * How items are sorted in the backlink panel
     */
    get sortOrder() {
        return this._sortOrder;
    }
    /**
     * Update the sort order of the backlinks panel. This will also save the
     * update into metadata service for persistence.
     */
    set sortOrder(sortOrder) {
        if (sortOrder !== this._sortOrder) {
            this._sortOrder = sortOrder;
            vsCodeUtils_1.VSCodeUtils.setContextStringValue(constants_1.DendronContext.BACKLINKS_SORT_ORDER, sortOrder);
            this.refreshBacklinks();
            // Save the setting update into persistance storage:
            engine_server_1.MetadataService.instance().BacklinksPanelSortOrder = sortOrder;
        }
    }
    getTreeItem(element) {
        try {
            return element;
        }
        catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }
    getParent(element) {
        try {
            if (element.parentBacklink) {
                return element.parentBacklink;
            }
            else {
                return undefined;
            }
        }
        catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }
    async getChildren(element) {
        try {
            // TODO: Make the backlinks panel also work when preview is the active editor.
            const activeNote = await WSUtilsV2_1.WSUtilsV2.instance().getActiveNote();
            if (!activeNote) {
                return [];
            }
            if (!element) {
                // Root case, branch will get top level backlinks.
                return this.getAllBacklinkedNotes(activeNote.id, this._isLinkCandidateEnabled, this._sortOrder);
            }
            else {
                // 2nd-level children, which contains line-level references belonging to
                // a single note
                const refs = element?.refs;
                if (!refs) {
                    return [];
                }
                return this.getAllBacklinksInNoteFromRefs(refs, activeNote.fname, element);
            }
        }
        catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }
    /**
     * Implementing this method allows us to asynchronously calculate hover
     * contents ONLY when the user actually hovers over an item. Lazy loading this
     * data allows us to speed up the initial load time of the backlinks panel.
     * @param _item
     * @param element
     * @param _token
     * @returns
     */
    resolveTreeItem(_item, element, _token) {
        // This method implies that an item was hovered over
        analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.BacklinksPanelUsed, {
            type: "ItemHoverDisplayed",
            state: element.treeItemType,
        });
        if (element.treeItemType === Backlink_1.BacklinkTreeItemType.noteLevel &&
            element.refs) {
            return new Promise((resolve) => {
                this.getTooltipForNoteLevelTreeItem(element.refs).then((tooltip) => {
                    resolve({
                        tooltip,
                    });
                });
            });
        }
        else if (element.treeItemType === Backlink_1.BacklinkTreeItemType.referenceLevel) {
            return new Promise((resolve) => {
                if (element.singleRef?.isFrontmatterTag) {
                    resolve({
                        tooltip: new vscode_1.MarkdownString(this.FRONTMATTER_TAG_CONTEXT_PLACEHOLDER),
                    });
                }
                this.getSurroundingContextForRef(element.singleRef, this.MAX_LINES_OF_CONTEX̣T).then((value) => {
                    const tooltip = new vscode_1.MarkdownString();
                    tooltip.appendMarkdown(value);
                    tooltip.supportHtml = true;
                    tooltip.isTrusted = true;
                    tooltip.supportThemeIcons = true;
                    resolve({
                        tooltip,
                    });
                });
            });
        }
        else {
            return undefined;
        }
    }
    dispose() {
        if (this._onDidChangeTreeDataEmitter) {
            this._onDidChangeTreeDataEmitter.dispose();
        }
        if (this._onEngineNoteStateChangedDisposable) {
            this._onEngineNoteStateChangedDisposable.dispose();
        }
        if (this._onDidChangeActiveTextEditorDisposable) {
            this._onDidChangeActiveTextEditorDisposable.dispose();
        }
    }
    setupSubscriptions() {
        this._onDidChangeActiveTextEditorDisposable =
            vscode_1.window.onDidChangeActiveTextEditor(() => {
                const ctx = "refreshBacklinksChangeActiveTextEditor";
                logger_1.Logger.info({ ctx });
                this.refreshBacklinks();
            });
        this._onEngineNoteStateChangedDisposable =
            this._engineEvents.onEngineNoteStateChanged(() => {
                const ctx = "refreshBacklinksEngineNoteStateChanged";
                logger_1.Logger.info({ ctx });
                this.refreshBacklinks();
            });
    }
    /**
     * Tells VSCode to refresh the backlinks view. Debounced to fire every 250 ms
     */
    refreshBacklinks = lodash_1.default.debounce(() => {
        const perf = new common_all_1.PerformanceTimer({ timerName: "BacklinksRefresh" });
        perf.before("total");
        this._onDidChangeTreeDataEmitter.fire();
        // Note: actual heavy work happens in getChildren / getAllBacklinkedNotes
        // For now we time the trigger; deeper instrumentation can be added in getChildren
        perf.after("total");
        const shouldLog = process.env.DENDRON_PERF === "1" || process.env.LOG_LEVEL === "debug";
        if (shouldLog) {
            const report = perf.report();
            (0, dev_1.logPerfReport)("Backlinks", report);
        }
    }, 250);
    /**
     * Takes found references corresponding to a single note and turn them into
     * TreeItems
     * @param refs list of found references (for a single note)
     * @param fsPath fsPath of current note
     * @param parent parent backlink of these refs.
     * @returns list of TreeItems of found references
     */
    getAllBacklinksInNoteFromRefs = (refs, fsPath, parent) => {
        return refs.map((ref) => {
            const lineNum = ref.location.range.start.line;
            const backlink = Backlink_1.Backlink.createRefLevelBacklink(ref);
            backlink.iconPath = ref.isCandidate
                ? new vscode_1.ThemeIcon(constants_1.ICONS.LINK_CANDIDATE)
                : new vscode_1.ThemeIcon(constants_1.ICONS.WIKILINK);
            backlink.parentBacklink = parent;
            backlink.description = `on line ${lineNum + 1}`;
            backlink.command = {
                command: constants_1.DENDRON_COMMANDS.GOTO_BACKLINK.key,
                arguments: [
                    ref.location.uri,
                    { selection: ref.location.range },
                    ref.isCandidate ?? false,
                ],
                title: "Open File",
            };
            if (ref.isCandidate) {
                backlink.command = {
                    command: "dendron.convertCandidateLink",
                    title: "Convert Candidate Link",
                    arguments: [
                        { location: ref.location, text: path_1.default.parse(fsPath).name },
                    ],
                };
            }
            return backlink;
        });
    };
    /**
     * Return the array of notes that have backlinks to the current note ID as
     * Backlink TreeItem objects
     * @param noteId - note ID for which to get backlinks for
     * @param isLinkCandidateEnabled
     * @param sortOrder
     * @returns
     */
    async getAllBacklinkedNotes(noteId, isLinkCandidateEnabled, sortOrder) {
        const perf = new common_all_1.PerformanceTimer({ timerName: "GetBacklinks" });
        perf.before("total");
        perf.before("findReferences");
        const references = await (0, md_1.findReferencesById)({
            id: noteId,
            isLinkCandidateEnabled,
        });
        perf.after("findReferences");
        const referencesByPath = lodash_1.default.groupBy(
        // Exclude self-references:
        lodash_1.default.filter(references, (ref) => ref.note?.id !== noteId), ({ location }) => location.uri.fsPath);
        let pathsSorted;
        if (sortOrder === common_all_1.BacklinkPanelSortOrder.PathNames) {
            pathsSorted = this.shallowFirstPathSort(referencesByPath /* legacy lodash groupBy result vs Dictionary<tuple> strict mismatch; internal method; 4-axis style TODO per strict-mode-fixer Batch 6+ (final @ts burn 2026-06-01); never bare. Real type audit of ref shape would remove. */);
        }
        else if (sortOrder === common_all_1.BacklinkPanelSortOrder.LastUpdated) {
            pathsSorted = Object.keys(referencesByPath).sort((p1, p2) => {
                const ref1 = referencesByPath[p1];
                const ref2 = referencesByPath[p2];
                if (!ref1 || !ref2 || ref1.length === 0 || ref2.length === 0 || ref1[0].note === undefined || ref2[0].note === undefined) {
                    logger_1.Logger.error({
                        msg: "Missing info for well formed backlink sort by last updated.",
                    });
                    return 0;
                }
                // noUncheckedIndexedAccess guard: explicit length + note checks above guarantee non-null; ! is safe post-invariant (Batch 5+/6+ + debug launch sweep pattern)
                const r1 = ref1;
                const r2 = ref2;
                const ref2Updated = r2[0].note.updated;
                const ref1Updated = r1[0].note.updated;
                // We want to sort in descending order by last updated
                return ref2Updated - ref1Updated;
            });
        }
        else
            (0, common_all_1.assertUnreachable)(sortOrder);
        if (!pathsSorted.length) {
            return [];
        }
        const out = pathsSorted.map((pathParam) => {
            const references = referencesByPath[pathParam];
            const backlink = Backlink_1.Backlink.createNoteLevelBacklink(path_1.default.basename(pathParam, path_1.default.extname(pathParam)), references);
            const totalCount = references.length;
            const linkCount = references.filter((ref) => !ref.isCandidate).length;
            const candidateCount = isLinkCandidateEnabled
                ? totalCount - linkCount
                : 0;
            const backlinkCount = isLinkCandidateEnabled
                ? references.length
                : references.filter((ref) => !ref.isCandidate).length;
            if (backlinkCount === 0)
                return undefined;
            let linkCountDescription;
            if (linkCount === 1) {
                linkCountDescription = "1 link";
            }
            else if (linkCount > 1) {
                linkCountDescription = `${linkCount} links`;
            }
            let candidateCountDescription;
            if (candidateCount === 1) {
                candidateCountDescription = "1 candidate";
            }
            else if (candidateCount > 1) {
                candidateCountDescription = `${candidateCountDescription} candidates`;
            }
            const description = lodash_1.default.compact([
                linkCountDescription,
                candidateCountDescription,
            ]).join(", ");
            backlink.description = description;
            backlink.command = {
                command: constants_1.DENDRON_COMMANDS.GOTO_BACKLINK.key,
                arguments: [
                    vscode_1.Uri.file(pathParam),
                    { selection: references[0].location.range },
                    false,
                ],
                title: "Open File",
            };
            return backlink;
        });
        perf.after("total");
        const shouldLog = process.env.DENDRON_PERF === "1" || process.env.LOG_LEVEL === "debug";
        if (shouldLog) {
            (0, dev_1.logPerfReport)("BacklinksComputation", perf.report());
        }
        return lodash_1.default.filter(out, (item) => !lodash_1.default.isUndefined(item));
    }
    shallowFirstPathSort(referencesByPath) {
        return (0, md_1.sortPaths)(Object.keys(referencesByPath), {
            shallowFirst: true,
        });
    }
    /**
     * This tooltip will return a markdown string that has several components:
     * 1. A header section containing title, created, and updated times
     * 2. A concatenated list of references with some lines of surrounding context
     *    for each one.
     * @param references
     * @returns
     */
    async getTooltipForNoteLevelTreeItem(references) {
        // Shoot for around a max of 40 lines to render in the hover, otherwise,
        // it's a bit too long. Note, this doesn't take into account note reference
        // length, so those can potentially blow up the size of the context.
        // Factoring in note ref length can be a later enhancement
        let linesOfContext = 0;
        switch (references.length) {
            case 1: {
                linesOfContext = this.MAX_LINES_OF_CONTEX̣T;
                break;
            }
            case 2: {
                linesOfContext = 7;
                break;
            }
            case 3: {
                linesOfContext = 5;
                break;
            }
            default:
                linesOfContext = 3;
                break;
        }
        const markdownBlocks = await Promise.all(references.map(async (foundRef) => {
            // Just use a simple place holder if it's a frontmatter tag instead of
            // trying to render context
            if (foundRef.isFrontmatterTag) {
                return {
                    content: this.FRONTMATTER_TAG_CONTEXT_PLACEHOLDER,
                    isCandidate: false,
                };
            }
            return {
                content: (await this.getSurroundingContextForRef(foundRef, linesOfContext)),
                isCandidate: foundRef.isCandidate,
            };
        }));
        const tooltip = new vscode_1.MarkdownString();
        tooltip.isTrusted = true;
        tooltip.supportHtml = true;
        tooltip.supportThemeIcons = true;
        const noteProps = references.length > 0 ? references[0].note : undefined;
        if (noteProps) {
            tooltip.appendMarkdown(`## ${noteProps.title}
_created: ${common_all_1.DateFormatUtil.formatDate(noteProps.created)}_<br>
_updated: ${common_all_1.DateFormatUtil.formatDate(noteProps.updated)}_`);
            tooltip.appendMarkdown("<hr/>");
        }
        let curLinkCount = 1;
        let curCandidateCount = 1;
        for (const block of markdownBlocks) {
            let header;
            if (block.isCandidate) {
                header = `\n\n**CANDIDATE ${curCandidateCount}**<br>`;
                curCandidateCount += 1;
            }
            else {
                header = `\n\n**LINK ${curLinkCount}**<br>`;
                curLinkCount += 1;
            }
            tooltip.appendMarkdown(header);
            tooltip.appendMarkdown(block.content);
            tooltip.appendMarkdown("<hr/>");
        }
        return tooltip;
    }
    async getSurroundingContextForRef(ref, linesOfContext) {
        const proc = unified_1.MDUtilsV5.procRemarkFull({
            noteToRender: ref.note,
            fname: ref.note.fname,
            vault: ref.note.vault,
            dest: common_all_1.DendronASTDest.MD_REGULAR,
            backlinkHoverOpts: {
                linesOfContext,
                location: {
                    start: {
                        line: ref.location.range.start.line + 1, // 1 indexed
                        column: ref.location.range.start.character + 1, // 1 indexed
                    },
                    end: {
                        line: ref.location.range.end.line + 1,
                        column: ref.location.range.end.character + 1,
                    },
                },
            },
            config: common_server_1.DConfig.readConfigSync(ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot, true),
        }, {
            flavor: common_all_1.ProcFlavor.BACKLINKS_PANEL_HOVER,
        });
        const note = ref.note;
        const fsPath = common_all_1.NoteUtils.getFullPath({
            note,
            wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
        });
        const fileContent = fs_1.default.readFileSync(fsPath).toString();
        return (await proc.process(fileContent)).toString();
    }
}
exports.default = BacklinksTreeDataProvider;
//# sourceMappingURL=BacklinksTreeDataProvider.js.map