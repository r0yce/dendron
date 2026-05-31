"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteLookupCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const buttons_1 = require("../components/lookup/buttons");
const ButtonTypes_1 = require("../components/lookup/ButtonTypes");
const constants_1 = require("../components/lookup/constants");
const NotePickerUtils_1 = require("../components/lookup/NotePickerUtils");
const QuickPickTemplateSelector_1 = require("../components/lookup/QuickPickTemplateSelector");
const types_1 = require("../components/lookup/types");
const utils_1 = require("../components/lookup/utils");
const vaultSelectionModeConfigUtils_1 = require("../components/lookup/vaultSelectionModeConfigUtils");
const constants_2 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const dev_1 = require("../utils/dev");
const journal_1 = require("../traits/journal");
const analytics_1 = require("../utils/analytics");
const autoCompleter_1 = require("../utils/autoCompleter");
const AutoCompletableRegistrar_1 = require("../utils/registers/AutoCompletableRegistrar");
const vsCodeUtils_1 = require("../vsCodeUtils");
const WSUtilsV2_1 = require("../WSUtilsV2");
const base_1 = require("./base");
/**
 * Note look up command instance that is used by the UI.
 * */
class NoteLookupCommand extends base_1.BaseCommand {
    key = constants_2.DENDRON_COMMANDS.LOOKUP_NOTE.key;
    _controller;
    _provider;
    _quickPick;
    constructor() {
        super("LookupCommandV3");
        //  ^1h1dr08geo6c
        AutoCompletableRegistrar_1.AutoCompletableRegistrar.OnAutoComplete(() => {
            if (this._quickPick) {
                this._quickPick.value = autoCompleter_1.AutoCompleter.getAutoCompletedValue(this._quickPick);
                this.provider.onUpdatePickerItems({
                    picker: this._quickPick,
                });
            }
        });
    }
    get controller() {
        if (lodash_1.default.isUndefined(this._controller)) {
            throw common_all_1.DendronError.createFromStatus({
                status: common_all_1.ERROR_STATUS.INVALID_STATE,
                message: "controller not set",
            });
        }
        return this._controller;
    }
    set controller(controller) {
        this._controller = controller;
    }
    get provider() {
        if (lodash_1.default.isUndefined(this._provider)) {
            throw common_all_1.DendronError.createFromStatus({
                status: common_all_1.ERROR_STATUS.INVALID_STATE,
                message: "provider not set",
            });
        }
        return this._provider;
    }
    /**
     * @deprecated
     *
     * This is not a good pattern and causes a lot of problems with state.
     * This will be deprecated so that we never have to swap out the provider
     * of an already existing instance of a lookup command.
     *
     * In the meantime, if you absolutely _have_ to provide a custom provider to an instance of
     * a lookup command, make sure the provider's id is `lookup`.
     */
    set provider(provider) {
        this._provider = provider;
    }
    async gatherInputs(opts) {
        const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
        const start = process.hrtime();
        const ws = extension.getDWorkspace();
        const lookupConfig = common_all_1.ConfigUtils.getCommands(ws.config).lookup;
        const noteLookupConfig = lookupConfig.note;
        let selectionType;
        switch (noteLookupConfig.selectionMode) {
            case "link": {
                selectionType = "selection2link";
                break;
            }
            case "none": {
                selectionType = "none";
                break;
            }
            case "extract":
            default: {
                selectionType = "selectionExtract";
                break;
            }
        }
        const confirmVaultOnCreate = noteLookupConfig.confirmVaultOnCreate;
        const copts = lodash_1.default.defaults(opts || {}, {
            multiSelect: false,
            filterMiddleware: [],
            initialValue: NotePickerUtils_1.NotePickerUtils.getInitialValueFromOpenEditor(),
            selectionType,
        });
        let vaultButtonPressed;
        if (copts.vaultSelectionMode) {
            vaultButtonPressed =
                copts.vaultSelectionMode === types_1.VaultSelectionMode.alwaysPrompt;
        }
        else {
            vaultButtonPressed =
                vaultSelectionModeConfigUtils_1.VaultSelectionModeConfigUtils.shouldAlwaysPromptVaultSelection();
        }
        const ctx = "NoteLookupCommand:gatherInput";
        logger_1.Logger.info({ ctx, opts, msg: "enter" });
        // initialize controller and provider
        const disableVaultSelection = !confirmVaultOnCreate;
        if (lodash_1.default.isUndefined(this._controller)) {
            this._controller = extension.lookupControllerFactory.create({
                nodeType: "note",
                disableVaultSelection,
                vaultButtonPressed,
                extraButtons: [
                    buttons_1.MultiSelectBtn.create({ pressed: copts.multiSelect }),
                    buttons_1.CopyNoteLinkBtn.create(copts.copyNoteLink),
                    buttons_1.DirectChildFilterBtn.create(copts.filterMiddleware?.includes("directChildOnly")),
                    buttons_1.SelectionExtractBtn.create({
                        pressed: copts.selectionType === common_all_1.LookupSelectionTypeEnum.selectionExtract,
                    }),
                    buttons_1.Selection2LinkBtn.create(copts.selectionType === common_all_1.LookupSelectionTypeEnum.selection2link),
                    buttons_1.Selection2ItemsBtn.create({
                        pressed: copts.selectionType === common_all_1.LookupSelectionTypeEnum.selection2Items,
                    }),
                    buttons_1.JournalBtn.create({
                        pressed: copts.noteType === common_all_1.LookupNoteTypeEnum.journal,
                    }),
                    buttons_1.ScratchBtn.create({
                        pressed: copts.noteType === common_all_1.LookupNoteTypeEnum.scratch,
                    }),
                    buttons_1.TaskBtn.create(copts.noteType === common_all_1.LookupNoteTypeEnum.task),
                    buttons_1.HorizontalSplitBtn.create(copts.splitType === ButtonTypes_1.LookupSplitTypeEnum.horizontal),
                ],
                enableLookupView: true,
            });
        }
        if (this._provider === undefined) {
            // hack. we need to do this because
            // moveSelectionTo sets a custom provider instead of the
            // one that lookup creates.
            // TODO: fix moveSelectionTo so that it doesn't rely on this.
            this._provider = extension.noteLookupProviderFactory.create("lookup", {
                allowNewNote: true,
                allowNewNoteWithTemplate: true,
                noHidePickerOnAccept: false,
                forceAsIsPickerValueUsage: copts.noteType === common_all_1.LookupNoteTypeEnum.scratch,
            });
        }
        const lc = this.controller;
        if (copts.fuzzThreshold) {
            lc.fuzzThreshold = copts.fuzzThreshold;
        }
        vsCodeUtils_1.VSCodeUtils.setContext(constants_2.DendronContext.NOTE_LOOK_UP_ACTIVE, true);
        const { quickpick } = await lc.prepareQuickPick({
            placeholder: "a seed",
            provider: this.provider,
            initialValue: copts.initialValue,
            nonInteractive: copts.noConfirm,
            alwaysShow: true,
        });
        this._quickPick = quickpick;
        const profile = (0, common_server_1.getDurationMilliseconds)(start);
        analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.NoteLookup_Gather, {
            duration: profile,
        });
        return {
            controller: this.controller,
            provider: this.provider,
            quickpick,
            noConfirm: copts.noConfirm,
            fuzzThreshold: copts.fuzzThreshold,
        };
    }
    async enrichInputs(opts) {
        const ctx = "NoteLookupCommand:enrichInputs";
        let promiseResolve;
        engine_server_1.HistoryService.instance().subscribev2("lookupProvider", {
            id: "lookup",
            listener: async (event) => {
                if (event.action === "done") {
                    const data = event.data;
                    if (data.cancel) {
                        this.cleanUp();
                        promiseResolve(undefined);
                    }
                    const _opts = {
                        selectedItems: data.selectedItems,
                        ...opts,
                    };
                    promiseResolve(_opts);
                }
                else if (event.action === "changeState") {
                    const data = event.data;
                    // check if we hid the picker and there is no next picker
                    if (data.action === "hide") {
                        const { quickpick } = opts;
                        logger_1.Logger.debug({
                            ctx,
                            subscribers: engine_server_1.HistoryService.instance().subscribersv2,
                        });
                        // check if user has hidden picker
                        if (!lodash_1.default.includes([
                            types_1.DendronQuickPickState.PENDING_NEXT_PICK,
                            types_1.DendronQuickPickState.FULFILLED,
                        ], quickpick.state)) {
                            this.cleanUp();
                            promiseResolve(undefined);
                        }
                    }
                    // don't remove the lookup provider
                    return;
                }
                else if (event.action === "error") {
                    const error = event.data.error;
                    this.L.error({ error });
                    this.cleanUp();
                    promiseResolve(undefined);
                }
                else {
                    const error = common_all_1.ErrorFactory.createUnexpectedEventError({ event });
                    this.L.error({ error });
                    this.cleanUp();
                }
            },
        });
        const promise = new Promise((resolve) => {
            promiseResolve = resolve;
            opts.controller.showQuickPick({
                provider: opts.provider,
                quickpick: opts.quickpick,
                nonInteractive: opts.noConfirm,
                fuzzThreshold: opts.fuzzThreshold,
            });
        });
        return promise;
    }
    getSelected({ quickpick, selectedItems, }) {
        const { canSelectMany } = quickpick;
        return canSelectMany ? selectedItems : selectedItems.slice(0, 1);
    }
    /**
     * Executed after user accepts a quickpick item
     */
    async execute(opts) {
        const ctx = "NoteLookupCommand:execute";
        logger_1.Logger.info({ ctx, msg: "enter" });
        const perf = new common_all_1.PerformanceTimer({ timerName: "NoteLookup" });
        perf.before("total");
        try {
            const { quickpick, selectedItems } = opts;
            const selected = this.getSelected({ quickpick, selectedItems });
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            const ws = extension.getDWorkspace();
            const journalDateFormat = common_all_1.ConfigUtils.getJournal(ws.config).dateFormat;
            const out = await Promise.all(selected.map((item) => {
                // If we're in journal mode, then apply title and trait overrides
                if (this.isJournalButtonPressed()) {
                    /**
                     * this is a hacky title override for journal notes.
                     * TODO: remove this once we implement a more general way to override note titles.
                     * this is a hacky title override for journal notes.
                     */
                    const journalModifiedTitle = (0, common_all_1.getJournalTitle)(item.fname, journalDateFormat);
                    if (journalModifiedTitle) {
                        item.title = journalModifiedTitle;
                        const journalTrait = new journal_1.JournalNote(ExtensionProvider_1.ExtensionProvider.getDWorkspace().config);
                        if (item.traits) {
                            item.traits.push(journalTrait.id);
                        }
                        else {
                            item.traits = [journalTrait.id];
                        }
                    }
                }
                else if (common_all_1.ConfigUtils.getWorkspace(ws.config).enableFullHierarchyNoteTitle) {
                    item.title = common_all_1.NoteUtils.genTitleFromFullFname(item.fname);
                }
                return this.acceptItem(item);
            }));
            const notesToShow = out.filter((ent) => !lodash_1.default.isUndefined(ent));
            if (!lodash_1.default.isUndefined(quickpick.copyNoteLinkFunc)) {
                await quickpick.copyNoteLinkFunc(notesToShow.map((item) => item.node));
            }
            await lodash_1.default.reduce(notesToShow, async (acc, item) => {
                await acc;
                return quickpick.showNote(item.uri);
            }, Promise.resolve({}));
            perf.after("showNotes");
        }
        finally {
            perf.after("total");
            const shouldLogPerf = (0, common_all_1.getStage)() === "dev" || process.env.DENDRON_PERF === "1";
            if (shouldLogPerf) {
                const report = perf.report();
                logger_1.Logger.info({ ctx, msg: "perf-report", report });
                (0, dev_1.logPerfReport)("NoteLookup", report);
            }
            this.cleanUp();
            logger_1.Logger.info({ ctx, msg: "exit" });
        }
        return opts;
    }
    cleanUp() {
        const ctx = "NoteLookupCommand:cleanup";
        logger_1.Logger.debug({ ctx, msg: "enter" });
        if (this._controller) {
            this._controller.onHide();
        }
        this.controller = undefined;
        engine_server_1.HistoryService.instance().remove("lookup", "lookupProvider");
        vsCodeUtils_1.VSCodeUtils.setContext(constants_2.DendronContext.NOTE_LOOK_UP_ACTIVE, false);
    }
    async acceptItem(item) {
        let result;
        const start = process.hrtime();
        const isNew = utils_1.PickerUtilsV2.isCreateNewNotePicked(item);
        const isNewWithTemplate = utils_1.PickerUtilsV2.isCreateNewNoteWithTemplatePicked(item);
        if (isNew) {
            if (isNewWithTemplate) {
                result = this.acceptNewWithTemplateItem(item);
            }
            else {
                result = this.acceptNewItem(item);
            }
        }
        else {
            result = this.acceptExistingItem(item);
        }
        const profile = (0, common_server_1.getDurationMilliseconds)(start);
        analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.NoteLookup_Accept, {
            duration: profile,
            isNew,
            isNewWithTemplate,
        });
        const metaData = engine_server_1.MetadataService.instance().getMeta();
        if (lodash_1.default.isUndefined(metaData.firstLookupTime)) {
            engine_server_1.MetadataService.instance().setFirstLookupTime();
        }
        engine_server_1.MetadataService.instance().setLastLookupTime();
        return result;
    }
    async acceptExistingItem(item) {
        const picker = this.controller.quickPick;
        const uri = (0, utils_1.node2Uri)(item);
        const originalNoteFromItem = utils_1.PickerUtilsV2.noteQuickInputToNote(item);
        const originalNoteDeepCopy = lodash_1.default.cloneDeep(originalNoteFromItem);
        if (picker.selectionProcessFunc !== undefined) {
            const processedNode = await picker.selectionProcessFunc(originalNoteDeepCopy);
            if (processedNode !== undefined) {
                if (!lodash_1.default.isEqual(originalNoteFromItem, processedNode)) {
                    const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
                    await engine.writeNote(processedNode);
                }
                return { uri, node: processedNode };
            }
        }
        return { uri, node: item };
    }
    /**
     * Given a selected note item that is a stub note,
     * Prepare it for accepting as a new item.
     * This removes the `stub` frontmatter
     * and applies schema if there is one that matches
     */
    async prepareStubItem(opts) {
        const { item, engine } = opts;
        const noteFromItem = utils_1.PickerUtilsV2.noteQuickInputToNote(item);
        const preparedNote = await common_all_1.NoteUtils.updateStubWithSchema({
            stubNote: noteFromItem,
            engine,
        });
        return preparedNote;
    }
    async acceptNewItem(item) {
        const ctx = "acceptNewItem";
        const picker = this.controller.quickPick;
        const fname = this.getFNameForNewItem(item);
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        let nodeNew;
        if (item.stub) {
            logger_1.Logger.info({ ctx, msg: "create stub" });
            nodeNew = await this.prepareStubItem({
                item,
                engine,
            });
        }
        else {
            const vault = await this.getVaultForNewNote({ fname, picker });
            if (vault === undefined) {
                // Vault will be undefined when user cancelled vault selection, so we
                // are going to cancel the creation of the note.
                return;
            }
            nodeNew = await common_all_1.NoteUtils.createWithSchema({
                noteOpts: {
                    fname,
                    vault,
                    title: item.title,
                    traits: item.traits,
                },
                engine,
            });
            if (picker.selectionProcessFunc !== undefined) {
                nodeNew = (await picker.selectionProcessFunc(nodeNew));
            }
        }
        const templateAppliedResp = await common_server_1.TemplateUtils.findAndApplyTemplate({
            note: nodeNew,
            engine,
            pickNote: async (choices) => {
                return WSUtilsV2_1.WSUtilsV2.instance().promptForNoteAsync({
                    notes: choices,
                    quickpickTitle: "Select which template to apply or press [ESC] to not apply a template",
                    nonStubOnly: true,
                });
            },
        });
        if (templateAppliedResp.error) {
            vscode_1.window.showWarningMessage(`Warning: Problem with ${nodeNew.fname} schema. ${templateAppliedResp.error.message}`);
        }
        else if (templateAppliedResp.data) {
            analytics_1.AnalyticsUtils.track(common_all_1.EngagementEvents.TemplateApplied, {
                source: this.key,
                ...common_server_1.TemplateUtils.genTrackPayload(nodeNew),
            });
        }
        if (picker.onCreate) {
            const nodeModified = await picker.onCreate(nodeNew);
            if (nodeModified)
                nodeNew = nodeModified;
        }
        const resp = await engine.writeNote(nodeNew);
        if (resp.error) {
            logger_1.Logger.error({ ctx, error: resp.error });
            return;
        }
        const uri = common_all_1.NoteUtils.getURI({
            note: nodeNew,
            wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
        });
        return { uri, node: nodeNew, resp };
    }
    async acceptNewWithTemplateItem(item) {
        const ctx = "acceptNewWithTemplateItem";
        const picker = this.controller.quickPick;
        const fname = this.getFNameForNewItem(item);
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        let nodeNew = item;
        const vault = await this.getVaultForNewNote({ fname, picker });
        if (vault === undefined) {
            return;
        }
        nodeNew = common_all_1.NoteUtils.create({
            fname,
            vault,
            title: item.title,
        });
        const templateNote = await this.getTemplateForNewNote();
        if (templateNote) {
            common_server_1.TemplateUtils.applyTemplate({
                templateNote,
                targetNote: nodeNew,
                engine,
            });
        }
        else {
            // template note is not selected. cancel note creation.
            vscode_1.window.showInformationMessage(`No template selected. Cancelling note creation.`);
            return;
        }
        // only enable selection 2 link
        if (picker.selectionProcessFunc !== undefined &&
            picker.selectionProcessFunc.name === "selection2link") {
            nodeNew = (await picker.selectionProcessFunc(nodeNew));
        }
        const resp = await engine.writeNote(nodeNew);
        if (resp.error) {
            logger_1.Logger.error({ ctx, error: resp.error });
            return;
        }
        const uri = common_all_1.NoteUtils.getURI({
            note: nodeNew,
            wsRoot: engine.wsRoot,
        });
        return { uri, node: nodeNew, resp };
    }
    /**
     * TODO: align note creation file name choosing for follow a single path when accepting new item.
     *
     * Added to quickly fix the journal names not being created properly.
     */
    getFNameForNewItem(item) {
        if (this.isJournalButtonPressed()) {
            return utils_1.PickerUtilsV2.getValue(this.controller.quickPick);
        }
        else {
            return item.fname;
        }
    }
    //  ^8jd6vr4qcsol
    async getVaultForNewNote({ fname, picker, }) {
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        const vaultsWithMatchingFile = new Set((await engine.findNotesMeta({ fname })).map((n) => n.vault.fsPath));
        // Try to get the default vault value.
        let vault = picker.vault
            ? picker.vault
            : utils_1.PickerUtilsV2.getVaultForOpenEditor();
        // If our current context does not have vault or if our current context vault
        // already has a matching file name we want to ask the user for a different vault.
        if (vault === undefined || vaultsWithMatchingFile.has(vault.fsPath)) {
            // Available vaults are vaults that do not have the desired file name.
            const availVaults = engine.vaults.filter((v) => !vaultsWithMatchingFile.has(v.fsPath));
            if (availVaults.length > 1) {
                const promptedVault = await utils_1.PickerUtilsV2.promptVault(availVaults);
                if (promptedVault === undefined) {
                    // User must have cancelled vault selection.
                    vault = undefined;
                }
                else {
                    vault = promptedVault;
                }
            }
            else if (availVaults.length === 1) {
                // There is only a single vault that is available so we dont have to ask the user.
                vault = availVaults[0];
            }
            else {
                // We should never reach this as "Create New" should not be available as option
                // to the user when there are no available vaults.
                throw common_all_1.ErrorFactory.createInvalidStateError({
                    message: common_all_1.ErrorMessages.formatShouldNeverOccurMsg(`No available vaults for file name.`),
                });
            }
        }
        return vault;
    }
    async getTemplateForNewNote() {
        const selector = new QuickPickTemplateSelector_1.QuickPickTemplateSelector();
        const templateNote = await selector.getTemplate({
            logger: this.L,
            providerId: "createNewWithTemplate",
        });
        // this needs to be checked because note lookup provider
        // assumes user selected `create new` when `selectionItems` is empty.
        // without this, hitting enter when the template picker has nothing listed
        // will result in note creation with an empty template applied.
        if (templateNote && templateNote.id === constants_1.CREATE_NEW_LABEL) {
            return;
        }
        return templateNote;
    }
    isJournalButtonPressed() {
        return this.controller.isJournalButtonPressed();
    }
    addAnalyticsPayload(opts, resp) {
        const { source } = { ...opts, ...resp };
        return (0, analytics_1.getAnalyticsPayload)(source);
    }
}
exports.NoteLookupCommand = NoteLookupCommand;
//# sourceMappingURL=NoteLookupCommand.js.map