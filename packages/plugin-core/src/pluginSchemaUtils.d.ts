/**
 * Wrapper around SchemaUtils which can fills out values available in the
 * plugin (primarily the engine)
 */
export declare class PluginSchemaUtils {
    static doesSchemaExist(id: string): Promise<boolean>;
    static getSchema(id: string): Promise<import("@dendronhq/common-all").GetSchemaResp>;
}
