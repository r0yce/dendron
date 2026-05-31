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
const assert_1 = __importDefault(require("assert"));
const sinon_1 = __importDefault(require("sinon"));
const vscode = __importStar(require("vscode"));
const vscode_uri_1 = require("vscode-uri");
const getWSRoot_1 = require("../../../injection-providers/getWSRoot");
const WorkspaceHelpers_1 = require("../../helpers/WorkspaceHelpers");
suite("GIVEN a workspace", () => {
    test("WHEN a code-workspace file is opened THEN the getWSRoot injector returns the workspace root URI correctly", async () => {
        const wsRoot = await WorkspaceHelpers_1.WorkspaceHelpers.getWSRootForTest();
        sinon_1.default.replaceGetter(vscode.workspace, "workspaceFile", () => vscode_uri_1.Utils.joinPath(wsRoot, "test.code-workspace"));
        const returnedRoot = await (0, getWSRoot_1.getWSRoot)();
        assert_1.default.notStrictEqual(returnedRoot, wsRoot);
        sinon_1.default.restore();
    });
    // TODO: Add tests for non code-workspace environments (multiple folders opened)
});
//# sourceMappingURL=getWSRoot.test.js.map