import { NoteProps } from "@dendronhq/common-all";
import { PreviewProxy } from "../components/views/PreviewProxy";
import { InputArgCommand } from "./base";
import { TogglePreviewCommandOpts, TogglePreviewCommandOutput } from "./ShowPreviewInterface";
/**
 * Command to show the preview. If the desire is to programmatically show the
 * preview webview, then prefer to get an instance of {@link PreviewProxy}
 * instead of creating an instance of this command.
 */
export declare class TogglePreviewCommand extends InputArgCommand<TogglePreviewCommandOpts, TogglePreviewCommandOutput> {
    key: string;
    _panel: PreviewProxy;
    constructor(previewPanel: PreviewProxy);
    sanityCheck(opts?: TogglePreviewCommandOpts): Promise<"No note currently open, and no note selected to open." | undefined>;
    addAnalyticsPayload(opts?: TogglePreviewCommandOpts): {
        providedFile: boolean;
    };
    /**
     *
     * @param opts if a Uri is defined through this parameter, then that Uri will
     * be shown in preview. If unspecified, then preview will follow default
     * behavior of showing the contents of the currently in-focus Dendron note.
     */
    execute(opts?: TogglePreviewCommandOpts): Promise<{
        note: NoteProps;
        fsPath?: never;
    } | {
        fsPath: string;
        note?: never;
    } | undefined>;
    /**
     * Show a file in the preview. Only use this for files that are not notes,
     * like a markdown file outside any vault.
     * @param filePath
     * @returns
     */
    private openFileInPreview;
}
