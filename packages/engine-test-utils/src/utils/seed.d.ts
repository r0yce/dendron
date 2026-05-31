import { DEngineClient, SeedConfig } from "@dendronhq/common-all";
export declare class TestSeedUtils {
    static defaultSeedId: () => string;
    static addSeed2WS({ wsRoot, engine, modifySeed, }: {
        wsRoot: string;
        engine: DEngineClient;
        modifySeed?: (seed: SeedConfig) => SeedConfig;
    }): Promise<void>;
    static createSeedRegistry(opts: {
        engine: DEngineClient;
        wsRoot: string;
        modifySeed?: (seed: SeedConfig) => SeedConfig;
    }): Promise<{
        registryFile: string;
        seedDict: {
            [x: string]: SeedConfig;
        };
    }>;
    static createSeed(opts: {
        engine: DEngineClient;
        wsRoot: string;
    }): Promise<SeedConfig>;
}
