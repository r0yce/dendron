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
exports.VSCodeTestUtils = void 0;
const common_server_1 = require("@dendronhq/common-server");
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const vsCodeUtils_1 = require("../../vsCodeUtils");
const workspace_1 = require("../../workspace");
class VSCodeTestUtils {
    static mockUserConfigDir() {
        const dir = (0, common_server_1.tmpDir)().name;
        const getCodeUserConfigDurStub = sinon_1.default.stub(vsCodeUtils_1.VSCodeUtils, "getCodeUserConfigDir");
        getCodeUserConfigDurStub.callsFake(() => {
            const wrappedMethod = getCodeUserConfigDurStub.wrappedMethod;
            const originalOut = wrappedMethod();
            return {
                userConfigDir: [dir, originalOut.delimiter].join(""),
                delimiter: originalOut.delimiter,
                osName: originalOut.osName,
            };
        });
        return getCodeUserConfigDurStub;
    }
    static stubWSFolders(wsRoot) {
        if (wsRoot === undefined) {
            const stub = sinon_1.default
                .stub(vscode.workspace, "workspaceFolders")
                .value(undefined);
            workspace_1.DendronExtension.workspaceFolders = () => undefined;
            return stub;
        }
        const wsFolders = [
            {
                name: "root",
                index: 0,
                uri: vscode.Uri.parse(wsRoot),
            },
        ];
        const stub = sinon_1.default
            .stub(vscode.workspace, "workspaceFolders")
            .value(wsFolders);
        workspace_1.DendronExtension.workspaceFolders = () => wsFolders;
        return stub;
    }
}
exports.VSCodeTestUtils = VSCodeTestUtils;
//# sourceMappingURL=vscode-test-utils.js.map