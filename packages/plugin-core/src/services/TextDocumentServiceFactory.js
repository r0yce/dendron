"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextDocumentServiceFactory = void 0;
const TextDocumentService_1 = require("./node/TextDocumentService");
const vscode_1 = require("vscode");
class TextDocumentServiceFactory {
    static _textDocumentService;
    /**
     * Instantiate TextDocumentService to be used in _extension.ts/workspace.ts
     */
    static create(extension) {
        // Simple singleton implementation
        if (!TextDocumentServiceFactory._textDocumentService) {
            TextDocumentServiceFactory._textDocumentService = new TextDocumentService_1.TextDocumentService(extension, vscode_1.workspace.onDidSaveTextDocument);
        }
        return TextDocumentServiceFactory._textDocumentService;
    }
}
exports.TextDocumentServiceFactory = TextDocumentServiceFactory;
//# sourceMappingURL=TextDocumentServiceFactory.js.map