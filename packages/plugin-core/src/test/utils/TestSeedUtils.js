"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginTestSeedUtils = void 0;
const sinon_1 = __importDefault(require("sinon"));
const SeedAddCommand_1 = require("../../commands/SeedAddCommand");
const SeedRemoveCommand_1 = require("../../commands/SeedRemoveCommand");
class PluginTestSeedUtils {
    static getFakedAddCommand(svc) {
        const cmd = new SeedAddCommand_1.SeedAddCommand(svc);
        const fakedOnUpdating = sinon_1.default.fake.resolves(null);
        const fakedOnUpdated = sinon_1.default.fake.resolves(null);
        sinon_1.default.replace(cmd, "onUpdatingWorkspace", fakedOnUpdating);
        sinon_1.default.replace(cmd, "onUpdatedWorkspace", fakedOnUpdated);
        return { cmd, fakedOnUpdating, fakedOnUpdated };
    }
    static getFakedRemoveCommand(svc) {
        const cmd = new SeedRemoveCommand_1.SeedRemoveCommand(svc);
        const fakedOnUpdating = sinon_1.default.fake.resolves(null);
        const fakedOnUpdated = sinon_1.default.fake.resolves(null);
        sinon_1.default.replace(cmd, "onUpdatingWorkspace", fakedOnUpdating);
        sinon_1.default.replace(cmd, "onUpdatedWorkspace", fakedOnUpdated);
        return { cmd, fakedOnUpdating, fakedOnUpdated };
    }
}
exports.PluginTestSeedUtils = PluginTestSeedUtils;
//# sourceMappingURL=TestSeedUtils.js.map