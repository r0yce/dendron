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
exports.TraitUtils = void 0;
const vscode = __importStar(require("vscode"));
const ExtensionProvider_1 = require("../ExtensionProvider");
class TraitUtils {
    /**
     * Shows a warning to user's about needing to enable workspace trust for traits.
     * @returns true if the workspace is trusted.
     */
    static checkWorkspaceTrustAndWarn() {
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        const moreInfoBtn = "More Info";
        if (!engine.trustedWorkspace) {
            vscode.window
                .showErrorMessage("Workspace Trust has been disabled for this workspace. Turn on workspace trust before using note traits.", moreInfoBtn)
                .then((resp) => {
                if (resp === moreInfoBtn) {
                    vscode.commands.executeCommand("vscode.open", "https://code.visualstudio.com/docs/editor/workspace-trust");
                }
            });
        }
        return engine.trustedWorkspace;
    }
}
exports.TraitUtils = TraitUtils;
//# sourceMappingURL=TraitUtils.js.map