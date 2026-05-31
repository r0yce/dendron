"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginSchemaUtils = void 0;
const common_all_1 = require("@dendronhq/common-all");
const ExtensionProvider_1 = require("./ExtensionProvider");
/**
 * Wrapper around SchemaUtils which can fills out values available in the
 * plugin (primarily the engine)
 */
class PluginSchemaUtils {
    static doesSchemaExist(id) {
        const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        return common_all_1.SchemaUtils.doesSchemaExist({
            id,
            engine,
        });
    }
    static async getSchema(id) {
        return ExtensionProvider_1.ExtensionProvider.getEngine().getSchema(id);
    }
}
exports.PluginSchemaUtils = PluginSchemaUtils;
//# sourceMappingURL=pluginSchemaUtils.js.map