"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaSyncService = void 0;
const lodash_1 = __importDefault(require("lodash"));
const logger_1 = require("../logger");
const vscode_1 = __importDefault(require("vscode"));
const engine_server_1 = require("@dendronhq/engine-server");
const path_1 = __importDefault(require("path"));
const vsCodeUtils_1 = require("../vsCodeUtils");
/** Currently responsible for keeping the engine in sync with schema
 *  changes on disk. */
class SchemaSyncService {
    extension;
    constructor(extension) {
        this.extension = extension;
    }
    async onDidSave({ document }) {
        const uri = document.uri;
        logger_1.Logger.info({
            ctx: "SchemaSyncService:onDidChange",
            msg: "updating schema",
        });
        await this.saveSchema({ uri });
    }
    async saveSchema({ uri, isBrandNewFile, }) {
        const schemaParser = new engine_server_1.SchemaParser({
            wsRoot: this.extension.getDWorkspace().wsRoot,
            logger: logger_1.Logger,
        });
        const engineClient = this.extension.getDWorkspace().engine;
        const parsedSchema = await schemaParser.parse([path_1.default.basename(uri.fsPath)], this.extension.wsUtils.getVaultFromUri(uri));
        if (lodash_1.default.isEmpty(parsedSchema.errors)) {
            const resp = await Promise.all(lodash_1.default.map(parsedSchema.schemas, async (schema) => {
                return engineClient.writeSchema(schema, { metaOnly: true });
            }));
            const msg = `${isBrandNewFile ? "Created" : "Updated"} schemas in '${path_1.default.basename(uri.fsPath)}'`;
            vscode_1.default.window.showInformationMessage(msg);
            // We are setting the status bar message when schemas are malformed to give user
            // data when the error message closes (if they use 'Go to schema' button) so we
            // should overwrite the status bar with a 'happy' message as well.
            vscode_1.default.window.setStatusBarMessage(msg);
            return resp;
        }
        else {
            const navigateButtonText = "Go to schema.";
            const msg = `Failed to update '${path_1.default.basename(uri.fsPath)}'. Details: ${parsedSchema.errors?.map((e) => e.message)}`;
            // If the user clicks on navigate button the error (including the reason) goes
            // away hence we should at least set the status to the reason. It is very
            // imperfect since status bar can be hidden, the message can overrun,
            // (or the user might not notice the status bar message altogether)
            // but its better than nothing.
            vscode_1.default.window.setStatusBarMessage(msg);
            const userAction = await vscode_1.default.window.showErrorMessage(msg, navigateButtonText);
            if (userAction === navigateButtonText) {
                await vsCodeUtils_1.VSCodeUtils.openFileInEditor(uri);
            }
            return;
        }
    }
}
exports.SchemaSyncService = SchemaSyncService;
//# sourceMappingURL=SchemaSyncService.js.map