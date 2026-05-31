"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delayedFrontmatterWarning = void 0;
const lodash_1 = __importDefault(require("lodash"));
const vscode_1 = require("vscode");
const FRONTMATTER_WARNING = vscode_1.languages.createDiagnosticCollection();
/** Delay displaying any warnings while the user is still typing.
 *
 * The user is considered to have stopped typing if they didn't type anything after 500ms.
 */
exports.delayedFrontmatterWarning = lodash_1.default.debounce((uri, diagnostics) => {
    FRONTMATTER_WARNING.set(uri, diagnostics);
}, 500);
//# sourceMappingURL=frontmatter.js.map