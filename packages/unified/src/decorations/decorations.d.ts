import { DendronError, DEngine, Diagnostic, GetDecorationsOpts, IDendronError, DendronConfig, NoteProps } from "@dendronhq/common-all";
import { Decoration } from "./utils";
/** Get all decorations within the visible ranges for given note. */
export declare function runAllDecorators(opts: Omit<GetDecorationsOpts, "id"> & {
    note: NoteProps;
    engine: DEngine;
    config: DendronConfig;
}): Promise<{
    errors: DendronError<import("@dendronhq/common-all").StatusCodes | undefined>[];
    allDecorations?: never;
    allDiagnostics?: never;
    allErrors?: never;
} | {
    allDecorations: Decoration[];
    allDiagnostics: Diagnostic[];
    allErrors: IDendronError[];
    errors?: never;
}>;
