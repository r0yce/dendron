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
exports.debouncedUpdateDecorations = exports.EDITOR_DECORATION_TYPES = void 0;
exports.delayedUpdateDecorations = delayedUpdateDecorations;
exports.updateDecorations = updateDecorations;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const unified_1 = require("@dendronhq/unified");
const Sentry = __importStar(require("@sentry/node"));
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const types_1 = require("../types");
const frontmatter_1 = require("../utils/frontmatter");
const vsCodeUtils_1 = require("../vsCodeUtils");
const NoteRefComment_1 = require("./NoteRefComment");
/** Wait this long in miliseconds before trying to update decorations when a command forces a decoration update. */
const DECORATION_UPDATE_DELAY = 100;
/** Decorators only decorate what's visible on the screen. To avoid the user
 * seeing undecorated text if they scroll too quickly, we decorate some of the
 * text surrounding what's visible on the screen. This number determines how
 * many lines (above top and below bottom) surrounding the visible text should
 * be decorated. */
const VISIBLE_RANGE_MARGIN = 20;
/** Color used to highlight the decorator text portions ([x], priority:high etc.) of task notes. */
const TASK_NOTE_DECORATION_COLOR = new vscode_1.ThemeColor("editorLink.activeForeground");
/** Color used for the border of the colored square of hashtags. */
const HASHTAG_BORDER_COLOR = new vscode_1.ThemeColor("foreground");
exports.EDITOR_DECORATION_TYPES = {
    timestamp: vscode_1.window.createTextEditorDecorationType({}),
    blockAnchor: vscode_1.window.createTextEditorDecorationType({
        opacity: "40%",
        rangeBehavior: vscode_1.DecorationRangeBehavior.ClosedOpen,
    }),
    /** Decoration for wikilinks that point to valid notes. */
    wikiLink: vscode_1.window.createTextEditorDecorationType({
        color: new vscode_1.ThemeColor("editorLink.activeForeground"),
        rangeBehavior: vscode_1.DecorationRangeBehavior.ClosedClosed,
    }),
    /** Decoration for wikilinks that do *not* point to valid notes (e.g. broken). */
    brokenWikilink: vscode_1.window.createTextEditorDecorationType({
        color: new vscode_1.ThemeColor("editorWarning.foreground"),
        backgroundColor: new vscode_1.ThemeColor("editorWarning.background"),
        rangeBehavior: vscode_1.DecorationRangeBehavior.ClosedClosed,
    }),
    /** Decoration for the alias part of wikilinks. */
    alias: vscode_1.window.createTextEditorDecorationType({
        fontStyle: "italic",
    }),
    noteRef: vscode_1.window.createTextEditorDecorationType({
        color: new vscode_1.ThemeColor("editorLink.activeForeground"),
        rangeBehavior: vscode_1.DecorationRangeBehavior.ClosedClosed,
    }),
    brokenNoteRef: vscode_1.window.createTextEditorDecorationType({
        color: new vscode_1.ThemeColor("editorWarning.foreground"),
        backgroundColor: new vscode_1.ThemeColor("editorWarning.background"),
        rangeBehavior: vscode_1.DecorationRangeBehavior.ClosedClosed,
    }),
    taskNote: vscode_1.window.createTextEditorDecorationType({
        rangeBehavior: vscode_1.DecorationRangeBehavior.ClosedClosed,
    }),
};
function renderNoteRef({ reference, note, engine, }) {
    const id = `note.id-${reference}`;
    const fakeNote = common_all_1.NoteUtils.createForFake({
        // Mostly same as the note...
        fname: note.fname,
        vault: note.vault,
        // except the changed ID to avoid caching
        id,
        // And using the reference as the text of the note
        contents: reference,
    });
    fakeNote.config = { global: { enablePrettyRefs: false } };
    return engine.renderNote({
        id: fakeNote.id,
        note: fakeNote,
        dest: common_all_1.DendronASTDest.HTML,
        flavor: common_all_1.ProcFlavor.HOVER_PREVIEW,
    });
}
function delayedUpdateDecorations(updateDelay = DECORATION_UPDATE_DELAY) {
    const beforeTimerPath = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
    setTimeout(() => {
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        // Avoid running this if the same document is no longer open
        if (editor && editor.document.uri.fsPath === beforeTimerPath) {
            try {
                updateDecorations(editor);
            }
            catch (error) {
                logger_1.Logger.info({ ctx: "delayedUpdateDecorations", error });
            }
        }
    }, updateDelay);
}
function updateDecorationsKeyFunction(editor) {
    return editor.document.uri.fsPath;
}
exports.debouncedUpdateDecorations = (0, common_all_1.debounceAsyncUntilComplete)({
    fn: updateDecorations,
    keyFn: updateDecorationsKeyFunction,
    timeout: 50,
    trailing: true,
});
async function addInlineNoteRefs(opts) {
    const ctx = "addInlineNoteRefs";
    const inlineNoteRefs = ExtensionProvider_1.ExtensionProvider.getCommentThreadsState().inlineNoteRefs;
    const docKey = opts.document.uri.toString();
    const lastNoteRefThreadMap = inlineNoteRefs.get(docKey);
    const newNoteRefThreadMap = new Map();
    const disposeLastNoteRefThreadMap = () => {
        for (const thread of lastNoteRefThreadMap.values()) {
            thread.dispose();
        }
    };
    // if decoratorations is zero it could mean:
    // 1. no note refs in document in which case we dispose of everything
    // 2. we scrolled out of the range of the note refs
    if (opts.decorations.length === 0) {
        disposeLastNoteRefThreadMap();
        inlineNoteRefs.set(docKey, newNoteRefThreadMap);
        return;
    }
    const range2String = (range) => {
        return [
            range.start.line,
            range.start.character,
            range.end.line,
            range.end.character,
        ].join(",");
    };
    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
    const noteRefCommentController = ExtensionProvider_1.ExtensionProvider.getExtension().noteRefCommentController;
    logger_1.Logger.debug({
        ctx,
        msg: "enter",
        docKey,
    });
    // update all comment threads as needed
    await Promise.all(opts.decorations.map(async (ent) => {
        if (ent.data.noteMeta === undefined) {
            return;
        }
        const key = [
            docKey,
            range2String(ent.decoration.range),
            unified_1.NoteRefUtils.dnodeRefLink2String(ent.data.link),
        ].toString();
        if (lastNoteRefThreadMap.has(key)) {
            logger_1.Logger.debug({ ctx, msg: "found key, restoring", key });
            newNoteRefThreadMap.set(key, lastNoteRefThreadMap.get(key));
            lastNoteRefThreadMap.delete(key);
        }
        else {
            logger_1.Logger.debug({ ctx, msg: "no key found, creating", key });
            const reference = opts.document.getText(ent.decoration.range);
            const renderResult = await (0, common_all_1.fromPromise)(renderNoteRef({
                reference,
                note: ent.data.noteMeta,
                engine,
            }), (err) => err);
            if (renderResult.isErr()) {
                return;
            }
            const renderResp = renderResult.value;
            // const renderResp = await engine.renderNote({ id });
            const thread = noteRefCommentController.createCommentThread(opts.document.uri, ent.decoration.range, [new NoteRefComment_1.NoteRefComment(renderResp)]);
            thread.canReply = false;
            thread.label = ent.data.noteMeta.title;
            newNoteRefThreadMap.set(key, thread);
        }
    }));
    logger_1.Logger.debug({
        ctx,
        msg: "exit",
        docKey,
    });
    inlineNoteRefs.set(docKey, newNoteRefThreadMap);
    // dispose of old thread values
    disposeLastNoteRefThreadMap();
}
// see [[Decorations|dendron://dendron.docs/pkg.plugin-core.ref.decorations]] for further docs
async function updateDecorations(editor) {
    try {
        const ctx = "updateDecorations";
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        const config = common_server_1.DConfig.readConfigSync(engine.wsRoot, true);
        if (common_all_1.ConfigUtils.getWorkspace(config).enableEditorDecorations === false) {
            // Explicitly disabled, stop here.
            return {};
        }
        logger_1.Logger.debug({ ctx, msg: "enter" });
        const getInputRanges = (editor) => {
            const inputRanges = vsCodeUtils_1.VSCodeUtils.mergeOverlappingRanges(editor.visibleRanges.map((range) => vsCodeUtils_1.VSCodeUtils.padRange({
                range,
                padding: VISIBLE_RANGE_MARGIN,
                zeroCharacter: true,
            })));
            return inputRanges.map((range) => {
                return {
                    range: vsCodeUtils_1.VSCodeUtils.toPlainRange(range),
                    text: editor.document.getText(range),
                };
            });
        };
        const shouldAbort = (editor) => {
            // There's another execution that has already been called after this was
            // run. That means these results are stale. If existing lines have shifted
            // up or down since this function execution was started, setting the
            // decorations now will place the decorations at bad positions in the
            // document. On the other hand, if we do nothing VSCode will smartly move
            // those decorations to their new locations. With another execution
            // already scheduled, it's better to just wait for those decorations to
            // come in.
            return (exports.debouncedUpdateDecorations.states.get(updateDecorationsKeyFunction(editor)) === "trailing");
        };
        // Only show decorations & warnings for notes
        let note;
        try {
            note = await ExtensionProvider_1.ExtensionProvider.getWSUtils().getNoteFromDocument(editor.document);
            if (lodash_1.default.isUndefined(note))
                return {};
        }
        catch (error) {
            logger_1.Logger.info({
                ctx,
                msg: "Unable to check if decorations should be updated",
                error,
            });
            return {};
        }
        // Only decorate visible ranges, of which there could be multiple if the document is open in multiple tabs
        const ranges = getInputRanges(editor);
        const out = await engine.getDecorations({
            id: note.id,
            ranges,
            text: editor.document.getText(),
        });
        if (shouldAbort(editor)) {
            return {};
        }
        const { data, error } = out;
        logger_1.Logger.info({
            ctx,
            msg: "decorating...",
            payload: {
                error,
                decorationsLength: data?.decorations?.length,
                diagnosticsLength: data?.diagnostics?.length,
            },
        });
        // begin: extract decorations
        const vscodeDecorations = data?.decorations
            ?.map(mapDecoration)
            .filter(common_all_1.isNotUndefined);
        // return if no decorations
        if (vscodeDecorations === undefined)
            return {};
        // begin: apply decorations
        // NOTE: we group decorations so we can use `editor.setDecorations(type, decorations)` to apply values in bulk
        const activeDecorations = (0, common_all_1.mapValues)((0, common_all_1.groupBy)(vscodeDecorations, (decoration) => decoration.type), (decorations) => decorations.map((item) => item.decoration));
        for (const [type, payload] of activeDecorations.entries()) {
            editor.setDecorations(type, payload);
        }
        // begin: apply inline note refs
        if (config.dev?.enableExperimentalInlineNoteRef) {
            const noteRefDecorators = vscodeDecorations.filter((ent) => {
                return ent.type === exports.EDITOR_DECORATION_TYPES.noteRef;
            });
            logger_1.Logger.debug({
                ctx,
                msg: "noteRefDecorators",
                noteRefDecorators: noteRefDecorators.map((ent) => {
                    return { range: ent.decoration.range, link: ent.data.link };
                }),
            });
            await addInlineNoteRefs({
                decorations: noteRefDecorators,
                document: editor.document,
            });
        }
        // Clear out any old decorations left over from last pass
        for (const type of lodash_1.default.values(exports.EDITOR_DECORATION_TYPES)) {
            if (!activeDecorations.has(type)) {
                editor.setDecorations(type, []);
            }
        }
        const allWarnings = data?.diagnostics?.map((diagnostic) => {
            const diagnosticObject = new vscode_1.Diagnostic(vsCodeUtils_1.VSCodeUtils.toRangeObject(diagnostic.range), diagnostic.message, diagnostic.severity);
            diagnosticObject.code = diagnostic.code;
            return diagnosticObject;
        }) || [];
        (0, frontmatter_1.delayedFrontmatterWarning)(editor.document.uri, allWarnings);
        return {
            allDecorations: activeDecorations,
            allWarnings,
        };
    }
    catch (err) {
        Sentry.captureException(err);
        throw err;
    }
}
function mapDecoration(decoration) {
    switch (decoration.type) {
        // Some decoration types require special processing to add per-decoration data
        case unified_1.DECORATION_TYPES.timestamp:
            return mapTimestamp(decoration);
        case unified_1.DECORATION_TYPES.brokenNoteRef:
        case unified_1.DECORATION_TYPES.noteRef:
            return mapNoteRefLink(decoration);
        case unified_1.DECORATION_TYPES.brokenWikilink: // fallthrough deliberate
        case unified_1.DECORATION_TYPES.wikiLink:
            return mapWikilink(decoration); // some wikilinks are hashtags and need the color squares
        case unified_1.DECORATION_TYPES.taskNote:
            return mapTaskNote(decoration);
        default:
            // For all other types, just their basic options in `EDITOR_DECORATION_TYPES` is enough.
            return mapBasicDecoration(decoration);
    }
}
function mapBasicDecoration(decoration) {
    const type = exports.EDITOR_DECORATION_TYPES[decoration.type];
    if (!type)
        return undefined;
    return {
        type,
        decoration: {
            range: vsCodeUtils_1.VSCodeUtils.toRangeObject(decoration.range),
        },
        data: decoration.data,
    };
}
function mapTimestamp(decoration) {
    const tsConfig = ExtensionProvider_1.ExtensionProvider.getWorkspaceConfig().get(types_1.CodeConfigKeys.DEFAULT_TIMESTAMP_DECORATION_FORMAT);
    const formatOption = common_all_1.DateTime[tsConfig];
    const timestamp = common_all_1.DateTime.fromMillis(decoration.timestamp);
    return {
        type: exports.EDITOR_DECORATION_TYPES.timestamp,
        decoration: {
            range: vsCodeUtils_1.VSCodeUtils.toRangeObject(decoration.range),
            renderOptions: {
                after: {
                    contentText: `  (${timestamp.toLocaleString(formatOption)})`,
                },
            },
        },
    };
}
function mapNoteRefLink(decoration) {
    return mapBasicDecoration(decoration);
}
function mapWikilink(decoration) {
    if ((0, unified_1.isDecorationHashTag)(decoration)) {
        const type = exports.EDITOR_DECORATION_TYPES[decoration.type];
        if (!type)
            return undefined;
        return {
            type,
            decoration: {
                range: vsCodeUtils_1.VSCodeUtils.toRangeObject(decoration.range),
                renderOptions: {
                    before: {
                        contentText: " ",
                        width: "0.8rem",
                        height: "0.8rem",
                        margin: "auto 0.2rem",
                        border: "1px solid",
                        borderColor: HASHTAG_BORDER_COLOR,
                        backgroundColor: decoration.color,
                    },
                },
            },
        };
    }
    return mapBasicDecoration(decoration);
}
function mapTaskNote(decoration) {
    return {
        type: exports.EDITOR_DECORATION_TYPES.taskNote,
        decoration: {
            range: vsCodeUtils_1.VSCodeUtils.toRangeObject(decoration.range),
            renderOptions: {
                before: {
                    contentText: decoration.beforeText,
                    color: TASK_NOTE_DECORATION_COLOR,
                    fontWeight: "200",
                },
                after: {
                    contentText: decoration.afterText,
                    color: TASK_NOTE_DECORATION_COLOR,
                    fontWeight: "200",
                },
            },
        },
    };
}
//# sourceMappingURL=windowDecorations.js.map