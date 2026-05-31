"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRunnableGoogleDocsV2PodConfig = isRunnableGoogleDocsV2PodConfig;
exports.createRunnableGoogleDocsV2PodConfigSchema = createRunnableGoogleDocsV2PodConfigSchema;
/**
 * Helper function to perform a type check on an object to see if it's an
 * instance of {@link RunnableGoogleDocsV2PodConfig}
 * @param object
 * @returns
 */
function isRunnableGoogleDocsV2PodConfig(object) {
    return (object !== undefined &&
        object.accessToken &&
        object.refreshToken &&
        object.expirationTime &&
        object.exportScope &&
        object.connectionId);
}
function createRunnableGoogleDocsV2PodConfigSchema() {
    return {
        type: "object",
        required: [
            "accessToken",
            "refreshToken",
            "expirationTime",
            "exportScope",
            "connectionId",
        ],
        properties: {
            accessToken: {
                type: "string",
            },
            refreshToken: {
                type: "string",
            },
            expirationTime: {
                type: "number",
            },
            connectionId: {
                type: "string",
            },
            exportScope: {
                type: "string",
            },
            parentFolderId: {
                type: "string",
                nullable: true,
            },
        },
    };
}
//# sourceMappingURL=GoogleDocsConfig.js.map