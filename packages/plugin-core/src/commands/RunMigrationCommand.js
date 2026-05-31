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
exports.RunMigrationCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const vscode = __importStar(require("vscode"));
const constants_1 = require("../constants");
const base_1 = require("./base");
class RunMigrationCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.RUN_MIGRATION.key;
    extension;
    constructor(ext) {
        super();
        this.extension = ext;
    }
    async gatherInputs(opts) {
        const migrationItems = lodash_1.default.map(engine_server_1.MIGRATION_ENTRIES, (migration) => {
            return {
                label: migration.version,
                description: `${migration.changes.length} change(s)`,
                detail: migration.changes
                    .map((set) => {
                    return set.name;
                })
                    .join("\n"),
                alwaysShow: true,
            };
        });
        if (lodash_1.default.isUndefined(opts)) {
            const selected = await vscode.window
                .showQuickPick(migrationItems)
                .then((value) => {
                if (!value) {
                    return;
                }
                return { version: value.label };
            });
            return selected;
        }
        else {
            return opts;
        }
    }
    async execute(opts) {
        const { version } = opts;
        const migrationsToRun = lodash_1.default.filter(engine_server_1.MIGRATION_ENTRIES, (migration) => migration.version === version);
        const ws = this.extension.getDWorkspace();
        const { wsRoot, config } = ws;
        const wsService = new engine_server_1.WorkspaceService({ wsRoot });
        const wsConfig = ws.type === common_all_1.WorkspaceType.CODE
            ? wsService.getCodeWorkspaceSettingsSync()
            : undefined;
        const response = vscode.window
            .withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Applying migration...",
            cancellable: false,
        }, async () => {
            const out = await engine_server_1.MigrationService.applyMigrationRules({
                currentVersion: version,
                previousVersion: "0.0.0",
                migrations: migrationsToRun,
                wsService,
                logger: this.L,
                wsConfig,
                dendronConfig: config,
            });
            return out;
        })
            .then((resp) => {
            resp.map((status) => {
                if (status.error) {
                    vscode.window.showErrorMessage("Error: ", status.error.message);
                }
                else {
                    vscode.window.showInformationMessage(`${status.data.changeName} (v${status.data.version}) apply status: ${status.data.status}`);
                }
            });
            return resp;
        });
        return response;
    }
}
exports.RunMigrationCommand = RunMigrationCommand;
//# sourceMappingURL=RunMigrationCommand.js.map