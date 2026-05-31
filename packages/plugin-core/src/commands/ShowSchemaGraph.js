"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowSchemaGraphCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const utils_1 = require("../views/utils");
const base_1 = require("./base");
class ShowSchemaGraphCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.SHOW_SCHEMA_GRAPH.key;
    _panel;
    constructor(panel) {
        super();
        this._panel = panel;
    }
    async gatherInputs() {
        return {};
    }
    async execute() {
        const { bundleName: name } = (0, common_all_1.getWebEditorViewEntry)(common_all_1.DendronEditorViewKey.SCHEMA_GRAPH);
        const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
        const port = ext.port;
        const engine = ext.getEngine();
        const { wsRoot } = engine;
        const webViewAssets = utils_1.WebViewUtils.getJsAndCss();
        const html = await utils_1.WebViewUtils.getWebviewContent({
            ...webViewAssets,
            port,
            wsRoot,
            panel: this._panel,
            name,
        });
        this._panel.webview.html = html;
        this._panel.reveal();
    }
}
exports.ShowSchemaGraphCommand = ShowSchemaGraphCommand;
//# sourceMappingURL=ShowSchemaGraph.js.map