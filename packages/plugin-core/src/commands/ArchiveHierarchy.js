"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchiveHierarchyCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
const RefactorHierarchyV2_1 = require("./RefactorHierarchyV2");
class ArchiveHierarchyCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.ARCHIVE_HIERARCHY.key;
    refactorCmd;
    trackProxyMetrics;
    prepareProxyMetricPayload;
    _proxyMetricPayload;
    constructor(name) {
        super(name);
        this.refactorCmd = new RefactorHierarchyV2_1.RefactorHierarchyCommandV2();
        this.trackProxyMetrics = this.refactorCmd.trackProxyMetrics.bind(this);
        this.prepareProxyMetricPayload =
            this.refactorCmd.prepareProxyMetricPayload.bind(this);
    }
    async gatherInputs() {
        let value = "";
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        if (editor) {
            value = common_all_1.NoteUtils.uri2Fname(editor.document.uri);
        }
        const match = await vsCodeUtils_1.VSCodeUtils.showInputBox({
            prompt: "Enter hierarchy to archive",
            value,
        });
        if (!match) {
            return;
        }
        return { match };
    }
    async execute(opts) {
        const { match } = lodash_1.default.defaults(opts, {});
        const replace = `archive.${match}`;
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        const capturedNotes = await this.refactorCmd.getCapturedNotes({
            scope: undefined,
            matchRE: new RegExp(match),
            engine,
        });
        this.prepareProxyMetricPayload(capturedNotes);
        return this.refactorCmd.execute({ match, replace });
    }
    async showResponse(res) {
        return this.refactorCmd.showResponse(res);
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
            this.trackProxyMetrics({
                noteChangeEntryCounts,
            });
        }
        catch (error) {
            this.L.error({ error });
        }
        return noteChangeEntryCounts;
    }
}
exports.ArchiveHierarchyCommand = ArchiveHierarchyCommand;
//# sourceMappingURL=ArchiveHierarchy.js.map