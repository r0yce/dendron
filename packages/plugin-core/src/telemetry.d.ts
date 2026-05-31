import { DWorkspaceV2 } from "@dendronhq/common-all";
/** Creates a SegmentClient for telemetry, if enabled, and listens for vscode telemetry settings to disable it when requested. */
export declare function setupSegmentClient({ ws, cachePath, }: {
    ws?: DWorkspaceV2;
    cachePath?: string;
}): void;
