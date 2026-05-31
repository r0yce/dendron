import { DECORATION_TYPES } from "@dendronhq/unified";
import { DecorationOptions, Diagnostic, TextEditor, TextEditorDecorationType } from "vscode";
export declare const EDITOR_DECORATION_TYPES: {
    [key in keyof typeof DECORATION_TYPES]: TextEditorDecorationType;
};
export type DendronDecoration<T = any> = {
    /**
     * type: mapping of {@link: DECORATION_TYPES} -> {@link: TextEditorDecorationType}
     */
    type: TextEditorDecorationType;
    /**
     * VSCode DecorationOptions
     */
    decoration: DecorationOptions;
    /**
     * Specific to type of decoration
     */
    data?: T;
};
export declare function delayedUpdateDecorations(updateDelay?: number): void;
export declare const debouncedUpdateDecorations: {
    debouncedFn: (editor: TextEditor) => void;
    states: Map<string | number, "timeout" | "execute" | "trailing">;
};
export declare function updateDecorations(editor: TextEditor): Promise<{
    allDecorations?: Map<TextEditorDecorationType, DecorationOptions[]>;
    allWarnings?: Diagnostic[];
}>;
