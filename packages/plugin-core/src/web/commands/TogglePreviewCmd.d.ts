import { TogglePreviewCommandOpts } from "../../commands/ShowPreviewInterface";
import { type PreviewProxy } from "../../components/views/PreviewProxy";
import { type ITelemetryClient } from "../../telemetry/common/ITelemetryClient";
import { WSUtilsWeb } from "../utils/WSUtils";
/**
 * Command to show the preview. If the desire is to programmatically show the
 * preview webview, then prefer to get an instance of {@link PreviewProxy}
 * instead of creating an instance of this command.
 */
export declare class TogglePreviewCmd {
    private _analytics;
    private wsUtils;
    key: string;
    _panel: PreviewProxy;
    constructor(previewPanel: PreviewProxy, _analytics: ITelemetryClient, wsUtils: WSUtilsWeb);
    run(): Promise<{
        note: import("@dendronhq/common-all").NoteProps;
    } | undefined>;
    shouldShowPreview(opts?: TogglePreviewCommandOpts): boolean;
}
