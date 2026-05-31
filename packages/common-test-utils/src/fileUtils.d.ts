import { DVault } from "@dendronhq/common-all";
import { DirResult } from "@dendronhq/common-server";
export { DirResult };
export type FileItem = {
    path: string;
    body?: string;
};
export declare class FileTestUtils {
    /**
     * Compare files in root with expected
     * @param root
     * @param expected
     * @param opts
     * @return [actualFiles, expectedFiles]
     */
    static cmpFiles: (root: string, expected: string[], opts?: {
        add?: string[];
        remove?: string[];
        ignore?: string[];
    }) => string[][];
    /**
     *
     * @param root
     * @param expected
     * @param opts
     * @returns true if expected and root are equal
     */
    static cmpFilesV2: (root: string, expected: string[], opts?: {
        add?: string[];
        remove?: string[];
        ignore?: string[];
    }) => boolean;
    static assertInFile: ({ fpath, match, nomatch, }: {
        match?: string[];
        nomatch?: string[];
        fpath: string;
    }) => Promise<boolean>;
    static assertTimesInFile: ({ fpath, match, fewerThan, moreThan, }: {
        match?: [number, string | RegExp][];
        fewerThan?: [number, string | RegExp][];
        moreThan?: [number, string | RegExp][];
        fpath: string;
    }) => Promise<boolean>;
    static assertInVault: ({ vault, wsRoot, match, nomatch, }: {
        match?: string[];
        nomatch?: string[];
        vault: DVault;
        wsRoot: string;
    }) => Promise<boolean>;
    static createFiles(root: string, files: FileItem[]): Promise<void[]>;
    static getPkgRoot(base: string, fname?: string): string;
    static tmpDir(): DirResult;
}
