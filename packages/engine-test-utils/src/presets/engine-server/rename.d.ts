import { TestPresetEntryV4 } from "@dendronhq/common-test-utils";
export declare const ENGINE_RENAME_PRESETS: {
    NOTES: {
        NO_UPDATE: TestPresetEntryV4;
        NO_UPDATE_NUMBER_IN_FM: TestPresetEntryV4;
        NO_UPDATE_DOUBLE_QUOTE_IN_FM: TestPresetEntryV4;
        WITH_INLINE_CODE: TestPresetEntryV4;
        WITH_ALIAS: TestPresetEntryV4;
        UPDATES_DEFAULT_ALIAS: TestPresetEntryV4;
        MULTIPLE_LINKS: TestPresetEntryV4;
        XVAULT_LINK: TestPresetEntryV4;
        RELATIVE_LINK: TestPresetEntryV4;
        NOTE_REF: TestPresetEntryV4;
        NOTE_REF_WITH_HEADER: TestPresetEntryV4;
        NOTE_REF_WITH_ANCHOR: TestPresetEntryV4;
        NOTE_REF_WITH_RANGE: TestPresetEntryV4;
        NOTE_REF_WITH_RANGE_WILDCARD_OFFSET: TestPresetEntryV4;
        NOTE_REF_WITH_RANGE_BLOCK_ANCHOR: TestPresetEntryV4;
        RENAME_FOR_CACHE: TestPresetEntryV4;
        DOMAIN_NO_CHILDREN: TestPresetEntryV4;
        SINGLE_NOTE_DEEP_IN_DOMAIN: TestPresetEntryV4;
        SCRATCH_NOTE: TestPresetEntryV4;
        DOMAIN_DIFF_TITLE: TestPresetEntryV4;
        LINK_AT_ROOT: TestPresetEntryV4;
        TARGET_IN_VAULT1_AND_LINK_IN_VAULT2: TestPresetEntryV4;
        NOTE_REF_XVAULT: TestPresetEntryV4;
        NOTE_REF_XVAULT_VAULT_CHANGE: TestPresetEntryV4;
        TARGET_IN_VAULT2_AND_LINK_IN_VAULT2: TestPresetEntryV4;
        TARGET_IN_VAULT2_AND_LINK_IN_VAULT1: TestPresetEntryV4;
        NOTE_WITHOUT_ID: TestPresetEntryV4;
        HASHTAG: TestPresetEntryV4;
        USERTAG: TestPresetEntryV4;
        FRONTMATTER_TAG_SINGLE: TestPresetEntryV4;
        FRONTMATTER_TAG_MULTI: TestPresetEntryV4;
        FRONTMATTER_TAG_SINGLE_REMOVE: TestPresetEntryV4;
        FRONTMATTER_TAG_MULTI_REMOVE: TestPresetEntryV4;
        /**
         * - pre:init
         *    - note A without body
         * - post:init
         *    - note A is updated with link to note B
         *    - note B is written
         *    - note B is re-written
         * - expect
         *    - note A should be updated
         */
        NOTE_WITH_STUB_CHILD: TestPresetEntryV4;
    };
    SCHEMAS: {};
};
