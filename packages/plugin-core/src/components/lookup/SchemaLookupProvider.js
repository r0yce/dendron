"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaLookupProvider = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const NoteLookupCommand_1 = require("../../commands/NoteLookupCommand");
const logger_1 = require("../../logger");
const analytics_1 = require("../../utils/analytics");
const NotePickerUtils_1 = require("../lookup/NotePickerUtils");
const SchemaPickerUtils_1 = require("../lookup/SchemaPickerUtils");
const constants_1 = require("./constants");
const types_1 = require("./types");
const utils_1 = require("./utils");
class SchemaLookupProvider {
    id;
    _extension;
    _onAcceptHooks;
    opts;
    constructor(id, opts, extension) {
        this.id = id;
        this._extension = extension;
        this._onAcceptHooks = [];
        this.opts = opts;
    }
    async provide(opts) {
        const { quickpick, token } = opts;
        const onUpdatePickerItems = lodash_1.default.bind(this.onUpdatePickerItems, this);
        const onUpdateDebounced = lodash_1.default.debounce(() => {
            onUpdatePickerItems({
                picker: quickpick,
                token: token.token,
            });
        }, 100, {
            leading: true,
            maxWait: 200,
        });
        quickpick.onDidChangeValue(onUpdateDebounced);
        quickpick.onDidAccept(async () => {
            logger_1.Logger.info({
                ctx: "SchemaLookupProvider:onDidAccept",
                quickpick: quickpick.value,
            });
            onUpdateDebounced.cancel();
            if (lodash_1.default.isEmpty(quickpick.selectedItems)) {
                await onUpdatePickerItems({
                    picker: quickpick,
                    token: new vscode_1.CancellationTokenSource().token,
                });
            }
            this.onDidAccept({ quickpick, cancellationToken: token })();
        });
        return;
    }
    /**
     * Takes selection and runs accept, followed by hooks.
     * @param opts
     * @returns
     */
    onDidAccept(opts) {
        return async () => {
            const ctx = "SchemaLookupProvider:onDidAccept";
            const { quickpick: picker, cancellationToken } = opts;
            let selectedItems = NotePickerUtils_1.NotePickerUtils.getSelection(picker);
            logger_1.Logger.debug({
                ctx,
                selectedItems: selectedItems.map((item) => common_all_1.NoteUtils.toLogObj(item)),
            });
            if (lodash_1.default.isEmpty(selectedItems)) {
                selectedItems =
                    await SchemaPickerUtils_1.SchemaPickerUtils.fetchPickerResultsWithCurrentValue({
                        picker,
                    });
            }
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
            const isMultiLevel = picker.value.split(".").length > 1;
            if (isMultiLevel) {
                vscode_1.window
                    .showInformationMessage("It looks like you are trying to create a multi-level [schema](https://wiki.dendron.so/notes/c5e5adde-5459-409b-b34d-a0d75cbb1052.html). This is not supported. If you are trying to create a note instead, run the `> Note Lookup` command or click on `Note Lookup`", ...["Note Lookup"])
                    .then(async (selection) => {
                    if (selection === "Note Lookup") {
                        await new NoteLookupCommand_1.NoteLookupCommand().run({
                            initialValue: picker.value,
                        });
                    }
                });
                engine_server_1.HistoryService.instance().add({
                    source: "lookupProvider",
                    action: "done",
                    id: this.id,
                    data: { cancel: true },
                });
                return;
            }
            // last chance to cancel
            cancellationToken.cancel();
            if (!this.opts.noHidePickerOnAccept) {
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
    async onUpdatePickerItems(opts) {
        const { picker, token } = opts;
        const ctx = "updatePickerItems";
        picker.busy = true;
        const pickerValue = picker.value;
        const start = process.hrtime();
        // get prior
        const querystring = common_all_1.NoteLookupUtils.slashToDot(pickerValue);
        const queryOrig = common_all_1.NoteLookupUtils.slashToDot(picker.value);
        const ws = this._extension.getDWorkspace();
        let profile;
        const engine = ws.engine;
        logger_1.Logger.info({ ctx, msg: "enter", queryOrig });
        try {
            // if empty string, show all 1st level results
            if (querystring === "") {
                logger_1.Logger.debug({ ctx, msg: "empty qs" });
                const nodes = lodash_1.default.map(lodash_1.default.values((await engine.querySchema("*")).data), (ent) => {
                    return common_all_1.SchemaUtils.getModuleRoot(ent);
                });
                picker.items = await Promise.all(nodes.map(async (ent) => {
                    return common_all_1.DNodeUtils.enhancePropForQuickInputV3({
                        wsRoot: this._extension.getDWorkspace().wsRoot,
                        props: ent,
                        schema: ent.schema
                            ? (await engine.getSchema(ent.schema.moduleId)).data
                            : undefined,
                        vaults: ws.vaults,
                    });
                }));
                return;
            }
            // initialize with current picker items without default items present
            const items = [...picker.items];
            let updatedItems = utils_1.PickerUtilsV2.filterDefaultItems(items);
            if (token?.isCancellationRequested) {
                return;
            }
            // if we entered a different level of hierarchy, re-run search
            updatedItems = await SchemaPickerUtils_1.SchemaPickerUtils.fetchPickerResults({
                picker,
                qs: querystring,
            });
            if (token?.isCancellationRequested) {
                return;
            }
            // // check if we have an exact match in the results and keep track for later
            const perfectMatch = lodash_1.default.find(updatedItems, { fname: queryOrig });
            // check if single item query, vscode doesn't surface single letter queries
            // we need this so that suggestions will show up
            // TODO: this might be buggy since we don't apply filter middleware
            if (picker.activeItems.length === 0 && querystring.length === 1) {
                picker.items = updatedItems;
                picker.activeItems = picker.items;
                return;
            }
            updatedItems =
                this.opts.allowNewNote && !perfectMatch
                    ? updatedItems.concat([
                        NotePickerUtils_1.NotePickerUtils.createNoActiveItem({
                            fname: querystring,
                            detail: constants_1.CREATE_NEW_SCHEMA_DETAIL,
                        }),
                    ])
                    : updatedItems;
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
                cancelled: token?.isCancellationRequested,
            });
            analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.SchemaLookup_Update, {
                duration: profile,
            });
            return; // eslint-disable-line no-unsafe-finally -- probably can be just removed
        }
    }
    registerOnAcceptHook(hook) {
        this._onAcceptHooks.push(hook);
    }
}
exports.SchemaLookupProvider = SchemaLookupProvider;
//# sourceMappingURL=SchemaLookupProvider.js.map