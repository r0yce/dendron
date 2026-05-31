"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportPodV2CLICommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const pods_core_1 = require("@dendronhq/pods-core");
const base_1 = require("./base");
const podsV2_1 = require("./podsV2");
const utils_1 = require("./utils");
const airtable_1 = __importDefault(require("@dendronhq/airtable"));
const lodash_1 = __importDefault(require("lodash"));
const engine_server_1 = require("@dendronhq/engine-server");
const clipboardy_1 = __importDefault(require("clipboardy"));
const common_server_1 = require("@dendronhq/common-server");
class ExportPodV2CLICommand extends base_1.CLICommand {
    constructor() {
        super({
            name: "exportPodV2",
            desc: "use a pod v2 to export notes",
        });
    }
    buildArgs(args) {
        super.buildArgs(args);
        (0, utils_1.setupEngineArgs)(args);
        (0, podsV2_1.setupPodArgs)(args);
    }
    async enrichArgs(args) {
        this.addArgsToPayload({ podType: args.configValues?.podType });
        return (0, podsV2_1.enrichPodArgs)(args);
    }
    /**
     * Method to instantiate the pod instance with the
     * passed in configuration
     */
    createPod(config, engine) {
        switch (config.podType) {
            case pods_core_1.PodV2Types.MarkdownExportV2:
                return new pods_core_1.MarkdownExportPodV2({
                    podConfig: config,
                    engine,
                    dendronConfig: common_server_1.DConfig.readConfigSync(engine.wsRoot),
                });
            case pods_core_1.PodV2Types.JSONExportV2:
                return new pods_core_1.JSONExportPodV2({
                    podConfig: config,
                });
            case pods_core_1.PodV2Types.AirtableExportV2:
                return new pods_core_1.AirtableExportPodV2({
                    airtable: new airtable_1.default({ apiKey: config.apiKey }),
                    config,
                    engine,
                });
            case pods_core_1.PodV2Types.NotionExportV2:
                return new pods_core_1.NotionExportPodV2({
                    podConfig: config,
                });
            case pods_core_1.PodV2Types.GoogleDocsExportV2: {
                const { wsRoot } = engine;
                const fpath = engine_server_1.EngineUtils.getPortFilePathForCLI({ wsRoot });
                /**
                 * The GDoc Export/Import pod requires engine port to refresh google access token.
                 * refreshGoogleAccessToken: [[..\packages\pods-core\src\utils.ts]]
                 */
                const port = (0, engine_server_1.openPortFile)({ fpath });
                return new pods_core_1.GoogleDocsExportPodV2({
                    podConfig: config,
                    engine,
                    port,
                });
            }
            default:
                throw new common_all_1.DendronError({
                    message: `the requested pod type :${config.podType} is not implemented yet`,
                });
        }
    }
    async execute(opts) {
        const ctx = "execute";
        const { server, serverSockets, engine, config, payload } = opts;
        this.multiNoteExportCheck({
            destination: config.destination,
            exportScope: config.exportScope,
        });
        const pod = this.createPod(config, engine);
        this.L.info({ ctx, msg: "running pod..." });
        const exportReturnValue = await pod.exportNotes(payload);
        await this.onExportComplete({
            exportReturnValue,
            podType: config.podType,
            engine,
            config,
        });
        this.L.info({ ctx, msg: "done execute" });
        return new Promise((resolve) => {
            server.close((err) => {
                this.L.info({ ctx, msg: "closing server" });
                // close outstanding connections
                serverSockets?.forEach((socket) => socket.destroy());
                if (err) {
                    return resolve({
                        error: new common_all_1.DendronError({ message: "error closing", payload: err }),
                    });
                }
                resolve({ error: undefined });
            });
        });
    }
    async onExportComplete(opts) {
        const { exportReturnValue, podType, engine, config } = opts;
        switch (podType) {
            case pods_core_1.PodV2Types.AirtableExportV2:
                return this.onAirtableExportComplete({
                    exportReturnValue,
                    engine,
                    config,
                });
            case pods_core_1.PodV2Types.GoogleDocsExportV2:
                return this.onGoogleDocsExportComplete({
                    exportReturnValue,
                    engine,
                    config,
                });
            case pods_core_1.PodV2Types.NotionExportV2:
                return this.onNotionExportComplete({ exportReturnValue, engine });
            case pods_core_1.PodV2Types.MarkdownExportV2:
                return this.onMarkdownExportComplete({ exportReturnValue, config });
            case pods_core_1.PodV2Types.JSONExportV2:
                return this.onJSONExportComplete({ exportReturnValue, config });
            default:
                (0, common_all_1.assertUnreachable)(podType);
        }
    }
    async onAirtableExportComplete(opts) {
        const { exportReturnValue, engine, config } = opts;
        const records = exportReturnValue.data;
        if (records?.created) {
            await pods_core_1.AirtableUtils.updateAirtableIdForNewlySyncedNotes({
                records: records.created,
                engine,
                logger: this.L,
                podId: config.podId,
            });
        }
        const createdCount = exportReturnValue.data?.created?.length ?? 0;
        const updatedCount = exportReturnValue.data?.updated?.length ?? 0;
        if (common_all_1.ResponseUtil.hasError(exportReturnValue)) {
            const errorMsg = `Finished Airtable Export. ${createdCount} records created; ${updatedCount} records updated. Error encountered: ${common_all_1.ErrorFactory.safeStringify(exportReturnValue.error)}`;
            this.L.error(errorMsg);
        }
        else {
            this.print(`Finished Airtable Export. ${createdCount} records created; ${updatedCount} records updated.`);
        }
    }
    async onGoogleDocsExportComplete(opts) {
        const { exportReturnValue, engine, config } = opts;
        const createdDocs = exportReturnValue.data?.created?.filter((ent) => !!ent);
        const updatedDocs = exportReturnValue.data?.updated?.filter((ent) => !!ent);
        const createdCount = createdDocs?.length ?? 0;
        const updatedCount = updatedDocs?.length ?? 0;
        if (createdDocs && createdCount > 0) {
            await pods_core_1.GoogleDocsUtils.updateNotesWithCustomFrontmatter(createdDocs, engine, config.parentFolderId);
        }
        if (updatedDocs && updatedCount > 0) {
            await pods_core_1.GoogleDocsUtils.updateNotesWithCustomFrontmatter(updatedDocs, engine, config.parentFolderId);
        }
        if (common_all_1.ResponseUtil.hasError(exportReturnValue)) {
            const errorMsg = `Finished GoogleDocs Export. ${createdCount} docs created; ${updatedCount} docs updated. Error encountered: ${common_all_1.ErrorFactory.safeStringify(exportReturnValue.error?.message)}`;
            this.L.error(errorMsg);
        }
        else {
            this.print(`Finished GoogleDocs Export. ${createdCount} docs created; ${updatedCount} docs updated.`);
        }
    }
    async onNotionExportComplete(opts) {
        const { exportReturnValue, engine } = opts;
        const { data } = exportReturnValue;
        if (data?.created) {
            await pods_core_1.NotionUtils.updateNotionIdForNewlyCreatedNotes(data.created, engine);
        }
        const createdCount = data?.created?.length ?? 0;
        if (common_all_1.ResponseUtil.hasError(exportReturnValue)) {
            const errorMsg = `Finished Notion Export. ${createdCount} notes created in Notion; Error encountered: ${common_all_1.ErrorFactory.safeStringify(exportReturnValue.error)}`;
            this.L.error(errorMsg);
        }
        else {
            this.print(`Finished Notion Export. ${createdCount} notes created in Notion`);
        }
    }
    async onMarkdownExportComplete(opts) {
        const { exportReturnValue, config } = opts;
        const content = exportReturnValue.data?.exportedNotes;
        if (config.destination === "clipboard" && lodash_1.default.isString(content)) {
            clipboardy_1.default.writeSync(content);
        }
        const count = content?.length ?? 0;
        if (common_all_1.ResponseUtil.hasError(exportReturnValue)) {
            const errorMsg = `Finished Markdown Export. ${count} notes exported; Error encountered: ${common_all_1.ErrorFactory.safeStringify(exportReturnValue.error)}`;
            this.L.error(errorMsg);
        }
        else {
            this.print("Finished running Markdown export pod.");
        }
    }
    async onJSONExportComplete(opts) {
        const { exportReturnValue, config } = opts;
        const content = exportReturnValue.data?.exportedNotes;
        if (config.destination === "clipboard" && lodash_1.default.isString(content)) {
            clipboardy_1.default.writeSync(content);
        }
        if (common_all_1.ResponseUtil.hasError(exportReturnValue)) {
            const errorMsg = `Finished JSON Export. Error encountered: ${common_all_1.ErrorFactory.safeStringify(exportReturnValue.error)}`;
            this.L.error(errorMsg);
        }
        else {
            this.print("Finished running JSON export pod.");
        }
    }
    multiNoteExportCheck(opts) {
        if (opts.destination === "clipboard" &&
            opts.exportScope !== pods_core_1.PodExportScope.Note &&
            opts.exportScope !== pods_core_1.PodExportScope.Selection) {
            throw new common_all_1.DendronError({
                message: "Multi Note Export cannot have clipboard as destination. Please configure your destination by using Dendron: Configure Export Pod V2 command",
            });
        }
    }
}
exports.ExportPodV2CLICommand = ExportPodV2CLICommand;
//# sourceMappingURL=exportPodV2.js.map