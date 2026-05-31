"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewPanelFactory = void 0;
const PreviewLinkHandler_1 = require("./PreviewLinkHandler");
const PreviewPanel_1 = require("./PreviewPanel");
const TextDocumentServiceFactory_1 = require("../../services/TextDocumentServiceFactory");
/**
 * NOTE: This class is meant to only be used in _extension.ts/workspace.ts, or in
 * tests. If you need to show preview in a component, inject a PreviewProxy in
 * the constructor signature and use that object to show/hide preview instead.
 */
class PreviewPanelFactory {
    static _preview;
    /**
     * Get a usable PreviewProxy for showing the preview
     */
    static create(extension) {
        // Simple singleton implementation, since we only want one preview panel at
        // any given time.
        // if preview panel doesn't exist yet, create a new one.
        if (!PreviewPanelFactory._preview) {
            PreviewPanelFactory._preview = new PreviewPanel_1.PreviewPanel({
                extension,
                linkHandler: new PreviewLinkHandler_1.PreviewLinkHandler(extension),
                textDocumentService: TextDocumentServiceFactory_1.TextDocumentServiceFactory.create(extension),
            });
        }
        return PreviewPanelFactory._preview;
    }
}
exports.PreviewPanelFactory = PreviewPanelFactory;
//# sourceMappingURL=PreviewViewFactory.js.map