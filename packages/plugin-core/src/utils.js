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
exports.getOpenGraphMetadata = exports.showMessage = exports.clipboard = exports.DisposableStore = void 0;
const open_graph_scraper_1 = __importDefault(require("open-graph-scraper"));
const vscode = __importStar(require("vscode"));
class DisposableStore {
    _toDispose = new Set();
    add(dis) {
        this._toDispose.add(dis);
    }
    dispose() {
        // eslint-disable-next-line no-restricted-syntax
        for (const disposable of this._toDispose) {
            disposable.dispose();
        }
    }
}
exports.DisposableStore = DisposableStore;
exports.clipboard = vscode.env.clipboard;
exports.showMessage = {
    info: vscode.window.showInformationMessage,
    warning: vscode.window.showWarningMessage,
};
// This layer of indirection is only here enable stubbing a top level function that's the default export of a module // https://github.com/sinonjs/sinon/issues/562#issuecomment-399090111
// Otherwise, we can't mock it for testing.
const getOpenGraphMetadata = (opts) => {
    return (0, open_graph_scraper_1.default)(opts);
};
exports.getOpenGraphMetadata = getOpenGraphMetadata;
//# sourceMappingURL=utils.js.map