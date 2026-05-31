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
exports.VSCodeFileStore = void 0;
exports.getAllFiles = getAllFiles;
exports.getAllFilesWithTypes = getAllFilesWithTypes;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const vscode = __importStar(require("vscode"));
class VSCodeFileStore {
    async read(uri) {
        try {
            const raw = await vscode.workspace.fs.readFile(uri);
            // @ts-ignore - this needs to use browser's TextDecoder, not an import from node utils
            const textDecoder = new TextDecoder();
            const data = textDecoder.decode(raw);
            return { data };
        }
        catch (err) {
            return {
                error: common_all_1.DendronError.createFromStatus({
                    status: common_all_1.ERROR_STATUS.CONTENT_NOT_FOUND,
                    message: `Failed to read from ${uri.fsPath}.`,
                    innerError: err,
                    severity: common_all_1.ERROR_SEVERITY.MINOR,
                }),
            };
        }
    }
    async readDir(opts) {
        const { root } = lodash_1.default.defaults(opts, {
            exclude: [".git", "Icon\r", ".*"],
        });
        try {
            const resp = await getAllFiles(opts);
            if (resp.error) {
                return { error: resp.error };
            }
            else if (resp.data) {
                return { data: resp.data };
            }
            else {
                return { data: [] };
            }
        }
        catch (err) {
            return {
                error: common_all_1.DendronError.createFromStatus({
                    status: common_all_1.ERROR_STATUS.CONTENT_NOT_FOUND,
                    message: `Failed to read from ${root}.`,
                    innerError: err,
                    severity: common_all_1.ERROR_SEVERITY.MINOR,
                }),
            };
        }
    }
    async write(uri, content) {
        try {
            await vscode.workspace.fs.writeFile(uri, new Uint8Array(Buffer.from(content, "utf-8")));
            return { data: uri };
        }
        catch (err) {
            return {
                error: common_all_1.DendronError.createFromStatus({
                    status: common_all_1.ERROR_STATUS.WRITE_FAILED,
                    message: `Failed to write to ${uri.fsPath}.`,
                    innerError: err,
                    severity: common_all_1.ERROR_SEVERITY.MINOR,
                }),
            };
        }
    }
    async delete(uri) {
        try {
            await vscode.workspace.fs.delete(uri);
            return { data: uri };
        }
        catch (err) {
            return {
                error: common_all_1.DendronError.createFromStatus({
                    status: common_all_1.ERROR_STATUS.DELETE_FAILED,
                    message: `Failed to delete from ${uri.fsPath}.`,
                    innerError: err,
                    severity: common_all_1.ERROR_SEVERITY.MINOR,
                }),
            };
        }
    }
    async rename(oldUri, newUri) {
        try {
            await vscode.workspace.fs.rename(oldUri, newUri);
            return { data: newUri };
        }
        catch (err) {
            return {
                error: common_all_1.DendronError.createFromStatus({
                    status: common_all_1.ERROR_STATUS.RENAME_FAILED,
                    message: `Failed to rename from ${oldUri.fsPath} to ${newUri.fsPath}.`,
                    innerError: err,
                    severity: common_all_1.ERROR_SEVERITY.MINOR,
                }),
            };
        }
    }
}
exports.VSCodeFileStore = VSCodeFileStore;
/** Gets all files in `root`, with include and exclude lists (glob matched)
 * Implemented this function again here from common-server.
 */
async function getAllFiles(opts) {
    const out = await getAllFilesWithTypes(opts);
    const data = out.data?.map((item) => item[0]);
    return { error: out.error, data };
}
async function getAllFilesWithTypes(opts) {
    const { root } = lodash_1.default.defaults(opts, {
        exclude: [".git", "Icon\r", ".*"],
    });
    try {
        const rootUri = root;
        const allFiles = await vscode.workspace.fs.readDirectory(rootUri);
        return {
            data: allFiles
                .map((values) => {
                // match exclusions
                const fname = values[0];
                const fileType = values[1];
                if (lodash_1.default.some([
                    fileType === vscode.FileType.Directory,
                    (0, common_all_1.globMatch)(opts.exclude || [], fname),
                ])) {
                    return null;
                }
                // match inclusion
                if (opts.include && !(0, common_all_1.globMatch)(opts.include, fname)) {
                    return null;
                }
                return values;
            })
                .filter(common_all_1.isNotNull),
            error: null,
        };
    }
    catch (err) {
        return {
            error: new common_all_1.DendronError({
                message: "Error when reading the vault",
                payload: err,
                // Marked as minor to avoid stopping initialization. Even if we can't
                // read one vault, we might be able to read other vaults.
                severity: common_all_1.ERROR_SEVERITY.MINOR,
            }),
        };
    }
}
//# sourceMappingURL=VSCodeFileStore.js.map