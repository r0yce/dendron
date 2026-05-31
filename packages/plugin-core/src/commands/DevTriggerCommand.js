"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevTriggerCommand = void 0;
const constants_1 = require("../constants");
const base_1 = require("./base");
/**
 * Command to be used for development purposes only.
 *
 * Main use case: place some piece of code to test its behavior and be able
 * to easily trigger to run that piece of code.
 * */
class DevTriggerCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.DEV_TRIGGER.key;
    async gatherInputs() {
        return {};
    }
    async execute() {
        // Place to add some temporary piece of code for development.
        // Please remember to remove the added code prior to pushing.
    }
}
exports.DevTriggerCommand = DevTriggerCommand;
//# sourceMappingURL=DevTriggerCommand.js.map