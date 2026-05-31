"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowNoteGraphCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const analytics_1 = require("../utils/analytics");
const utils_1 = require("../views/utils");
const base_1 = require("./base");
class ShowNoteGraphCommand extends base_1.BasicCommand {
    static requireActiveWorkspace = true;
    key = constants_1.DENDRON_COMMANDS.SHOW_NOTE_GRAPH.key;
    _panel;
    constructor(panel) {
        super();
        this._panel = panel;
    }
    async gatherInputs() {
        return {};
    }
    async execute() {
        const { bundleName: name } = (0, common_all_1.getWebEditorViewEntry)(common_all_1.DendronEditorViewKey.NOTE_GRAPH);
        const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
        const port = ext.port;
        const engine = ext.getEngine();
        const { wsRoot } = engine;
        const webViewAssets = utils_1.WebViewUtils.getJsAndCss();
        const html = await utils_1.WebViewUtils.getWebviewContent({
            ...webViewAssets,
            name,
            port,
            wsRoot,
            panel: this._panel,
        });
        this._panel.webview.html = html;
        utils_1.WebViewUtils.openWebviewAndMeasureTimeOpen(this._panel, (duration) => {
            analytics_1.AnalyticsUtils.track(this.key, {
                timeOpen: duration,
            });
        });
    }
}
exports.ShowNoteGraphCommand = ShowNoteGraphCommand;
//# sourceMappingURL=ShowNoteGraph.js.map