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
exports.LookupControllerV3 = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const unified_1 = require("@dendronhq/unified");
const lodash_1 = __importDefault(require("lodash"));
const vscode = __importStar(require("vscode"));
const vscode_1 = require("vscode");
const vscode_uri_1 = require("vscode-uri");
const clientUtils_1 = require("../../clientUtils");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const logger_1 = require("../../logger");
const utils_1 = require("../../utils");
const md_1 = require("../../utils/md");
const versionProvider_1 = require("../../versionProvider");
const LookupPanelView_1 = require("../../views/LookupPanelView");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const LookupV3QuickPickView_1 = require("../views/LookupV3QuickPickView");
const NotePickerUtils_1 = require("./NotePickerUtils");
const types_1 = require("./types");
const utils_2 = require("./utils");
/**
 * For initialization lifecycle,
 * see [[dendron://dendron.docs/pkg.plugin-core.t.lookup.arch]]
 */
class LookupControllerV3 {
    nodeType;
    _cancelTokenSource;
    _quickPick;
    fuzzThreshold;
    _provider;
    _title;
    _viewModel;
    _initButtons;
    _disposables = [];
    constructor(opts) {
        const ctx = "LookupControllerV3:new";
        logger_1.Logger.info({ ctx, msg: "enter" });
        const { buttons, nodeType } = opts;
        this.nodeType = nodeType;
        this._initButtons = buttons;
        this.fuzzThreshold = opts.fuzzThreshold || 0.6;
        this._cancelTokenSource = vsCodeUtils_1.VSCodeUtils.createCancelSource();
        this._title = opts.title;
        this._viewModel = opts.viewModel;
        if (opts.enableLookupView) {
            this._disposables.push(new LookupPanelView_1.LookupPanelView(this._viewModel));
        }
    }
    isJournalButtonPressed() {
        return (this._viewModel.nameModifierMode.value === common_all_1.LookupNoteTypeEnum.journal);
    }
    async show(opts) {
        const { quickpick } = await this.prepareQuickPick(opts);
        return this.showQuickPick({ ...opts, quickpick });
    }
    get quickPick() {
        if (lodash_1.default.isUndefined(this._quickPick)) {
            throw common_all_1.DendronError.createFromStatus({
                status: common_all_1.ERROR_STATUS.INVALID_STATE,
                message: "quickpick not initialized",
            });
        }
        return this._quickPick;
    }
    get cancelToken() {
        if (lodash_1.default.isUndefined(this._cancelTokenSource)) {
            throw new common_all_1.DendronError({ message: "no cancel token" });
        }
        return this._cancelTokenSource;
    }
    get provider() {
        if (lodash_1.default.isUndefined(this._provider)) {
            throw new common_all_1.DendronError({ message: "no provider" });
        }
        return this._provider;
    }
    createCancelSource() {
        const tokenSource = new vscode_1.CancellationTokenSource();
        if (this._cancelTokenSource) {
            this._cancelTokenSource.cancel();
            this._cancelTokenSource.dispose();
        }
        this._cancelTokenSource = tokenSource;
        return tokenSource;
    }
    /**
     * Wire up quickpick and initialize buttons
     */
    async prepareQuickPick(opts) {
        const ctx = "prepareQuickPick";
        logger_1.Logger.info({ ctx, msg: "enter" });
        const { provider, title, selectAll } = lodash_1.default.defaults(opts, {
            nonInteractive: false,
            title: this._title ||
                [
                    `Lookup (${this.nodeType})`,
                    `- version: ${versionProvider_1.VersionProvider.version()}`,
                ].join(" "),
            selectAll: false,
        });
        this._provider = provider;
        const quickpick = utils_2.PickerUtilsV2.createDendronQuickPick(opts);
        this._quickPick = quickpick;
        // invoke button behaviors
        this._quickPick.buttons = this._initButtons;
        this.setupViewModelCallbacks();
        // Now Create the Views:
        this._disposables.push(
        // TODO: Maybe cache the view to prevent flicker / improve load time.
        new LookupV3QuickPickView_1.LookupV3QuickPickView(quickpick, this._viewModel, this._provider.id));
        // Set the initial View Model State from the initial Button state:
        this.initializeViewStateFromButtons(this._initButtons);
        quickpick.onDidHide(() => {
            if (opts.onDidHide) {
                opts.onDidHide();
            }
            logger_1.Logger.debug({ ctx: "quickpick", msg: "onHide" });
            engine_server_1.HistoryService.instance().add({
                source: "lookupProvider",
                action: "changeState",
                id: provider.id,
                data: { action: "hide" },
            });
        });
        quickpick.title = title;
        quickpick.selectAll = quickpick.canSelectMany && selectAll;
        logger_1.Logger.info({ ctx, msg: "exit" });
        return { quickpick };
    }
    async showQuickPick(opts) {
        const ctx = "showQuickPick";
        logger_1.Logger.info({ ctx, msg: "enter" });
        const cancelToken = this.createCancelSource();
        const { nonInteractive, provider, quickpick } = lodash_1.default.defaults(opts, {
            nonInteractive: false,
        });
        logger_1.Logger.info({ ctx, msg: "onUpdatePickerItems:pre" });
        // initial call of update
        if (!nonInteractive) {
            // Show the quickpick first before getting item data to ensure we don't
            // miss user key strokes. Furthermore, set a small delay prior to updating
            // the picker items, which is an expensive call. The VSCode API
            // QuickPick.show() seems to be a non-awaitable async operation, which
            // sometimes will get 'stuck' behind provider.onUpdatePickerItems in the
            // execution queue. Adding a small delay appears to fix the ordering
            // issue.
            quickpick.show();
            setTimeout(() => {
                provider.onUpdatePickerItems({
                    picker: quickpick,
                    token: cancelToken.token,
                    fuzzThreshold: this.fuzzThreshold,
                });
                provider.provide({
                    quickpick,
                    token: cancelToken,
                    fuzzThreshold: this.fuzzThreshold,
                });
            }, 10);
        }
        else {
            await provider.onUpdatePickerItems({
                picker: quickpick,
                token: cancelToken.token,
                fuzzThreshold: this.fuzzThreshold,
            });
            quickpick.selectedItems = quickpick.items;
            await provider.onDidAccept({
                quickpick,
                cancellationToken: cancelToken,
            })();
        }
        logger_1.Logger.info({ ctx, msg: "exit" });
        return quickpick;
    }
    onHide() {
        const ctx = "LookupControllerV3:onHide";
        this._quickPick?.dispose();
        this._quickPick = undefined;
        this._cancelTokenSource?.dispose();
        this._disposables.forEach((disposable) => disposable.dispose());
        logger_1.Logger.info({ ctx, msg: "exit" });
    }
    getButtonFromArray(type, buttons) {
        return lodash_1.default.find(buttons, (value) => value.type === type);
    }
    getButton(type) {
        if (this._quickPick) {
            return this.getButtonFromArray(type, this._quickPick?.buttons);
        }
        return;
    }
    setupViewModelCallbacks() {
        const ToLinkBtn = this.getButton("selection2link");
        const ExtractBtn = this.getButton("selectionExtract");
        const ToItemsBtn = this.getButton("selection2Items");
        if (ToLinkBtn || ExtractBtn || ToItemsBtn) {
            this._disposables.push(this._viewModel.selectionState.bind(async (newValue, prevValue) => {
                switch (prevValue) {
                    case common_all_1.LookupSelectionTypeEnum.selection2Items: {
                        await this.onSelect2ItemsBtnToggled(false);
                        break;
                    }
                    case common_all_1.LookupSelectionTypeEnum.selection2link: {
                        this.onSelection2LinkBtnToggled(false);
                        break;
                    }
                    case common_all_1.LookupSelectionTypeEnum.selectionExtract: {
                        this.onSelectionExtractBtnToggled(false);
                        break;
                    }
                    default:
                        break;
                }
                switch (newValue) {
                    case common_all_1.LookupSelectionTypeEnum.selection2Items: {
                        await this.onSelect2ItemsBtnToggled(true);
                        break;
                    }
                    case common_all_1.LookupSelectionTypeEnum.selection2link: {
                        this.onSelection2LinkBtnToggled(true);
                        break;
                    }
                    case common_all_1.LookupSelectionTypeEnum.selectionExtract: {
                        this.onSelectionExtractBtnToggled(true);
                        break;
                    }
                    case common_all_1.LookupSelectionTypeEnum.none: {
                        break;
                    }
                    default:
                        (0, common_all_1.assertUnreachable)(newValue);
                }
            }));
        }
        const vaultSelectionBtn = this.getButton("selectVault");
        if (vaultSelectionBtn) {
            this._disposables.push(this._viewModel.vaultSelectionMode.bind(async (newValue) => {
                this.setNextPicker({ quickPick: this.quickPick, mode: newValue });
            }));
        }
        const multiSelectBtn = this.getButton("multiSelect");
        if (multiSelectBtn) {
            this._disposables.push(this._viewModel.isMultiSelectEnabled.bind(async (newValue) => {
                this.quickPick.canSelectMany = newValue;
            }));
        }
        const copyLinkBtn = this.getButton("copyNoteLink");
        if (copyLinkBtn) {
            this._disposables.push(this._viewModel.isCopyNoteLinkEnabled.bind(async (enabled) => {
                this.onCopyNoteLinkBtnToggled(enabled);
            }));
        }
        const directChildBtn = this.getButton("directChildOnly");
        if (directChildBtn) {
            this._disposables.push(this._viewModel.isApplyDirectChildFilter.bind(async (newValue) => {
                this.quickPick.showDirectChildrenOnly = newValue;
                if (newValue) {
                    this.quickPick.filterMiddleware = (items) => items;
                }
                else {
                    this.quickPick.filterMiddleware = undefined;
                }
                await this.provider.onUpdatePickerItems({
                    picker: this.quickPick,
                    token: this.cancelToken.token,
                    forceUpdate: true,
                });
            }));
        }
        const journalBtn = this.getButton(common_all_1.LookupNoteTypeEnum.journal);
        const scratchBtn = this.getButton(common_all_1.LookupNoteTypeEnum.scratch);
        const taskBtn = this.getButton(common_all_1.LookupNoteTypeEnum.task);
        if (journalBtn || scratchBtn || taskBtn) {
            this._disposables.push(this._viewModel.nameModifierMode.bind(async (newValue, prevValue) => {
                switch (prevValue) {
                    case common_all_1.LookupNoteTypeEnum.journal:
                        if (journalBtn)
                            this.onJournalButtonToggled(false);
                        break;
                    case common_all_1.LookupNoteTypeEnum.scratch:
                        if (scratchBtn)
                            this.onScratchButtonToggled(false);
                        break;
                    case common_all_1.LookupNoteTypeEnum.task:
                        if (taskBtn)
                            this.onTaskButtonToggled(false);
                        break;
                    default:
                        break;
                }
                switch (newValue) {
                    case common_all_1.LookupNoteTypeEnum.journal:
                        if (journalBtn)
                            this.onJournalButtonToggled(true);
                        break;
                    case common_all_1.LookupNoteTypeEnum.scratch:
                        if (scratchBtn)
                            this.onScratchButtonToggled(true);
                        break;
                    case common_all_1.LookupNoteTypeEnum.task:
                        if (taskBtn)
                            this.onTaskButtonToggled(true);
                        break;
                    case common_all_1.LookupNoteTypeEnum.none:
                        break;
                    default:
                        (0, common_all_1.assertUnreachable)(newValue);
                }
            }));
        }
        const horizontalBtn = this.getButton("horizontal");
        if (horizontalBtn) {
            this._disposables.push(this._viewModel.isSplitHorizontally.bind(async (splitHorizontally) => {
                if (splitHorizontally) {
                    this.quickPick.showNote = async (uri) => vscode.window.showTextDocument(uri, {
                        viewColumn: vscode.ViewColumn.Beside,
                    });
                }
                else {
                    this.quickPick.showNote = async (uri) => vscode.window.showTextDocument(uri);
                }
            }));
        }
    }
    /**
     *  Adjust View State based on what the initial button state is
     * @param buttons
     */
    initializeViewStateFromButtons(buttons) {
        if (this.getButtonFromArray(common_all_1.LookupSelectionTypeEnum.selection2Items, buttons)
            ?.pressed) {
            this._viewModel.selectionState.value =
                common_all_1.LookupSelectionTypeEnum.selection2Items;
        }
        else if (this.getButtonFromArray(common_all_1.LookupSelectionTypeEnum.selection2link, buttons)
            ?.pressed) {
            this._viewModel.selectionState.value =
                common_all_1.LookupSelectionTypeEnum.selection2link;
        }
        else if (this.getButtonFromArray(common_all_1.LookupSelectionTypeEnum.selectionExtract, buttons)
            ?.pressed) {
            this._viewModel.selectionState.value =
                common_all_1.LookupSelectionTypeEnum.selectionExtract;
        }
        if (this.getButtonFromArray(common_all_1.LookupNoteTypeEnum.scratch, buttons)?.pressed) {
            this._viewModel.nameModifierMode.value = common_all_1.LookupNoteTypeEnum.scratch;
        }
        else if (this.getButtonFromArray(common_all_1.LookupNoteTypeEnum.journal, buttons)?.pressed) {
            this._viewModel.nameModifierMode.value = common_all_1.LookupNoteTypeEnum.journal;
        }
        else if (this.getButtonFromArray(common_all_1.LookupNoteTypeEnum.task, buttons)?.pressed) {
            this._viewModel.nameModifierMode.value = common_all_1.LookupNoteTypeEnum.task;
        }
        this._viewModel.vaultSelectionMode.value = this.getButtonFromArray("selectVault", buttons)?.pressed
            ? types_1.VaultSelectionMode.alwaysPrompt
            : types_1.VaultSelectionMode.smart;
        this._viewModel.isMultiSelectEnabled.value = !!this.getButtonFromArray("multiSelect", buttons)?.pressed;
        this._viewModel.isCopyNoteLinkEnabled.value = !!this.getButtonFromArray("copyNoteLink", buttons)?.pressed;
        this._viewModel.isApplyDirectChildFilter.value = !!this.getButtonFromArray("directChildOnly", buttons)?.pressed;
        this._viewModel.isSplitHorizontally.value = !!this.getButtonFromArray("horizontal", buttons)?.pressed;
    }
    setNextPicker({ quickPick, mode, }) {
        quickPick.nextPicker = async (opts) => {
            const { note } = opts;
            const currentVault = utils_2.PickerUtilsV2.getVaultForOpenEditor();
            const vaultSelection = await utils_2.PickerUtilsV2.getOrPromptVaultForNewNote({
                vault: currentVault,
                fname: note.fname,
                vaultSelectionMode: mode,
            });
            if (lodash_1.default.isUndefined(vaultSelection)) {
                vscode.window.showInformationMessage("Note creation cancelled.");
                return;
            }
            return vaultSelection;
        };
    }
    onJournalButtonToggled(enabled) {
        const quickPick = this._quickPick;
        if (enabled) {
            quickPick.modifyPickerValueFunc = () => {
                try {
                    return clientUtils_1.DendronClientUtilsV2.genNoteName(common_all_1.LookupNoteTypeEnum.journal);
                }
                catch (error) {
                    return { noteName: "", prefix: "" };
                }
            };
            const { noteName, prefix } = quickPick.modifyPickerValueFunc();
            quickPick.noteModifierValue = lodash_1.default.difference(noteName.split("."), prefix.split(".")).join(".");
            quickPick.prevValue = quickPick.value;
            quickPick.prefix = prefix;
            quickPick.value = NotePickerUtils_1.NotePickerUtils.getPickerValue(quickPick);
            return;
        }
        else {
            quickPick.modifyPickerValueFunc = undefined;
            quickPick.noteModifierValue = undefined;
            quickPick.prevValue = quickPick.value;
            quickPick.prefix = quickPick.rawValue;
            quickPick.value = NotePickerUtils_1.NotePickerUtils.getPickerValue(quickPick);
        }
    }
    onScratchButtonToggled(enabled) {
        const quickPick = this._quickPick;
        if (enabled) {
            quickPick.modifyPickerValueFunc = () => {
                try {
                    return clientUtils_1.DendronClientUtilsV2.genNoteName(common_all_1.LookupNoteTypeEnum.scratch);
                }
                catch (error) {
                    return { noteName: "", prefix: "" };
                }
            };
            quickPick.prevValue = quickPick.value;
            const { noteName, prefix } = quickPick.modifyPickerValueFunc();
            quickPick.noteModifierValue = lodash_1.default.difference(noteName.split("."), prefix.split(".")).join(".");
            quickPick.prefix = prefix;
            quickPick.value = NotePickerUtils_1.NotePickerUtils.getPickerValue(quickPick);
        }
        else {
            quickPick.modifyPickerValueFunc = undefined;
            quickPick.noteModifierValue = undefined;
            quickPick.prevValue = quickPick.value;
            quickPick.prefix = quickPick.rawValue;
            quickPick.value = NotePickerUtils_1.NotePickerUtils.getPickerValue(quickPick);
        }
    }
    async onTaskButtonToggled(enabled) {
        const quickPick = this._quickPick;
        if (enabled) {
            quickPick.modifyPickerValueFunc = () => {
                try {
                    return clientUtils_1.DendronClientUtilsV2.genNoteName(common_all_1.LookupNoteTypeEnum.task);
                }
                catch (error) {
                    return { noteName: "", prefix: "" };
                }
            };
            quickPick.prevValue = quickPick.value;
            const { noteName, prefix } = quickPick.modifyPickerValueFunc();
            quickPick.noteModifierValue = lodash_1.default.difference(noteName.split("."), prefix.split(".")).join(".");
            quickPick.prefix = prefix;
            quickPick.value = NotePickerUtils_1.NotePickerUtils.getPickerValue(quickPick);
            // If the lookup value ends up being identical to the current note, this will be confusing for the user because
            // they won't be able to create a new note. This can happen with the default settings of Task notes.
            // In that case, we add a trailing dot to suggest that they need to type something more.
            const activeName = (await ExtensionProvider_1.ExtensionProvider.getWSUtils().getActiveNote())
                ?.fname;
            if (quickPick.value === activeName)
                quickPick.value = `${quickPick.value}.`;
            // Add default task note props to the created note
            quickPick.onCreate = async (note) => {
                note.custom = {
                    ...common_all_1.TaskNoteUtils.genDefaultTaskNoteProps(note, common_all_1.ConfigUtils.getTask(ExtensionProvider_1.ExtensionProvider.getDWorkspace().config)).custom,
                    ...note.custom,
                };
                return note;
            };
            return;
        }
        else {
            quickPick.modifyPickerValueFunc = undefined;
            quickPick.noteModifierValue = undefined;
            quickPick.onCreate = undefined;
            quickPick.prevValue = quickPick.value;
            quickPick.prefix = quickPick.rawValue;
            quickPick.value = NotePickerUtils_1.NotePickerUtils.getPickerValue(quickPick);
        }
    }
    async onSelect2ItemsBtnToggled(enabled) {
        const quickPick = this._quickPick;
        if (enabled) {
            const pickerItemsFromSelection = await NotePickerUtils_1.NotePickerUtils.createItemsFromSelectedWikilinks();
            quickPick.prevValue = quickPick.value;
            quickPick.value = "";
            quickPick.itemsFromSelection = pickerItemsFromSelection;
        }
        else {
            quickPick.value = NotePickerUtils_1.NotePickerUtils.getPickerValue(quickPick);
            quickPick.itemsFromSelection = undefined;
            return;
        }
    }
    onCopyNoteLinkBtnToggled(enabled) {
        const quickPick = this._quickPick;
        if (enabled) {
            quickPick.copyNoteLinkFunc = async (items) => {
                const links = items.map((note) => common_all_1.NoteUtils.createWikiLink({ note, alias: { mode: "title" } }));
                if (lodash_1.default.isEmpty(links)) {
                    vscode.window.showInformationMessage(`no items selected`);
                }
                else {
                    await utils_1.clipboard.writeText(links.join("\n"));
                    vscode.window.showInformationMessage(`${links.length} links copied`);
                }
            };
        }
        else {
            quickPick.copyNoteLinkFunc = undefined;
        }
    }
    onSelectionExtractBtnToggled(enabled) {
        const quickPick = this._quickPick;
        if (enabled) {
            quickPick.selectionProcessFunc = (note) => {
                return this.selectionToNoteProps({
                    selectionType: "selectionExtract",
                    note,
                });
            };
            Object.defineProperty(quickPick.selectionProcessFunc, "name", {
                value: "selectionExtract",
                writable: false,
            });
        }
        else {
            quickPick.selectionProcessFunc = undefined;
        }
    }
    onSelection2LinkBtnToggled(enabled) {
        const quickPick = this._quickPick;
        if (enabled) {
            quickPick.selectionProcessFunc = (note) => {
                return this.selectionToNoteProps({
                    selectionType: "selection2link",
                    note,
                });
            };
            Object.defineProperty(quickPick.selectionProcessFunc, "name", {
                value: "selection2link",
                writable: false,
            });
            quickPick.prevValue = quickPick.value;
            const { text } = vsCodeUtils_1.VSCodeUtils.getSelection();
            const slugger = (0, common_all_1.getSlugger)();
            quickPick.selectionModifierValue = slugger.slug(text);
            if (quickPick.noteModifierValue || quickPick.prefix) {
                quickPick.value = NotePickerUtils_1.NotePickerUtils.getPickerValue(quickPick);
            }
            else {
                quickPick.value = [
                    quickPick.rawValue,
                    NotePickerUtils_1.NotePickerUtils.getPickerValue(quickPick),
                ].join(".");
            }
            return;
        }
        else {
            quickPick.selectionProcessFunc = undefined;
            quickPick.selectionModifierValue = undefined;
            quickPick.value = NotePickerUtils_1.NotePickerUtils.getPickerValue(quickPick);
            return;
        }
    }
    /**
     * Helper for {@link LookupControllerV3.selectionToNoteProps}
     * given a selection, find backlinks that point to
     * any anchors in the selection and update them to point to the
     * given destination note instead
     */
    async updateBacklinksToAnchorsInSelection(opts) {
        const { selection, destNote, config } = opts;
        if (selection === undefined) {
            return [];
        }
        const wsUtils = ExtensionProvider_1.ExtensionProvider.getWSUtils();
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        // parse text in range, update potential backlinks to it
        // so that it points to the destination instead of the source.
        const sourceNote = await wsUtils.getActiveNote();
        if (sourceNote) {
            const { anchors: sourceAnchors } = sourceNote;
            if (sourceAnchors) {
                // find all anchors in source note that is part of the selection
                const anchorsInSelection = lodash_1.default.toArray(sourceAnchors)
                    .filter((anchor) => {
                    // help ts a little to infer the type correctly
                    return anchor !== undefined;
                })
                    .filter((anchor) => {
                    const anchorPosition = new vscode.Position(anchor.line, anchor.column);
                    return selection?.contains(anchorPosition);
                });
                // find all references to update
                const foundReferences = await (0, md_1.findReferences)(sourceNote.fname);
                const anchorNamesToUpdate = anchorsInSelection.map((anchor) => {
                    return anchor.value;
                });
                const refsToUpdate = foundReferences.filter((ref) => (0, md_1.hasAnchorsToUpdate)(ref, anchorNamesToUpdate));
                let changes = [];
                // update references
                await (0, common_all_1.asyncLoop)(refsToUpdate, async (ref) => {
                    const { location } = ref;
                    const fsPath = location.uri;
                    const fname = common_all_1.NoteUtils.normalizeFname(vscode_uri_1.Utils.basename(fsPath));
                    const vault = wsUtils.getVaultFromUri(location.uri);
                    const noteToUpdate = (await engine.findNotes({
                        fname,
                        vault,
                    }))[0];
                    if (noteToUpdate) {
                        const linksToUpdate = unified_1.LinkUtils.findLinksFromBody({
                            note: noteToUpdate,
                            config,
                        })
                            .filter((link) => {
                            const fnameMatch = link.to?.fname?.toLocaleLowerCase() ===
                                sourceNote.fname.toLowerCase();
                            if (!fnameMatch)
                                return false;
                            if (!link.to?.anchorHeader)
                                return false;
                            const anchorHeader = link.to.anchorHeader.startsWith("^")
                                ? link.to.anchorHeader.substring(1)
                                : link.to.anchorHeader;
                            return anchorNamesToUpdate.includes(anchorHeader);
                        })
                            .map((link) => unified_1.LinkUtils.dlink2DNoteLink(link));
                        const resp = await unified_1.LinkUtils.updateLinksInNote({
                            linksToUpdate,
                            note: noteToUpdate,
                            destNote,
                            engine,
                        });
                        if (resp.data) {
                            changes = changes.concat(resp.data);
                        }
                    }
                });
                return changes;
            }
        }
        return [];
    }
    async selectionToNoteProps(opts) {
        const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
        const ws = ext.getDWorkspace();
        const extractRangeResp = await vsCodeUtils_1.VSCodeUtils.extractRangeFromActiveEditor();
        const { document, range } = extractRangeResp || {};
        const { selectionType, note } = opts;
        const { selection, text } = vsCodeUtils_1.VSCodeUtils.getSelection();
        switch (selectionType) {
            case "selectionExtract": {
                if (!lodash_1.default.isUndefined(document)) {
                    const lookupConfig = common_all_1.ConfigUtils.getCommands(ws.config).lookup;
                    const noteLookupConfig = lookupConfig.note;
                    const leaveTrace = noteLookupConfig.leaveTrace || false;
                    // find anchors in selection and update backlinks to them
                    await this.updateBacklinksToAnchorsInSelection({
                        selection,
                        destNote: note,
                        config: ws.config,
                    });
                    const body = note.body + "\n\n" + document.getText(range).trim();
                    note.body = body;
                    const { wsRoot, vaults } = ext.getDWorkspace();
                    // don't delete if original file is not in workspace
                    if (!engine_server_1.WorkspaceUtils.isPathInWorkspace({
                        wsRoot,
                        vaults,
                        fpath: document.uri.fsPath,
                    })) {
                        return note;
                    }
                    if (leaveTrace) {
                        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                        const link = common_all_1.NoteUtils.createWikiLink({
                            note,
                            useVaultPrefix: clientUtils_1.DendronClientUtilsV2.shouldUseVaultPrefix(ExtensionProvider_1.ExtensionProvider.getEngine()),
                            alias: { mode: "title" },
                        });
                        // TODO: editor.edit API is prone to race conditions in our case
                        // because we also change files directly through the engine.
                        // remove the use of `editor.edit` and switch to processing the text
                        // and doing an `engine.writeNote()` call instead.
                        await editor?.edit((builder) => {
                            if (!lodash_1.default.isUndefined(selection) && !selection.isEmpty) {
                                builder.replace(selection, `!${link}`);
                            }
                        });
                    }
                    else {
                        const activeNote = await ext.wsUtils.getNoteFromDocument(document);
                        if (activeNote && range) {
                            const activeNoteBody = activeNote?.body;
                            const fmOffset = (0, md_1.getOneIndexedFrontmatterEndingLineNumber)(document.getText()) ||
                                1;
                            const vsRange = {
                                start: {
                                    line: range.start.line - fmOffset,
                                    character: range.start.character,
                                },
                                end: {
                                    line: range.end.line - fmOffset,
                                    character: range.end.character,
                                },
                            };
                            const processed = (0, common_all_1.deleteTextRange)(activeNoteBody, vsRange);
                            activeNote.body = processed;
                            await ext.getEngine().writeNote(activeNote);
                        }
                    }
                }
                return note;
            }
            case "selection2link": {
                if (!lodash_1.default.isUndefined(document)) {
                    const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
                    if (editor) {
                        await editor.edit((builder) => {
                            const link = note.fname;
                            if (!lodash_1.default.isUndefined(selection) && !selection.isEmpty) {
                                builder.replace(selection, `[[${text?.replace(/\n/g, "")}|${link}]]`);
                            }
                        });
                    }
                }
                return note;
            }
            default: {
                return note;
            }
        }
    }
    // eslint-disable-next-line camelcase
    __DO_NOT_USE_IN_PROD_exposePropsForTesting() {
        return {
            onSelect2ItemsBtnToggled: this.onSelect2ItemsBtnToggled.bind(this),
        };
    }
}
exports.LookupControllerV3 = LookupControllerV3;
//# sourceMappingURL=LookupControllerV3.js.map