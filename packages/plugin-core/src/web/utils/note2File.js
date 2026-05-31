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
exports.note2File = note2File;
const common_all_1 = require("@dendronhq/common-all");
const vscode = __importStar(require("vscode"));
const vscode_uri_1 = require("vscode-uri");
/**
 * Return hash of written file - this is the vscode version of note2File of common-server
 */
async function note2File({ note, vault, wsRoot, }) {
    const { fname } = note;
    const ext = ".md";
    const payload = common_all_1.NoteUtils.serialize(note, { excludeStub: true });
    const vaultPath = (0, common_all_1.vault2Path)({ vault, wsRoot });
    await vscode.workspace.fs.writeFile(vscode_uri_1.Utils.joinPath(vaultPath, fname + ext), new Uint8Array(Buffer.from(payload, "utf-8")));
}
//# sourceMappingURL=note2File.js.map