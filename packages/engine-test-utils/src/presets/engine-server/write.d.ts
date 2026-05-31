import { TestPresetEntryV4 } from "@dendronhq/common-test-utils";
export declare const ENGINE_WRITE_PRESETS: {
    NOTES: {
        NOTE_NO_CHILDREN: TestPresetEntryV4;
        NOTE_UPDATE_CHILDREN: TestPresetEntryV4;
        NOTE_WITH_TARGET: TestPresetEntryV4;
        UPDATE_NOTE_ADD_BACKLINK: TestPresetEntryV4;
        UPDATE_NOTE_REMOVE_BACKLINK: TestPresetEntryV4;
        UPDATE_NOTE_UPDATE_BACKLINK: TestPresetEntryV4;
        CUSTOM_ATT: TestPresetEntryV4;
        CUSTOM_ATT_ADD: TestPresetEntryV4;
        NEW_DOMAIN: TestPresetEntryV4;
        MATCH_SCHEMA: TestPresetEntryV4;
        MATCH_SCHEMA_UPDATE_NOTE: TestPresetEntryV4;
        DOMAIN_STUB: TestPresetEntryV4;
        GRANDCHILD_OF_ROOT_AND_CHILD_IS_STUB: TestPresetEntryV4;
        CHILD_OF_DOMAIN: TestPresetEntryV4;
        GRANDCHILD_OF_DOMAIN_AND_CHILD_IS_STUB: TestPresetEntryV4;
        TITLE_MATCHES_TITLE_CASE: TestPresetEntryV4;
        TITLE_WITH_DASH: TestPresetEntryV4;
    };
    SCHEMAS: {
        ADD_NEW_SCHEMA: TestPresetEntryV4;
        ADD_NEW_MODULE_NO_CHILD: TestPresetEntryV4;
        ADD_NEW_MODULE: TestPresetEntryV4;
    };
};
export declare const ENGINE_WRITE_PRESETS_MULTI: {
    NOTES: {
        NEW_DOMAIN: TestPresetEntryV4;
        NEW_DOMAIN_WITH_FULL_PATH_VAULT: TestPresetEntryV4;
        ID_UPDATED: TestPresetEntryV4;
        BODY_UPDATED: TestPresetEntryV4;
    };
    SCHEMAS: {};
};
