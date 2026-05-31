"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRunnableNotionV2PodConfig = isRunnableNotionV2PodConfig;
exports.createRunnableNotionV2PodConfigSchema = createRunnableNotionV2PodConfigSchema;
/**
 * Helper function to perform a type check on an object to see if it's an
 * instance of {@link RunnableNotionV2PodConfig}
 * @param object
 * @returns
 */
function isRunnableNotionV2PodConfig(object) {
    return (object !== undefined &&
        "apiKey" in object &&
        "exportScope" in object &&
        "parentPageId" in object);
}
function createRunnableNotionV2PodConfigSchema() {
    return {
        type: "object",
        required: ["apiKey", "exportScope", "parentPageId"],
        properties: {
            apiKey: {
                type: "string",
            },
            exportScope: {
                type: "string",
            },
            parentPageId: {
                type: "string",
            },
        },
    };
}
//# sourceMappingURL=NotionPodConfig.js.map