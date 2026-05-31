import { DendronConfig } from "@dendronhq/common-all";
export declare class TestConfigUtils {
    static getConfig: (opts: {
        wsRoot: string;
    }) => DendronConfig;
    static withConfig: (func: (config: DendronConfig) => DendronConfig, opts: {
        wsRoot: string;
    }) => DendronConfig;
    static writeConfig: (opts: {
        config: DendronConfig;
        wsRoot: string;
    }) => void;
}
