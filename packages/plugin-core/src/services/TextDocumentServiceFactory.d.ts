import { IDendronExtension } from "../dendronExtensionInterface";
import { ITextDocumentService } from "./ITextDocumentService";
export declare class TextDocumentServiceFactory {
    private static _textDocumentService;
    /**
     * Instantiate TextDocumentService to be used in _extension.ts/workspace.ts
     */
    static create(extension: IDendronExtension): ITextDocumentService;
}
