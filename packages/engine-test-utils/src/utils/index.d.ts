import { WorkspaceOpts } from "@dendronhq/common-all";
export * from "./git";
export * from "./seed";
export * from "./unified";
export declare function checkString(body: string, ...match: string[]): Promise<void>;
export declare function checkDir({ fpath, snapshot }: {
    fpath: string;
    snapshot?: boolean;
    msg?: string;
}, ...match: string[]): Promise<void>;
export declare function checkNotInDir({ fpath, snapshot }: {
    fpath: string;
    snapshot?: boolean;
    msg?: string;
}, ...match: string[]): Promise<void>;
export declare function checkFile({ fpath, snapshot, nomatch, }: {
    fpath: string;
    snapshot?: boolean;
    nomatch?: string[];
}, ...match: string[]): Promise<true | void>;
export declare function checkNotInString(body: string, ...nomatch: string[]): Promise<void>;
/** The regular version of this only works in engine tests. If the test has to run in the plugin too, use this version. Make sure to check the return value! */
export declare function checkFileNoExpect({ fpath, nomatch, match, }: {
    fpath: string;
    nomatch?: string[];
    match?: string[];
}): Promise<boolean>;
export declare function checkVaults(opts: WorkspaceOpts, expect: any): Promise<void>;
