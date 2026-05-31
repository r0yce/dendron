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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileItem = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode_1 = require("vscode");
class FileItem {
    IsDir;
    SourcePath;
    TargetPath;
    constructor(sourcePath, targetPath, IsDir = false) {
        this.IsDir = IsDir;
        this.SourcePath = this.toUri(sourcePath);
        if (targetPath !== undefined) {
            this.TargetPath = this.toUri(targetPath);
        }
    }
    get name() {
        return path.basename(this.SourcePath.path);
    }
    get path() {
        return this.SourcePath;
    }
    get targetPath() {
        return this.TargetPath;
    }
    get exists() {
        if (this.targetPath === undefined) {
            return false;
        }
        return fs.existsSync(this.targetPath.fsPath);
    }
    get isDir() {
        return this.IsDir;
    }
    async move() {
        this.ensureTargetPath();
        await vscode_1.workspace.fs.rename(this.path, this.targetPath, { overwrite: true });
        this.SourcePath = this.targetPath;
        return this;
    }
    async duplicate() {
        this.ensureTargetPath();
        await vscode_1.workspace.fs.copy(this.path, this.targetPath, { overwrite: true });
        return new FileItem(this.targetPath);
    }
    async remove(useTrash = false) {
        try {
            await vscode_1.workspace.fs.delete(this.path, { recursive: true, useTrash });
        }
        catch (err) {
            if (useTrash === true && err instanceof vscode_1.FileSystemError) {
                return this.remove(false);
            }
            throw err;
        }
        return this;
    }
    async create(mkDir) {
        this.ensureTargetPath();
        if (this.exists) {
            await vscode_1.workspace.fs.delete(this.targetPath, { recursive: true });
        }
        if (mkDir === true || this.isDir) {
            await vscode_1.workspace.fs.createDirectory(this.targetPath);
        }
        else {
            await vscode_1.workspace.fs.writeFile(this.targetPath, new Uint8Array());
        }
        return new FileItem(this.targetPath);
    }
    ensureTargetPath() {
        if (this.targetPath === undefined) {
            throw new Error("Missing target path");
        }
    }
    toUri(uriOrString) {
        return uriOrString instanceof vscode_1.Uri ? uriOrString : vscode_1.Uri.file(uriOrString);
    }
}
exports.FileItem = FileItem;
//# sourceMappingURL=FileItem.js.map