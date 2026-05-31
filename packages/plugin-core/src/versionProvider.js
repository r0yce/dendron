"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionProvider = void 0;
const vsCodeUtils_1 = require("./vsCodeUtils");
const common_server_1 = require("@dendronhq/common-server");
const vscode_1 = __importDefault(require("vscode"));
const constants_1 = require("./constants");
const lodash_1 = __importDefault(require("lodash"));
/**
 * @deprecated - use vscode.ExtensionContext.extension.packageJSON.version instead.
 */
class VersionProvider {
    static version() {
        let version;
        if (vsCodeUtils_1.VSCodeUtils.isDevMode()) {
            version = common_server_1.NodeJSUtils.getVersionFromPkg();
        }
        else {
            try {
                const dendronExtension = vscode_1.default.extensions.getExtension(constants_1.extensionQualifiedId);
                version = dendronExtension.packageJSON.version;
            }
            catch (err) {
                version = common_server_1.NodeJSUtils.getVersionFromPkg();
            }
        }
        if (lodash_1.default.isUndefined(version)) {
            version = "0.0.0";
        }
        return version;
    }
}
exports.VersionProvider = VersionProvider;
//# sourceMappingURL=versionProvider.js.map