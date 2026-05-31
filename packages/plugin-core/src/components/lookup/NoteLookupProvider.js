"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteLookupProvider = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const logger_1 = require("../../logger");
const analytics_1 = require("../../utils/analytics");
const NotePickerUtils_1 = require("./NotePickerUtils");
const constants_1 = require("./constants");
const types_1 = require("./types");
const utils_1 = require("./utils");
class NoteLookupProvider {
    id;
    _onAcceptHooks;
    opts;
    extension;
    constructor(id, opts, extension) {
        this.id = id;
        this.extension = extension;
        this._onAcceptHooks = [];
        this.opts = opts;
    }
    async provide(opts) {
        const ctx = "NoteLookupProvider.provide";
        logger_1.Logger.info({ ctx, msg: "enter" });
        const { quickpick, token } = opts;
        const onUpdatePickerItems = lodash_1.default.bind(this.onUpdatePickerItems, this);
        const onUpdateDebounced = lodash_1.default.debounce(() => {
            const ctx = "NoteLookupProvider.onUpdateDebounced";
            logger_1.Logger.debug({ ctx, msg: "enter" });
            const out = onUpdatePickerItems({
                picker: quickpick,
                token: token.token,
            });
            logger_1.Logger.debug({ ctx, msg: "exit" });
            return out;
        }, 100, {
            // Use trailing to make sure we get the latest letters typed by the user
            // before accepting.
            leading: false,
        });
        quickpick.onDidChangeValue(onUpdateDebounced);
        quickpick.onDidAccept(async () => {
            const ctx = "quickpick:onDidAccept";
            logger_1.Logger.info({
                ctx,
                msg: "enter",
                quickpick: quickpick.value,
            });
            await onUpdateDebounced.flush();
            if (lodash_1.default.isEmpty(quickpick.selectedItems)) {
                logger_1.Logger.debug({
                    ctx,
                    msg: "no selected items",
                    quickpick: quickpick.value,
                });
                await onUpdatePickerItems({
                    picker: quickpick,
                    token: new vscode_1.CancellationTokenSource().token,
                });
            }
            // NOTE: sometimes, even with debouncing, the value of a new item is not the same as the selectedItem. this makes sure that the value is in sync
            if (quickpick.selectedItems.length === 1 &&
                [constants_1.CREATE_NEW_LABEL, constants_1.CREATE_NEW_WITH_TEMPLATE_LABEL].includes(quickpick.selectedItems[0].label)) {
                quickpick.selectedItems[0].fname = quickpick.value;
            }
            this.onDidAccept({ quickpick, cancellationToken: token })();
        });
        logger_1.Logger.info({ ctx, msg: "exit" });
        return;
    }
    shouldRejectItem(opts) {
        const { item } = opts;
        const result = common_all_1.NoteUtils.validateFname(item.fname);
        const shouldReject = !result.isValid && utils_1.PickerUtilsV2.isCreateNewNotePicked(item);
        if (shouldReject) {
            return {
                shouldReject,
                reason: result.reason,
            };
        }
        else {
            return {
                shouldReject,
            };
        }
    }
    /**
     * Takes selection and runs accept, followed by hooks.
     * @param opts
     * @returns
     */
    onDidAccept(opts) {
        return async () => {
            const ctx = "NoteLookupProvider:onDidAccept";
            const { quickpick: picker, cancellationToken } = opts;
            picker.buttons.forEach((button) => {
                analytics_1.AnalyticsUtils.track(common_all_1.LookupEvents.LookupModifiersSetOnAccept, {
                    command: this.id,
                    type: button.type,
                    pressed: button.pressed,
                });
            });
            let selectedItems = NotePickerUtils_1.NotePickerUtils.getSelection(picker);
            const { preAcceptValidators } = this.opts;
            if (preAcceptValidators) {
                const isValid = preAcceptValidators.every((validator) => {
                    return validator(selectedItems);
                });
                if (!isValid)
                    return;
            }
            logger_1.Logger.debug({
                ctx,
                selectedItems: selectedItems.map((item) => common_all_1.NoteUtils.toLogObj(item)),
            });
            // NOTE: if user presses <ENTER> before picker has a chance to process, this will be `[]`
            // In this case we want to calculate picker item from current value
            if (lodash_1.default.isEmpty(selectedItems)) {
                logger_1.Logger.debug({
                    ctx,
                    msg: "no selected items, calculating from picker value",
                    value: picker.value,
                });
                selectedItems = await NotePickerUtils_1.NotePickerUtils.fetchPickerResultsNoInput({
                    picker,
                });
                logger_1.Logger.debug({
                    ctx,
                    msg: "selected items from picker value",
                    selectedItems: selectedItems.map((item) => common_all_1.NoteUtils.toLogObj(item)),
                });
            }
            // validates fname.
            if (selectedItems.length === 1) {
                const item = selectedItems[0];
                const result = this.shouldRejectItem({ item });
                if (result.shouldReject) {
                    vscode_1.window.showErrorMessage(result.reason);
                    return;
                }
            }
            // when doing lookup, opening existing notes don't require vault picker
            if (utils_1.PickerUtilsV2.hasNextPicker(picker, {
                selectedItems,
                providerId: this.id,
            })) {
                logger_1.Logger.debug({ ctx, msg: "nextPicker:pre" });
                picker.state = types_1.DendronQuickPickState.PENDING_NEXT_PICK;
                picker.vault = await picker.nextPicker({ note: selectedItems[0] });
                // check if we exited from selecting a vault
                if (lodash_1.default.isUndefined(picker.vault)) {
                    engine_server_1.HistoryService.instance().add({
                        source: "lookupProvider",
                        action: "done",
                        id: this.id,
                        data: { cancel: true },
                    });
                    return;
                }
            }
            // last chance to cancel
            cancellationToken.cancel();
            if (!this.opts.noHidePickerOnAccept) {
                picker.state = types_1.DendronQuickPickState.FULFILLED;
                picker.hide();
            }
            const onAcceptHookResp = await Promise.all(this._onAcceptHooks.map((hook) => hook({ quickpick: picker, selectedItems })));
            const errors = lodash_1.default.filter(onAcceptHookResp, (ent) => ent.error);
            if (!lodash_1.default.isEmpty(errors)) {
                engine_server_1.HistoryService.instance().add({
                    source: "lookupProvider",
                    action: "error",
                    id: this.id,
                    data: { error: errors[0] },
                });
            }
            else {
                engine_server_1.HistoryService.instance().add({
                    source: "lookupProvider",
                    action: "done",
                    id: this.id,
                    data: {
                        selectedItems,
                        onAcceptHookResp: lodash_1.default.map(onAcceptHookResp, (ent) => ent.data),
                    },
                });
            }
        };
    }
    //  ^hlj1vvw48s2v
    async onUpdatePickerItems(opts) {
        const { picker, token, fuzzThreshold } = opts;
        const ctx = "NoteLookupProvider:updatePickerItems";
        picker.busy = true;
        let pickerValue = picker.value;
        const start = process.hrtime();
        // Just activated picker's have special behavior:
        //
        // We slice the postfix off until the first dot to show all results at the same
        // level so that when a user types `foo.one`, they will see all results in `foo.*`
        if (picker._justActivated &&
            !picker.nonInteractive &&
            !this.opts.forceAsIsPickerValueUsage) {
            pickerValue = common_all_1.NoteLookupUtils.getQsForCurrentLevel(pickerValue);
        }
        const transformedQuery = common_all_1.NoteLookupUtils.transformQueryString({
            query: pickerValue,
            onlyDirectChildren: picker.showDirectChildrenOnly,
        });
        const queryOrig = common_all_1.NoteLookupUtils.slashToDot(picker.value);
        const ws = this.extension.getDWorkspace();
        let profile;
        const queryUpToLastDot = queryOrig.lastIndexOf(".") >= 0
            ? queryOrig.slice(0, queryOrig.lastIndexOf("."))
            : undefined;
        const engine = ws.engine;
        logger_1.Logger.debug({
            ctx,
            msg: "enter",
            queryOrig,
            justActivated: picker._justActivated,
            prevQuickpickValue: picker.prevQuickpickValue,
        });
        try {
            if (picker.value === picker.prevQuickpickValue) {
                if (!opts.forceUpdate) {
                    logger_1.Logger.debug({ ctx, msg: "picker value did not change" });
                    return;
                }
            }
            if (picker.itemsFromSelection) {
                picker.items = picker.itemsFromSelection;
                if (picker.selectAll) {
                    picker.selectedItems = picker.items;
                }
                return;
            }
            // if empty string, show all 1st level results
            if (transformedQuery.queryString === "") {
                logger_1.Logger.debug({ ctx, msg: "empty qs" });
                const items = await NotePickerUtils_1.NotePickerUtils.fetchRootQuickPickResults({
                    engine,
                });
                const extraItems = this.opts.extraItems;
                if (extraItems) {
                    items.unshift(...extraItems);
                }
                picker.items = items;
                return;
            }
            // initialize with current picker items without default items present
            const items = [...picker.items];
            let updatedItems = utils_1.PickerUtilsV2.filterDefaultItems(items);
            if (token?.isCancellationRequested) {
                return;
            }
            updatedItems = await NotePickerUtils_1.NotePickerUtils.fetchPickerResults({
                picker,
                transformedQuery,
                originalQS: queryOrig,
            });
            if (token?.isCancellationRequested) {
                return;
            }
            // check if single item query, vscode doesn't surface single letter queries
            // we need this so that suggestions will show up
            // TODO: this might be buggy since we don't apply filter middleware
            if (picker.activeItems.length === 0 &&
                transformedQuery.queryString.length === 1) {
                picker.items = updatedItems;
                picker.activeItems = picker.items;
                return;
            }
            // add schema completions
            if (!lodash_1.default.isUndefined(queryUpToLastDot) &&
                !transformedQuery.wasMadeFromWikiLink) {
                const results = await common_all_1.SchemaUtils.matchPath({
                    notePath: queryUpToLastDot,
                    engine,
                });
                // since namespace matches everything, we don't do queries on that
                if (results && !results.namespace) {
                    const { schema, schemaModule } = results;
                    const dirName = queryUpToLastDot;
                    const candidates = schema.children
                        .map((ent) => {
                        const mschema = schemaModule.schemas[ent];
                        if (common_all_1.SchemaUtils.hasSimplePattern(mschema, {
                            isNotNamespace: true,
                        })) {
                            const pattern = common_all_1.SchemaUtils.getPattern(mschema, {
                                isNotNamespace: true,
                            });
                            const fname = [dirName, pattern].join(".");
                            return common_all_1.NoteUtils.fromSchema({
                                schemaModule,
                                schemaId: ent,
                                fname,
                                vault: utils_1.PickerUtilsV2.getVaultForOpenEditor(),
                            });
                        }
                        return;
                    })
                        .filter(Boolean);
                    let candidatesToAdd = lodash_1.default.differenceBy(candidates, updatedItems, (ent) => ent.fname);
                    const { wsRoot, vaults } = this.extension.getDWorkspace();
                    candidatesToAdd = (0, utils_1.sortBySimilarity)(candidatesToAdd, transformedQuery.originalQuery);
                    const itemsToAdd = await Promise.all(candidatesToAdd.map(async (ent) => {
                        return common_all_1.DNodeUtils.enhancePropForQuickInputV3({
                            wsRoot,
                            props: ent,
                            schema: ent.schema
                                ? (await engine.getSchema(ent.schema.moduleId)).data
                                : undefined,
                            vaults,
                        });
                    }));
                    updatedItems = updatedItems.concat(itemsToAdd);
                }
            }
            // filter the results through optional middleware
            if (picker.filterMiddleware) {
                updatedItems = picker.filterMiddleware(updatedItems);
            }
            // if new notes are allowed and we didn't get a perfect match, append `Create New` option
            // to picker results
            // NOTE: order matters. we always pick the first item in single select mode
            logger_1.Logger.debug({ ctx, msg: "active != qs" });
            // If each of the vaults in the workspace already have exact match of the file name
            // then we should not allow create new option.
            const queryOrigLowerCase = queryOrig.toLowerCase();
            const numberOfExactMatches = updatedItems.filter((item) => item.fname.toLowerCase() === queryOrigLowerCase).length;
            const vaultsHaveSpaceForExactMatch = this.extension.getDWorkspace().engine.vaults.length >
                numberOfExactMatches;
            const shouldAddCreateNew = 
            // sometimes lookup is in mode where new notes are not allowed (eg. move an existing note, this option is manually passed in)
            this.opts.allowNewNote &&
                // notes can't end with dot, invalid note
                !queryOrig.endsWith(".") &&
                // if you can select mult notes, new note is not valid
                !picker.canSelectMany &&
                // when you create lookup from selection, new note is not valid
                !transformedQuery.wasMadeFromWikiLink &&
                vaultsHaveSpaceForExactMatch;
            if (shouldAddCreateNew) {
                const entryCreateNew = NotePickerUtils_1.NotePickerUtils.createNoActiveItem({
                    fname: queryOrig,
                    detail: constants_1.CREATE_NEW_NOTE_DETAIL,
                });
                const newItems = [entryCreateNew];
                // should not add `Create New with Template` if the quickpick
                // 1. has an onCreate defined (i.e. task note), or
                const onCreateDefined = picker.onCreate !== undefined;
                const shouldAddCreateNewWithTemplate = this.opts.allowNewNoteWithTemplate && !onCreateDefined;
                if (shouldAddCreateNewWithTemplate) {
                    const entryCreateNewWithTemplate = NotePickerUtils_1.NotePickerUtils.createNewWithTemplateItem({
                        fname: queryOrig,
                    });
                    newItems.push(entryCreateNewWithTemplate);
                }
                const bubbleUpCreateNew = common_all_1.ConfigUtils.getLookup(ws.config).note
                    .bubbleUpCreateNew;
                if ((0, utils_1.shouldBubbleUpCreateNew)({
                    numberOfExactMatches,
                    querystring: queryOrig,
                    bubbleUpCreateNew,
                })) {
                    updatedItems = newItems.concat(updatedItems);
                }
                else {
                    updatedItems = updatedItems.concat(newItems);
                }
            }
            // check fuzz threshold. tune fuzzyness. currently hardcoded
            // TODO: in the future this should be done in the engine
            if (fuzzThreshold === 1) {
                updatedItems = updatedItems.filter((ent) => ent.fname === picker.value);
            }
            // We do NOT want quick pick to filter out items since it does not match with FuseJS.
            updatedItems.forEach((item) => {
                item.alwaysShow = true;
            });
            picker.items = updatedItems;
        }
        catch (err) {
            vscode_1.window.showErrorMessage(err);
            throw Error(err);
        }
        finally {
            profile = (0, common_server_1.getDurationMilliseconds)(start);
            picker.busy = false;
            picker._justActivated = false;
            picker.prevValue = picker.value;
            picker.prevQuickpickValue = picker.value;
            logger_1.Logger.info({
                ctx,
                msg: "exit",
                queryOrig,
                profile,
                numItems: picker.items.length,
                cancelled: token?.isCancellationRequested,
            });
            analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.NoteLookup_Update, {
                duration: profile,
            });
            return; // eslint-disable-line no-unsafe-finally -- probably can be just removed
        }
    }
    registerOnAcceptHook(hook) {
        this._onAcceptHooks.push(hook);
    }
}
exports.NoteLookupProvider = NoteLookupProvider;
//# sourceMappingURL=NoteLookupProvider.js.map