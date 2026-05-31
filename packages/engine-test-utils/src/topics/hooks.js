"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestHookUtils = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const engine_server_1 = require("@dendronhq/engine-server");
class TestHookUtils {
    static genBadJsHookPayload = () => `module.exports = async function({note, execa}) {
    note.body = note.body + " hello";
    return note;
};
`;
    static genJsHookPayload = (canary) => `module.exports = async function({note, execa}) {
    note.body = note.body + " ${canary}";
    return {note};
};
`;
    static writeJSHook = ({ wsRoot, fname, canary, hookPayload, }) => {
        canary = canary || "hello";
        hookPayload = hookPayload || TestHookUtils.genJsHookPayload(canary);
        const hookDir = engine_server_1.HookUtils.getHookDir(wsRoot);
        const hookPath = path_1.default.join(hookDir, `${fname}.js`);
        fs_extra_1.default.ensureFileSync(hookPath);
        fs_extra_1.default.writeFileSync(hookPath, hookPayload);
    };
}
exports.TestHookUtils = TestHookUtils;
//# sourceMappingURL=hooks.js.map