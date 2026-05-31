import { TextEditor } from "vscode";
import { PreviewProxy } from "./components/views/PreviewProxy";
import { IDendronExtension } from "./dendronExtensionInterface";
/**
 * See [[Window Watcher|dendron://dendron.docs/pkg.plugin-core.ref.window-watcher]] for docs
 */
export declare class WindowWatcher {
    private _extension;
    private _preview;
    constructor({ extension, previewProxy, }: {
        extension: IDendronExtension;
        previewProxy: PreviewProxy;
    });
    activate(): void;
    private onDidChangeActiveTextEditor;
    private onDidChangeTextEditorVisibleRanges;
    /**
     * Decorate wikilinks, user tags etc. as well as warning about some issues like missing frontmatter
     */
    triggerUpdateDecorations(editor: TextEditor): Promise<void>;
    __DO_NOT_USE_IN_PROD_exposePropsForTesting(): {
        onDidChangeActiveTextEditor: (editor: TextEditor | undefined) => Promise<void>;
    };
}
