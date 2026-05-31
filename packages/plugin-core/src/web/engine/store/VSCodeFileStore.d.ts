import { DendronError, GetAllFilesOpts, IFileStore, RespV2, RespV3, URI } from "@dendronhq/common-all";
import * as vscode from "vscode";
export declare class VSCodeFileStore implements IFileStore {
    read(uri: URI): Promise<RespV3<string>>;
    readDir(opts: GetAllFilesOpts): Promise<RespV3<string[]>>;
    write(uri: URI, content: string): Promise<RespV3<URI>>;
    delete(uri: URI): Promise<RespV3<URI>>;
    rename(oldUri: URI, newUri: URI): Promise<RespV3<URI>>;
}
/** Gets all files in `root`, with include and exclude lists (glob matched)
 * Implemented this function again here from common-server.
 */
export declare function getAllFiles(opts: GetAllFilesOpts): Promise<RespV2<string[]>>;
export declare function getAllFilesWithTypes(opts: GetAllFilesOpts): Promise<{
    data: [string, vscode.FileType][];
    error: null;
} | {
    error: DendronError<import("@dendronhq/common-all").StatusCodes | undefined>;
    data?: never;
}>;
