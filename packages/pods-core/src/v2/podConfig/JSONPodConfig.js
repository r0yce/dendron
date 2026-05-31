"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRunnableJSONV2PodConfig = isRunnableJSONV2PodConfig;
exports.createRunnableJSONV2PodConfigSchema = createRunnableJSONV2PodConfigSchema;
/**
 * Helper function to perform a type check on an object to see if it's an
 * instance of {@link RunnableJSONV2PodConfig}
 * @param object
 * @returns
 */
function isRunnableJSONV2PodConfig(object) {
    return (object !== undefined && "destination" in object && "exportScope" in object);
}
/**
 *
 * @returns
 * creates an AJV schema for runnable config
 */
function createRunnableJSONV2PodConfigSchema() {
    return {
        type: "object",
        required: ["destination", "exportScope"],
        properties: {
            destination: {
                type: "string",
            },
            exportScope: {
                type: "string",
            },
        },
    };
}
//# sourceMappingURL=JSONPodConfig.js.map