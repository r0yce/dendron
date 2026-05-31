import { DendronConfig, DendronError, DHookEntry, DHookType, NoteProps } from "@dendronhq/common-all";
export type RequireHookResp = {
    note: NoteProps;
    payload?: any;
};
export declare class HookUtils {
    static addToConfig({ config, hookType, hookEntry, }: {
        config: DendronConfig;
        hookType: DHookType;
        hookEntry: DHookEntry;
    }): DendronConfig;
    static getHookDir(wsRoot: string): string;
    static getHookScriptPath({ wsRoot, basename, }: {
        basename: string;
        wsRoot: string;
    }): string;
    static removeFromConfig({ config, hookType, hookId, }: {
        config: DendronConfig;
        hookType: DHookType;
        hookId: string;
    }): DendronConfig;
    static requireHook: ({ note, fpath, wsRoot, }: {
        note: NoteProps;
        fpath: string;
        wsRoot: string;
    }) => Promise<RequireHookResp>;
    static validateHook: ({ hook, wsRoot, }: {
        hook: DHookEntry;
        wsRoot: string;
    }) => {
        error: DendronError<import("@dendronhq/common-all").StatusCodes | undefined>;
        valid: boolean;
    } | {
        error: null;
        valid: boolean;
    };
}
