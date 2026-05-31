import { WSUtilsWeb } from "../utils/WSUtils";
import { SiteUtilsWeb } from "../utils/SiteUtilsWeb";
import { type ITelemetryClient } from "../../telemetry/common/ITelemetryClient";
export declare class CopyNoteURLCmd {
    private wsUtils;
    private _analytics;
    private siteUtils?;
    static key: string;
    constructor(wsUtils: WSUtilsWeb, _analytics: ITelemetryClient, siteUtils?: SiteUtilsWeb | undefined);
    showFeedback(link: string): Promise<void>;
    run(): Promise<string | undefined>;
    getActiveTextEditor(): any;
}
