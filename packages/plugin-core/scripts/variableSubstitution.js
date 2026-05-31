"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const global_1 = require("../src/types/global");
/**
 * Workaround to substitute values for global consts during vsix packaging
 */
// @ts-ignore
function main() {
    const pathToUpdate = "./out/src/types/global.js";
    const globalfile = fs_extra_1.default.readFileSync(pathToUpdate);
    if (undefined === process.env.GOOGLE_OAUTH_CLIENT_ID) {
        console.log("Unable to find envrionment variable GOOGLE_OAUTH_CLIENT_ID. Placeholder value will be used.");
    }
    if (undefined === process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
        console.log("Unable to find envrionment variable GOOGLE_OAUTH_CLIENT_SECRET. Placeholder value will be used.");
    }
    const clientId = undefined !== process.env.GOOGLE_OAUTH_CLIENT_ID
        ? process.env.GOOGLE_OAUTH_CLIENT_ID
        : global_1.GOOGLE_OAUTH_ID;
    const secret = undefined !== process.env.GOOGLE_OAUTH_CLIENT_SECRET
        ? process.env.GOOGLE_OAUTH_CLIENT_SECRET
        : global_1.GOOGLE_OAUTH_SECRET;
    const outputFile = globalfile
        .toString()
        .replace(global_1.GOOGLE_OAUTH_ID, clientId)
        .replace(global_1.GOOGLE_OAUTH_SECRET, secret);
    fs_extra_1.default.writeFileSync(pathToUpdate, outputFile);
}
main();
//# sourceMappingURL=variableSubstitution.js.map