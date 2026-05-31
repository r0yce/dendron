import { SeedService } from "@dendronhq/engine-server";
import sinon from "sinon";
import { SeedAddCommand } from "../../commands/SeedAddCommand";
import { SeedRemoveCommand } from "../../commands/SeedRemoveCommand";
export declare class PluginTestSeedUtils {
    static getFakedAddCommand(svc: SeedService): {
        cmd: SeedAddCommand;
        fakedOnUpdating: sinon.SinonSpy<any[], any>;
        fakedOnUpdated: sinon.SinonSpy<any[], any>;
    };
    static getFakedRemoveCommand(svc: SeedService): {
        cmd: SeedRemoveCommand;
        fakedOnUpdating: sinon.SinonSpy<any[], any>;
        fakedOnUpdated: sinon.SinonSpy<any[], any>;
    };
}
