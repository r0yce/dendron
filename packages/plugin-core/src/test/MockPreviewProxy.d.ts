import { NoteProps } from "@dendronhq/common-all";
import { PreviewProxy } from "../components/views/PreviewProxy";
/**
 * Mock Preview Proxy. This should accurately reflect state of visible and open
 * properties without actually requiring a vscode webview for testing.
 */
export declare class MockPreviewProxy implements PreviewProxy {
    _isVisible: boolean;
    _isOpen: boolean;
    _isLocked: boolean;
    show(_note?: NoteProps): Promise<void>;
    hide(): void;
    isVisible(): boolean;
    isOpen(): boolean;
    lock(_noteId?: string): void;
    unlock(): void;
    isLocked(): boolean;
}
