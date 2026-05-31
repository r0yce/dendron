"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaLookupCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const utils_1 = require("../components/lookup/utils");
const constants_1 = require("../constants");
const logger_1 = require("../logger");
const analytics_1 = require("../utils/analytics");
const base_1 = require("./base");
const ExtensionProvider_1 = require("../ExtensionProvider");
class SchemaLookupCommand extends base_1.BaseCommand {
    key = constants_1.DENDRON_COMMANDS.LOOKUP_SCHEMA.key;
    _controller;
    _provider;
    constructor() {
        super("SchemaLookupCommand");
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
    get provider() {
        if (lodash_1.default.isUndefined(this._provider)) {
            throw common_all_1.DendronError.createFromStatus({
                status: common_all_1.ERROR_STATUS.INVALID_STATE,
                message: "provider not set",
            });
        }
        return this._provider;
    }
    async gatherInputs(opts) {
        const start = process.hrtime();
        const ctx = "SchemaLookupCommand:gatherInput";
        logger_1.Logger.info({ ctx, opts, msg: "enter" });
        const copts = opts || {};
        const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
        this._controller = extension.lookupControllerFactory.create({
            nodeType: "schema",
        });
        this._provider = extension.schemaLookupProviderFactory.create("schemaLookup", {
            allowNewNote: true,
            noHidePickerOnAccept: false,
        });
        const lc = this.controller;
        const { quickpick } = await lc.prepareQuickPick({
            title: "Lookup Schema",
            placeholder: "schema",
            provider: this.provider,
            initialValue: copts.initialValue,
            nonInteractive: copts.noConfirm,
            alwaysShow: true,
        });
        const profile = (0, common_server_1.getDurationMilliseconds)(start);
        analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.SchemaLookup_Gather, {
            duration: profile,
        });
        return {
            controller: this.controller,
            provider: this.provider,
            quickpick,
            noConfirm: copts.noConfirm,
        };
    }
    async enrichInputs(opts) {
        return new Promise((resolve) => {
            const start = process.hrtime();
            engine_server_1.HistoryService.instance().subscribev2("lookupProvider", {
                id: "schemaLookup",
                listener: async (event) => {
                    if (event.action === "done") {
                        const data = event.data;
                        if (data.cancel) {
                            resolve(undefined);
                        }
                        const _opts = {
                            selectedItems: data.selectedItems,
                            ...opts,
                        };
                        resolve(_opts);
                    }
                    else if (event.action === "error") {
                        const error = event.data.error;
                        this.L.error({ error });
                        resolve(undefined);
                    }
                    else if (event.data &&
                        event.action === "changeState" &&
                        event.data.action === "hide") {
                        // changeState/hide is triggered when user cancels schema lookup
                        this.L.info({
                            ctx: `SchemaLookupCommand`,
                            msg: `changeState.hide event received.`,
                        });
                        resolve(undefined);
                    }
                    else {
                        const error = common_all_1.ErrorFactory.createUnexpectedEventError({ event });
                        this.L.error({ error });
                    }
                    engine_server_1.HistoryService.instance().remove("schemaLookup", "lookupProvider");
                },
            });
            opts.controller.showQuickPick({
                provider: opts.provider,
                quickpick: opts.quickpick,
                nonInteractive: opts.noConfirm,
            });
            const profile = (0, common_server_1.getDurationMilliseconds)(start);
            analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.SchemaLookup_Show, {
                duration: profile,
            });
        });
    }
    async acceptItem(item) {
        let result;
        const start = process.hrtime();
        const isNew = utils_1.PickerUtilsV2.isCreateNewNotePicked(item);
        if (isNew) {
            result = this.acceptNewSchemaItem();
        }
        else {
            result = this.acceptExistingSchemaItem(item);
        }
        const profile = (0, common_server_1.getDurationMilliseconds)(start);
        analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.SchemaLookup_Accept, {
            duration: profile,
            isNew,
        });
        return result;
    }
    async acceptExistingSchemaItem(item) {
        const { wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const vpath = (0, common_server_1.vault2Path)({
            vault: item.vault,
            wsRoot,
        });
        const schemaModule = await engine.getSchema(item.id);
        if (!schemaModule.data) {
            return;
        }
        const uri = vscode_1.Uri.file(common_all_1.SchemaUtils.getPath({
            root: vpath,
            fname: schemaModule.data.fname,
        }));
        return { uri, node: schemaModule.data };
    }
    async acceptNewSchemaItem() {
        const picker = this.controller.quickPick;
        const fname = picker.value;
        const ws = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const { engine } = ws;
        const vault = picker.vault
            ? picker.vault
            : utils_1.PickerUtilsV2.getVaultForOpenEditor();
        const nodeSchemaModuleNew = common_all_1.SchemaUtils.createModuleProps({
            fname,
            vault,
        });
        const vpath = (0, common_server_1.vault2Path)({ vault, wsRoot: ws.wsRoot });
        const uri = vscode_1.Uri.file(common_all_1.SchemaUtils.getPath({ root: vpath, fname }));
        const resp = await engine.writeSchema(nodeSchemaModuleNew);
        return { uri, node: nodeSchemaModuleNew, resp };
    }
    async execute(opts) {
        try {
            const { quickpick } = opts;
            const selected = quickpick.selectedItems.slice(0, 1);
            const out = await Promise.all(selected.map((item) => {
                return this.acceptItem(item);
            }));
            const outClean = out.filter((ent) => !lodash_1.default.isUndefined(ent));
            await lodash_1.default.reduce(outClean, async (acc, item) => {
                await acc;
                return quickpick.showNote(item.uri);
            }, Promise.resolve({}));
        }
        finally {
            opts.controller.onHide();
        }
        return opts;
    }
    cleanUp() {
        if (this._controller) {
            this._controller.onHide();
        }
    }
}
exports.SchemaLookupCommand = SchemaLookupCommand;
//# sourceMappingURL=SchemaLookupCommand.js.map