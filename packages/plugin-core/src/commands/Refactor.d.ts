import fs from "fs-extra";
import { BasicCommand } from "./base";
export type RefactorCommandOpts = {
    dryRun?: boolean;
    exclude?: string[];
    include?: string[];
    /**
     * Perform up to limit changes
     */
    limit?: number;
    root: string;
    rules: string[];
};
type RefactorRule = {
    name: string;
    matcher: RegExp;
    fmOnly?: boolean;
    replacer: (match: RegExpMatchArray | null, txt: string) => {
        txtClean: string;
        diff: any;
    };
    opts?: {
        matchIfNull: boolean;
    };
};
export declare const RULES: {
    ADD_FM_BLOCK: string;
    ADD_FM_ID: string;
    REMOVE_FM_BRACKETS: string;
    ADD_LAYOUT: string;
};
export declare abstract class RefactorBaseCommand<TFile, TMatchData> extends BasicCommand<RefactorCommandOpts> {
    props: Required<RefactorCommandOpts>;
    constructor(name: string, opts: RefactorCommandOpts);
    abstract readFile(fpath: string): TFile;
    abstract writeFile(fpath: string, data: TFile): void;
    cleanOpts(opts: RefactorCommandOpts): NonNullable<{
        include: string[];
        exclude: never[];
        dryRun: boolean;
        limit: number;
    } & RefactorCommandOpts>;
    getFiles(opts: Required<Pick<RefactorCommandOpts, "root" | "exclude" | "include">>): Promise<fs.Dirent<string>[]>;
    abstract matchFile(file: TFile): {
        isMatch: boolean;
        matchData?: TMatchData;
    };
    abstract refactorFile(file: TFile, matchData?: TMatchData): TFile;
    execute(): Promise<void[]>;
}
export declare class RefactorCommand extends BasicCommand<RefactorCommandOpts> {
    key: string;
    rules: {
        [key: string]: RefactorRule;
    };
    constructor();
    getFiles(opts: Required<Pick<RefactorCommandOpts, "root" | "exclude" | "include">>): Promise<fs.Dirent<string>[]>;
    _registerRules(): void;
    applyMatch(txt: string, rule: RefactorRule): {
        txtClean: string;
        diff: any;
    } | null;
    execute(opts: RefactorCommandOpts): Promise<void>;
}
export declare function main(): Promise<void>;
export {};
