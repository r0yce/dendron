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
exports.getWorkspaceConfig = getWorkspaceConfig;
require("reflect-metadata");
const common_all_1 = require("@dendronhq/common-all");
const js_yaml_1 = __importDefault(require("js-yaml"));
const vscode = __importStar(require("vscode"));
const vscode_1 = require("vscode");
async function getWorkspaceConfig(wsRoot) {
    const configPath = vscode_1.Uri.joinPath(wsRoot, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE);
    const config = (await readYAML(configPath, true));
    return config;
}
async function readYAML(path, overwriteDuplicate) {
    // @ts-ignore
    const textDecoder = new TextDecoder(); // This line of code is browser specific. For Node, we need to use the utils version of TextDecoder
    const file = await vscode.workspace.fs.readFile(path);
    const bar = textDecoder.decode(file);
    return js_yaml_1.default.load(bar, {
        schema: js_yaml_1.default.JSON_SCHEMA,
        json: overwriteDuplicate ?? false,
    });
}
//# sourceMappingURL=getWorkspaceConfig.js.map