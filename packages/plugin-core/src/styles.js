"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphStyleService = void 0;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const vscode_1 = require("vscode");
const vsCodeUtils_1 = require("./vsCodeUtils");
const common_all_1 = require("@dendronhq/common-all");
// TODO: If you'd like to target a specific theme, pre-pend each class with either ".theme-dark" or ".theme-light"
const STYLES_TEMPLATE = `/*
Add Dendron graph styles below. The graph can be styled with any valid Cytoscape.js selector: https://js.cytoscape.org/#cy.style
Full Dendron-specific styling documentation can be found here: https://wiki.dendron.so/notes/587e6d62-3c5b-49b0-aedc-02f62f0448e6/#adding-styles
If you are new to Cystoscape styling, use our built-in snippet to help you get started: https://wiki.dendron.so/notes/587e6d62-3c5b-49b0-aedc-02f62f0448e6#built-in-snippet copied
Note: Empty selectors may affect parsing of following selectors, so be sure to comment/remove them when not in use.
If style properties are not applying, make sure each property is followed with a semicolon. Troubleshoot guide can be found here: https://wiki.dendron.so/notes/587e6d62-3c5b-49b0-aedc-02f62f0448e6/#troubleshooting
*/

/* Any graph node */
/* node {} */

/* Any graph edge */
/* edge {} */

/* Any selected node */
/* :selected {} */

/* Any parent nodes (local note graph only) */
/* .parent {} */

/* Any link connection edge */
/* .links {} */

/* Any hierarchy connection edge */
/* .hierarchy {} */
`;
/*
Obsidian.md style
.graph-view.color-fill {}
.graph-view.color-fill-highlight {}
.graph-view.color-arrow {}
.graph-view.color-circle {}
.graph-view.color-line {}
.graph-view.color-text {}
*/
/* .graph-view.color-fill-tag {} */
/* .graph-view.color-fill-attachment {} */
/* .graph-view.color-line-highlight {} */
/* .graph-view.color-fill-unresolved {} */
class GraphStyleService {
    static styleFilePath() {
        return path_1.default.join(os_1.default.homedir(), common_all_1.FOLDERS.DENDRON_SYSTEM_ROOT, "styles.css");
    }
    static doesStyleFileExist() {
        return fs_extra_1.default.pathExistsSync(this.styleFilePath());
    }
    static createStyleFile() {
        fs_extra_1.default.ensureFileSync(this.styleFilePath());
        fs_extra_1.default.writeFileSync(this.styleFilePath(), STYLES_TEMPLATE);
    }
    static async openStyleFile() {
        const uri = vscode_1.Uri.file(this.styleFilePath());
        await vsCodeUtils_1.VSCodeUtils.openFileInEditor(uri);
    }
    static readStyleFile() {
        if (this.doesStyleFileExist()) {
            return fs_extra_1.default.readFileSync(this.styleFilePath()).toString();
        }
        return undefined;
    }
    static getParsedStyles() {
        let css = this.readStyleFile();
        if (!css)
            return undefined;
        // Remove comments
        css = css.replace("/\\/\\*.+?\\*\\//", "");
        // Remove ".graph-view" class, as it is only kept for Obsidian compatibility
        css.replace(".graph-view", "");
        return css;
    }
}
exports.GraphStyleService = GraphStyleService;
//# sourceMappingURL=styles.js.map