"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsNonDendronUri = exports.uriRegex = void 0;
exports.isWebUri = isWebUri;
exports.isVSCodeCommandUri = isVSCodeCommandUri;
const lodash_1 = __importDefault(require("lodash"));
/** Kind-of parses a URI and extracts the scheme. Not an actual parser and will accept invalid URIs. */
exports.uriRegex = /^(?<scheme>[\w+.-]+):(\/\/)?\S+/;
/** Returns true if this is a non-dendron uri, false if it is dendron://, undefined if it's not a URI */
const containsNonDendronUri = (uri) => {
    const groups = exports.uriRegex.exec(uri)?.groups;
    if (lodash_1.default.isUndefined(groups) || lodash_1.default.isUndefined(groups.scheme))
        return undefined;
    if (groups.scheme === "dendron")
        return false;
    return true;
};
exports.containsNonDendronUri = containsNonDendronUri;
function isWebUri(uri) {
    const scheme = uri.match(exports.uriRegex)?.groups?.scheme;
    if (scheme === "http" || scheme === "https")
        return true;
    return false;
}
/**
 * Given a uri, determine if it is a [command uri](https://code.visualstudio.com/api/extension-guides/command#command-uris)
 * Command uris have the following scheme
 * `command:{uri}`
 */
function isVSCodeCommandUri(uri) {
    const scheme = uri.match(exports.uriRegex)?.groups?.scheme;
    if (scheme === "command")
        return true;
    return false;
}
//# sourceMappingURL=regex.js.map