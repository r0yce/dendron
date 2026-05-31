"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorCLICommand = void 0;
const engine_server_1 = require("@dendronhq/engine-server");
// @ts-ignore
const lodash_1 = __importDefault(require("lodash"));
const base_1 = require("./base");
const utils_1 = require("./utils");
class DoctorCLICommand extends base_1.CLICommand {
    constructor() {
        super({ name: "doctor", desc: "doctor helps you fix your notes" });
    }
    buildArgs(args) {
        super.buildArgs(args);
        (0, utils_1.setupEngineArgs)(args);
        args.option("action", {
            describe: "what action the doctor should take",
            type: "string",
            requiresArg: true,
            choices: Object.values(engine_server_1.DoctorActionsEnum),
        });
        args.option("query", {
            describe: "run doctor over a query",
            type: "string",
        });
        args.option("limit", {
            describe: "limit num changes",
            type: "number",
        });
        args.option("dryRun", {
            describe: "dry run",
            type: "boolean",
        });
        args.option("podId", {
            describe: "podId used to export note(s) to Airtable",
            type: "string",
        });
    }
    async enrichArgs(args) {
        this.addArgsToPayload({ action: args.action });
        const engineArgs = await (0, utils_1.setupEngine)(args);
        return { data: { ...args, ...engineArgs } };
    }
    /**
     * Given opts and out,
     * prepare the analytics payload that should be included to the
     * tracked event.
     *
     * Implement {@link DoctorService.executeDoctorActions} so that
     * it outputs the necessary information,
     * and prepare / add it here.
     *
     * Only the cases implemented will add a payload.
     */
    async addAnalyticsPayload(opts, out) {
        switch (opts.action) {
            case engine_server_1.DoctorActionsEnum.FIX_INVALID_FILENAMES: {
                const payload = out.resp;
                if (payload) {
                    lodash_1.default.entries(payload).forEach((entry) => {
                        const [key, value] = entry;
                        this.addToPayload({ key, value });
                    });
                }
                break;
            }
            default: {
                // no-op.
                break;
            }
        }
    }
    async execute(opts) {
        const ds = new engine_server_1.DoctorService({ printFunc: this.print.bind(this) });
        const out = await ds.executeDoctorActions(opts);
        await this.addAnalyticsPayload(opts, out);
        ds.dispose();
        return out;
    }
}
exports.DoctorCLICommand = DoctorCLICommand;
//# sourceMappingURL=doctor.js.map