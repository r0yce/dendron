import "reflect-metadata";
import { DVault } from "@dendronhq/common-all";
import { EngineAPIService } from "../services/EngineAPIService";
export declare function setupLocalExtContainer(opts: {
    wsRoot: string;
    vaults: DVault[];
    engine: EngineAPIService;
}): Promise<void>;
