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
const mocha_1 = require("mocha");
const semver_1 = __importDefault(require("semver"));
const vscode = __importStar(require("vscode"));
const testUtilsv2_1 = require("../testUtilsv2");
/**
 * This is for testing functionality that is only triggered when upgrading
 * a workspace
 */
suite("temporary testing of Dendron version compatibility downgrade sequence", () => {
    (0, mocha_1.describe)(`GIVEN the activation sequence of Dendron`, () => {
        (0, mocha_1.describe)(`WHEN VS Code Version is up to date`, () => {
            let invokedWorkspaceTrustFn = false;
            (0, mocha_1.beforeEach)(() => {
                invokedWorkspaceTrustFn = semver_1.default.gte(vscode.version, "1.57.0");
            });
            (0, mocha_1.it)(`THEN onDidGrantWorkspaceTrust will get invoked.`, () => {
                (0, testUtilsv2_1.expect)(invokedWorkspaceTrustFn).toEqual(true);
            });
            (0, mocha_1.it)(`AND onDidGrantWorkspaceTrust can be found in the API.`, () => {
                vscode.workspace.onDidGrantWorkspaceTrust(() => {
                    //no-op for testing
                });
            });
        });
        (0, mocha_1.describe)(`WHEN VS Code Version is on a version less than 1.57.0`, () => {
            let invokedWorkspaceTrustFn = false;
            const userVersion = "1.56.1";
            (0, mocha_1.beforeEach)(() => {
                invokedWorkspaceTrustFn = semver_1.default.gte(userVersion, "1.57.0");
            });
            (0, mocha_1.it)(`THEN onDidGrantWorkspaceTrust will not get invoked.`, () => {
                (0, testUtilsv2_1.expect)(invokedWorkspaceTrustFn).toEqual(false);
            });
        });
    });
});
//# sourceMappingURL=Extension-PostUpgrade.test.js.map