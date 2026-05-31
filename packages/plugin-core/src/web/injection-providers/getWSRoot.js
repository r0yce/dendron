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
exports.getWSRoot = getWSRoot;
exports.findDownTo = findDownTo;
const common_all_1 = require("@dendronhq/common-all");
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const vscode_uri_1 = require("vscode-uri");
const anymatch_1 = __importDefault(require("anymatch"));
/**
 * Gets the workspace root of the currently opened folder(s) or workspace in VS Code
 * @returns
 */
async function getWSRoot() {
    const { workspaceFile, workspaceFolders } = vscode.workspace;
    if (workspaceFile) {
        return Promise.resolve(vscode_uri_1.Utils.dirname(workspaceFile));
    }
    if (workspaceFolders) {
        const folders = uniqueOutermostFolders(workspaceFolders.slice());
        const dendronWorkspaceFolders = await Promise.all(folders.map((folder) => findDownTo({
            base: folder.uri,
            fname: common_all_1.CONSTANTS.DENDRON_CONFIG_FILE,
            returnDirPath: true,
        })));
        const results = dendronWorkspaceFolders.filter(common_all_1.isNotUndefined);
        if (results.length <= 1) {
            return results[0];
        }
        const selectedRoot = await vscode.window.showQuickPick(results.map((result) => {
            return {
                label: result.fsPath,
            };
        }), {
            ignoreFocusOut: true,
            canPickMany: false,
            title: "Select Dendron workspace to load",
        });
        if (!selectedRoot) {
            await vscode.window.showInformationMessage("You skipped loading any Dendron workspace, Dendron is not active. You can run the 'Developer: Reload Window' command to reactivate Dendron.");
            // Logger.info({
            //   msg: "User skipped loading a Dendron workspace",
            //   workspaceFolders,
            // });
            return;
        }
        return results.find((folder) => folder.fsPath === selectedRoot.label);
    }
    return;
}
function uniqueOutermostFolders(folders) {
    // Avoid duplicates
    // folders = _.uniq(folders);
    if (folders.length === 1)
        return folders;
    return folders.filter((currentFolder) => folders.every((otherFolder) => {
        // `currentFolder` is not inside any other folder
        return !isInsidePath(otherFolder.uri.fsPath, currentFolder.uri.fsPath);
    }));
}
function isInsidePath(outer, inner) {
    // When going from `outer` to `inner`
    const relPath = path_1.default.relative(outer, inner);
    // If we have to leave `outer`, or if we have to switch to a
    // different drive with an absolute path, then `inner` can't be
    // inside `outer` (or `inner` and `outer` are identical)
    return (!relPath.startsWith("..") && !path_1.default.isAbsolute(relPath) && relPath !== "");
}
/**
 * Go to dirname that {fname} is contained in, going in (deeper into tree) from base.
 * @param maxLvl Default 3, how deep to go down in the file tree. Keep in mind that the tree gets wider and this search becomes exponentially more expensive the deeper we go.
 * @param returnDirPath - return path to directory, default: false
 *
 * One warning: this will not search into folders starting with `.` to avoid searching through things like the `.git` folder.
 */
async function findDownTo(opts) {
    const { fname, base, maxLvl, returnDirPath } = {
        maxLvl: 3,
        returnDirPath: false,
        ...opts,
    };
    const contents = await vscode.workspace.fs.readDirectory(base);
    const found = contents.filter((foundFile) => foundFile[0] === fname)[0];
    if (found) {
        const updatedPath = vscode_uri_1.Utils.joinPath(base, found[0]);
        return returnDirPath ? vscode_uri_1.Utils.dirname(updatedPath) : updatedPath;
    }
    if (maxLvl > 1) {
        // Keep searching recursively
        return (await Promise.all(contents.map(async (folder) => {
            // Find the folders in the current folder
            // TODO: Are 2 lines below safe to comment out?
            // const subfolder = await fs.stat(path.join(base.path, folder));
            // if (!subfolder.isDirectory()) return;
            // Exclude folders starting with . to skip stuff like `.git`
            if ((0, anymatch_1.default)(COMMON_FOLDER_IGNORES, folder))
                return;
            return findDownTo({
                ...opts,
                base: vscode_uri_1.Utils.joinPath(base, folder[0]),
                maxLvl: maxLvl - 1,
            });
        }))).filter(common_all_1.isNotUndefined)[0];
    }
    return undefined;
}
// TODO: Migrate to common-all
const COMMON_FOLDER_IGNORES = [
    "**/.*/**", // Any folder starting with .
    "**/node_modules/**", // nodejs
    "**/.git/**", // git
    "**/__pycache__/**", // python
];
//# sourceMappingURL=getWSRoot.js.map