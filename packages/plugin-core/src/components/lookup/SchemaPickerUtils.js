"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaPickerUtils = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const logger_1 = require("../../logger");
const constants_1 = require("./constants");
const NotePickerUtils_1 = require("./NotePickerUtils");
const utils_1 = require("./utils");
class SchemaPickerUtils {
    static async fetchPickerResultsWithCurrentValue({ picker, }) {
        const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const resp = await engine.querySchema(picker.value);
        if (resp.data && resp.data.length > 0) {
            const node = common_all_1.SchemaUtils.getModuleRoot(resp.data[0]);
            if (node.fname === picker.value) {
                return [
                    common_all_1.DNodeUtils.enhancePropForQuickInputV3({
                        wsRoot,
                        props: node,
                        schema: node.schema
                            ? (await engine.getSchema(node.schema.moduleId)).data
                            : undefined,
                        vaults,
                    }),
                ];
            }
        }
        return [
            NotePickerUtils_1.NotePickerUtils.createNoActiveItem({
                fname: picker.value,
                detail: constants_1.CREATE_NEW_SCHEMA_DETAIL,
            }),
        ];
    }
    static async fetchPickerResults(opts) {
        const ctx = "SchemaPickerUtils:fetchPickerResults";
        const start = process.hrtime();
        const { picker, qs } = opts;
        const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const resp = await engine.querySchema(qs);
        let nodes = [];
        if (resp.data) {
            nodes = resp.data.map((ent) => common_all_1.SchemaUtils.getModuleRoot(ent));
        }
        if (nodes.length > NotePickerUtils_1.PAGINATE_LIMIT) {
            picker.allResults = nodes;
            picker.offset = NotePickerUtils_1.PAGINATE_LIMIT;
            picker.moreResults = true;
            nodes = nodes.slice(0, NotePickerUtils_1.PAGINATE_LIMIT);
        }
        else {
            utils_1.PickerUtilsV2.resetPaginationOpts(picker);
        }
        const updatedItems = await Promise.all(nodes.map(async (ent) => common_all_1.DNodeUtils.enhancePropForQuickInputV3({
            wsRoot,
            props: ent,
            schema: ent.schema
                ? (await engine.getSchema(ent.schema.moduleId)).data
                : undefined,
            vaults,
            alwaysShow: picker.alwaysShowAll,
        })));
        const profile = (0, common_server_1.getDurationMilliseconds)(start);
        logger_1.Logger.info({ ctx, msg: "engine.querySchema", profile });
        return updatedItems;
    }
}
exports.SchemaPickerUtils = SchemaPickerUtils;
//# sourceMappingURL=SchemaPickerUtils.js.map