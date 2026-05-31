import { DVault, SchemaModuleProps } from "@dendronhq/common-all";
type CreateSchemaPresetOptsV4 = {
    wsRoot: string;
    vault: DVault;
    genRandomId?: boolean;
    fname?: string;
    noWrite?: boolean;
    modifier?: (schema: SchemaModuleProps) => SchemaModuleProps;
};
export declare const SCHEMA_PRESETS_V4: {
    SCHEMA_SIMPLE: {
        create: ({ vault, wsRoot, noWrite }: CreateSchemaPresetOptsV4) => Promise<SchemaModuleProps>;
        fname: string;
    };
    SCHEMA_SIMPLE_OTHER: {
        create: ({ vault, wsRoot, noWrite }: CreateSchemaPresetOptsV4) => Promise<SchemaModuleProps>;
        fname: string;
    };
    SCHEMA_SIMPLE_OTHER_NO_CHILD: {
        create: ({ vault, wsRoot, noWrite }: CreateSchemaPresetOptsV4) => Promise<SchemaModuleProps>;
        fname: string;
    };
    SCHEMA_DOMAIN_NAMESPACE: {
        create: ({ vault, wsRoot, noWrite }: CreateSchemaPresetOptsV4) => Promise<SchemaModuleProps>;
        fname: string;
    };
    BAD_SCHEMA: {
        create: ({ vault, wsRoot }: CreateSchemaPresetOptsV4) => void;
        fname: string;
    };
};
export {};
