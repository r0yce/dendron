"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaultUtilsV2 = void 0;
const lodash_1 = __importDefault(require("lodash"));
const vscode_uri_1 = require("vscode-uri");
const constants_1 = require("./constants");
const vault_1 = require("./vault");
/**
 * This version is meant to use URI instead of string paths to make it work on
 * all FS environments. It also should not use 'path' to maximize OS
 * compatibility.
 */
class VaultUtilsV2 {
    static getRelPathFragments(vault) {
        if (vault_1.VaultUtils.isSelfContained(vault)) {
            // Return the path to the notes folder inside the vault. This is for
            // compatibility with existing code.
            return [vault.fsPath, constants_1.FOLDERS.NOTES];
        }
        if (vault.workspace) {
            return [vault.workspace, vault.fsPath];
        }
        if (vault.seed) {
            return ["seeds", vault.seed, vault.fsPath];
        }
        return vault.fsPath;
    }
    // TODO: Add Tests
    /**
     * For a given file path, return which vault the file path is a part of, if any.
     * @param param0
     * @returns
     */
    static getVaultByFilePath({ wsRoot, vaults, fsPath, }) {
        return lodash_1.default.find(vaults, (vault) => {
            const vaultPath = vscode_uri_1.Utils.joinPath(wsRoot, ...VaultUtilsV2.getRelPathFragments(vault)).fsPath;
            return fsPath.fsPath.startsWith(vaultPath);
        });
    }
}
exports.VaultUtilsV2 = VaultUtilsV2;
//# sourceMappingURL=VaultUtilsV2.js.map