import { DEngineClient, DendronConfig, IProgress, IProgressStep, NoteProps, RespV2 } from "@dendronhq/common-all";
import { JSONSchemaType } from "ajv";
import { ExportPodV2, MarkdownV2PodConfig, RunnableMarkdownV2PodConfig } from "../../..";
/**
 * Markdown Export Pod (V2 - for compatibility with Pod V2 workflow).
 */
export type MarkdownExportReturnType = RespV2<{
    exportedNotes?: string | NoteProps[];
}>;
export declare class MarkdownExportPodV2 implements ExportPodV2<MarkdownExportReturnType> {
    private _config;
    private _engine;
    private _dendronConfig;
    constructor({ podConfig, engine, dendronConfig, }: {
        podConfig: RunnableMarkdownV2PodConfig;
        engine: DEngineClient;
        dendronConfig: DendronConfig;
    });
    exportNotes(notes: NoteProps[], progress?: IProgress<IProgressStep>): Promise<MarkdownExportReturnType>;
    /**
     * TODO: OPTIMIZE
     * Currently, this can take anywhere between 30ms to 1300ms to execute on one document.
     * Also does not work well in parallel. Need to do some profiling work
     */
    renderNote({ note, config, }: {
        note: NoteProps;
        config: DendronConfig;
    }): Promise<string>;
    dot2Slash(fname: string): string;
    static config(): JSONSchemaType<MarkdownV2PodConfig>;
}
