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
exports.WorkspaceHelpers = void 0;
/* eslint-disable global-require */
const common_all_1 = require("@dendronhq/common-all");
const js_yaml_1 = __importDefault(require("js-yaml"));
const vscode = __importStar(require("vscode"));
const vscode_uri_1 = require("vscode-uri");
class WorkspaceHelpers {
    /**
     * Test helper function that creates a temporary directory to act as the
     * workspace root. This function works in the browser environment
     */
    static async createTestWorkspaceDirectory() {
        const os = require("os");
        const tmp = os.tmpDir();
        const randomUUID = require("crypto-randomuuid");
        const tmpDirectory = vscode_uri_1.Utils.joinPath(vscode_uri_1.URI.file(tmp), randomUUID());
        await vscode.workspace.fs.createDirectory(tmpDirectory);
        return tmpDirectory;
    }
    static async getWSRootForTest() {
        if (vscode.workspace.workspaceFolders &&
            vscode.workspace.workspaceFolders.length > 0) {
            return vscode.workspace.workspaceFolders[0].uri;
        }
        return this.createTestWorkspaceDirectory();
    }
    /**
     * Create a test Dendron YAML config file at the specified location
     * @param wsRoot
     * @param config
     */
    static async createTestYAMLConfigFile(wsRoot, config) {
        const out = js_yaml_1.default.dump(config, { indent: 4, schema: js_yaml_1.default.JSON_SCHEMA });
        await vscode.workspace.fs.writeFile(vscode_uri_1.Utils.joinPath(wsRoot, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE), new Uint8Array(Buffer.from(out, "utf-8")));
    }
}
exports.WorkspaceHelpers = WorkspaceHelpers;
//# sourceMappingURL=WorkspaceHelpers.js.map