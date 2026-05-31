import { DVault, DendronConfig, NoteDicts, NoteProps, ReducedDEngine } from "@dendronhq/common-all";
/**
 * For a given note to process with unified, this function determines all
 * NoteProp dependencies that will be needed in order to parse/render the note.
 * It then creates a set of NoteDicts containing all dependencies and returns
 * it. Any nested/recursive dependencies, such as with note references, will
 * also be included.
 * @param noteToProcess
 * @param engine
 * @param config
 * @param vaults
 * @returns
 */
export declare function getParsingDependencyDicts(noteToProcess: NoteProps, engine: ReducedDEngine, config: DendronConfig, vaults: DVault[]): Promise<NoteDicts>;
