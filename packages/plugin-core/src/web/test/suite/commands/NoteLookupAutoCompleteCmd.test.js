"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const NoteLookupAutoCompleteCommand_1 = require("../../../../commands/common/NoteLookupAutoCompleteCommand");
const assert_1 = __importDefault(require("assert"));
suite("GIVEN a NoteLookupAutoCompleteCommand", () => {
    test("WHEN the command is run, THEN subscribed callbacks are invoked", async () => {
        const emitter = new vscode_1.EventEmitter();
        let callbackFired = false;
        emitter.event(() => {
            callbackFired = true;
        });
        const cmd = new NoteLookupAutoCompleteCommand_1.NoteLookupAutoCompleteCommand(emitter);
        cmd.run();
        (0, assert_1.default)(callbackFired);
    });
});
//# sourceMappingURL=NoteLookupAutoCompleteCmd.test.js.map