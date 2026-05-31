export declare const PLUGIN_CORE: {
    LOOKUP_SINGLE_TEST_PRESET: {
        UPDATE_ITEMS: {
            SCHEMA_SUGGESTION: import("../..").TestPresetEntry<{
                vault: import("@dendronhq/common-all").DVault;
            }, any, {
                items: import("@dendronhq/common-all").NoteProps;
            }>;
        };
        ACCEPT_ITEMS: {
            EXISTING_ITEM: import("../..").TestPresetEntry<unknown, any, {
                activeFileName: string;
                activeNote: import("@dendronhq/common-all").NoteProps;
            }>;
        };
    };
};
