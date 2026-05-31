export declare class TestHookUtils {
    static genBadJsHookPayload: () => string;
    static genJsHookPayload: (canary: string) => string;
    static writeJSHook: ({ wsRoot, fname, canary, hookPayload, }: {
        wsRoot: string;
        fname: string;
        canary?: string;
        hookPayload?: string;
    }) => void;
}
