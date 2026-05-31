"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteLookupAutoCompleteCommand = void 0;
const constants_1 = require("../../constants");
const AutoCompletableRegistrar_1 = require("../../utils/registers/AutoCompletableRegistrar");
const base_1 = require("../base");
class NoteLookupAutoCompleteCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.LOOKUP_NOTE_AUTO_COMPLETE.key;
    async gatherInputs() {
        return {};
    }
    async execute() {
        AutoCompletableRegistrar_1.AutoCompletableRegistrar.fire();
    }
}
exports.NoteLookupAutoCompleteCommand = NoteLookupAutoCompleteCommand;
//# sourceMappingURL=NoteLookupAutoCompleteCommand.js.map