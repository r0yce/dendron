"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlankInitializer = void 0;
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const path_1 = __importDefault(require("path"));
/**
 * Blank Workspace Initializer. Creates the barebones requirements for a functioning workspace
 */
class BlankInitializer {
    createVaults(wsVault) {
        const vaultPath = wsVault?.fsPath || "vault";
        return { wsVault: { fsPath: vaultPath } };
    }
    async onWorkspaceCreation(opts) {
        if (opts.wsVault) {
            const vpath = (0, common_server_1.vault2Path)({ vault: opts.wsVault, wsRoot: opts.wsRoot });
            // write snippets
            const vscodeDir = path_1.default.join(vpath, ".vscode");
            engine_server_1.Snippets.create(vscodeDir);
        }
    }
}
exports.BlankInitializer = BlankInitializer;
//# sourceMappingURL=blankInitializer.js.map