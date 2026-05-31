import { SeedRegistryDict } from "@dendronhq/common-all";
type SeedCommandOpts = {
    id: string;
};
export declare class SeedRegistry {
    registry: SeedRegistryDict;
    static create(opts?: {
        registryFile?: string;
    }): SeedRegistry;
    constructor(registry: SeedRegistryDict);
    info({ id }: SeedCommandOpts): import("@dendronhq/common-all").SeedConfig | undefined;
}
export {};
