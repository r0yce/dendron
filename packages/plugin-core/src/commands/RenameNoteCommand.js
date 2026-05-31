"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenameNoteCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const constants_1 = require("../constants");
const ProxyMetricUtils_1 = require("../utils/ProxyMetricUtils");
const base_1 = require("./base");
const MoveNoteCommand_1 = require("./MoveNoteCommand");
/**
 * This is `Dendron: Rename Note`.
 * Currently (as of 2022-06-15),
 * this is simply wrapping methods of the move note command and calling them with a custom option.
 * This is done to correctly register the command and to properly instrument command usage.
 *
 * TODO: refactor move and rename logic, redesign arch for both commands.
 */
class RenameNoteCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.RENAME_NOTE.key;
    extension;
    _moveNoteCommand;
    constructor(ext) {
        super();
        this.extension = ext;
        this._moveNoteCommand = new MoveNoteCommand_1.MoveNoteCommand(this.extension);
    }
    async sanityCheck() {
        return this._moveNoteCommand.sanityCheck();
    }
    populateCommandOpts(opts) {
        return {
            allowMultiselect: false,
            useSameVault: true,
            title: "Rename Note",
            ...opts,
        };
    }
    async gatherInputs(opts) {
        return this._moveNoteCommand.gatherInputs(this.populateCommandOpts(opts));
    }
    trackProxyMetrics({ noteChangeEntryCounts, }) {
        if (this._moveNoteCommand._proxyMetricPayload === undefined) {
            return;
        }
        const { extra, ...props } = this._moveNoteCommand._proxyMetricPayload;
        ProxyMetricUtils_1.ProxyMetricUtils.trackRefactoringProxyMetric({
            props: {
                command: this.key,
                ...lodash_1.default.omit(props, "command"),
            },
            extra: {
                ...noteChangeEntryCounts,
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
            this.trackProxyMetrics({ noteChangeEntryCounts });
        }
        catch (error) {
            this.L.error({ error });
        }
        return noteChangeEntryCounts;
    }
    async execute(opts) {
        return this._moveNoteCommand.execute(this.populateCommandOpts(opts));
    }
}
exports.RenameNoteCommand = RenameNoteCommand;
//# sourceMappingURL=RenameNoteCommand.js.map