import { DVault, DendronConfig, ReducedDEngine, RenderNoteOpts, RenderNoteResp } from "@dendronhq/common-all";
import { INoteRenderer } from "./INoteRenderer";
export declare class PluginNoteRenderer implements INoteRenderer {
    private publishingConfig;
    private engine;
    private vaults;
    constructor(publishingConfig: DendronConfig, // why is this call publishingConfig?
    engine: ReducedDEngine, vaults: DVault[]);
    renderNote(opts: RenderNoteOpts): Promise<RenderNoteResp>;
    private _renderNote;
}
