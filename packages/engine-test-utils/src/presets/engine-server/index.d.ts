import { ENGINE_CONFIG_PRESETS } from "./config";
import { ENGINE_QUERY_PRESETS } from "./query";
import { ENGINE_RENAME_PRESETS } from "./rename";
import { ENGINE_WRITE_PRESETS } from "./write";
import { TestPresetEntryV4 } from "@dendronhq/common-test-utils";
export { ENGINE_HOOKS, ENGINE_HOOKS_BASE, ENGINE_HOOKS_MULTI } from "./utils";
export { ENGINE_RENAME_PRESETS };
export { ENGINE_QUERY_PRESETS };
export { ENGINE_WRITE_PRESETS };
export { ENGINE_CONFIG_PRESETS };
export declare const ENGINE_SERVER: {
    NOTE_REF: {
        WILDCARD_LINK_V4: TestPresetEntryV4;
    };
    ENGINE_WRITE_PRESETS: {
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
    ENGINE_INIT_PRESETS: {
        NOTES: {
            VAULT_WORKSPACE: TestPresetEntryV4;
            VAULT_WORKSPACE_W_SAME_VAULT_NAME: TestPresetEntryV4;
            BASIC: TestPresetEntryV4;
            FIND: TestPresetEntryV4;
            NOTE_TOO_LONG: TestPresetEntryV4;
            NOTE_TOO_LONG_CONFIG: TestPresetEntryV4;
            MIXED_CASE_PARENT: TestPresetEntryV4;
            LINKS: TestPresetEntryV4;
            DOMAIN_STUB: TestPresetEntryV4;
            NOTE_WITH_CUSTOM_ATT: TestPresetEntryV4;
            BAD_PARSE: TestPresetEntryV4;
        };
        SCHEMAS: {
            BASICS: TestPresetEntryV4;
            BAD_SCHEMA: TestPresetEntryV4;
        };
    };
    ENGINE_DELETE_PRESETS: {
        NOTES: {
            GRANDCHILD_WITH_ALL_STUB_PARENTS: TestPresetEntryV4;
            NOTE_NO_CHILDREN: TestPresetEntryV4;
            NOTE_WITH_TARGET: TestPresetEntryV4;
            DOMAIN_CHILDREN: TestPresetEntryV4;
            DOMAIN_NO_CHILDREN: TestPresetEntryV4;
            STALE_CACHE_ENTRY: TestPresetEntryV4;
            MULTIPLE_DELETES: TestPresetEntryV4;
        };
        SCHEMAS: {
            BASIC: TestPresetEntryV4;
        };
    };
    ENGINE_INFO_PRESETS: {
        NOTES: {
            BASIC: TestPresetEntryV4;
        };
    };
    ENGINE_RENAME_PRESETS: {
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
            NOTE_WITH_STUB_CHILD: TestPresetEntryV4;
        };
        SCHEMAS: {};
    };
    ENGINE_GET_NOTE_BLOCKS_PRESETS: {
        NOTES: {
            NOTE_REF: TestPresetEntryV4;
        };
        SCHEMAS: {};
    };
    ENGINE_QUERY_PRESETS: {
        NOTES: {
            EMPTY_QS: TestPresetEntryV4;
            MISSING_QUERY: TestPresetEntryV4;
            STAR_QUERY: TestPresetEntryV4;
            DOMAIN_QUERY_WITH_SCHEMA: TestPresetEntryV4;
            CHILD_QUERY_WITH_SCHEMA: TestPresetEntryV4;
        };
        SCHEMAS: {
            STAR_QUERY: TestPresetEntryV4;
            SIMPLE: TestPresetEntryV4;
        };
    };
    ENGINE_BULK_WRITE_NOTES_PRESETS: {
        NOTES: {
            BASIC: TestPresetEntryV4;
        };
        SCHEMAS: {};
    };
    ENGINE_RENDER_PRESETS: {
        NOTES: {
            BASIC: TestPresetEntryV4;
            EMPTY_NOTE: TestPresetEntryV4;
            CUSTOM_FM: TestPresetEntryV4;
            NOTE_REF_TO_TASK_NOTE: TestPresetEntryV4;
            UPDATED_NOTE_REF: TestPresetEntryV4;
        };
    };
};
type TestPresetEntry = TestPresetEntryV4;
type TestPresetDict = {
    [key: string]: TestPresetEntry;
};
/**
 *
 @example
 *  test("", async () => {
 *    const TestCase= getPreset({presets: ENGINE_PRESETS, nodeType, presetName: "init", key: 'BAD_SCHEMA'})
 *    const { testFunc, ...opts } = TestCase;;
 *    await runEngineTestV5(testFunc, { ...opts, expect });
 *});
 * @param param0
 * @returns
 */
export declare const getPreset: ({ presets, presetName, nodeType, key, }: {
    presets: typeof ENGINE_PRESETS;
    presetName: string;
    nodeType: "SCHEMAS" | "NOTES";
    key: string;
}) => any;
export declare const getPresetMulti: ({ presets, presetName, nodeType, key, }: {
    presets: typeof ENGINE_PRESETS_MULTI;
    presetName: string;
    nodeType: "NOTES";
    key: string;
}) => any;
export declare const getPresetGroup: ({ presets, presetName, nodeType, }: {
    presets: typeof ENGINE_PRESETS;
    presetName: string;
    nodeType: "SCHEMAS" | "NOTES";
}) => TestPresetDict;
export declare const ENGINE_PRESETS: ({
    name: string;
    presets: {
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
} | {
    name: string;
    presets: {
        NOTES: {
            GRANDCHILD_WITH_ALL_STUB_PARENTS: TestPresetEntryV4;
            NOTE_NO_CHILDREN: TestPresetEntryV4;
            NOTE_WITH_TARGET: TestPresetEntryV4;
            DOMAIN_CHILDREN: TestPresetEntryV4;
            DOMAIN_NO_CHILDREN: TestPresetEntryV4;
            STALE_CACHE_ENTRY: TestPresetEntryV4;
            MULTIPLE_DELETES: TestPresetEntryV4;
        };
        SCHEMAS: {
            BASIC: TestPresetEntryV4;
        };
    };
} | {
    name: string;
    presets: {
        NOTES: {
            EMPTY_QS: TestPresetEntryV4;
            MISSING_QUERY: TestPresetEntryV4;
            STAR_QUERY: TestPresetEntryV4;
            DOMAIN_QUERY_WITH_SCHEMA: TestPresetEntryV4;
            CHILD_QUERY_WITH_SCHEMA: TestPresetEntryV4;
        };
        SCHEMAS: {
            STAR_QUERY: TestPresetEntryV4;
            SIMPLE: TestPresetEntryV4;
        };
    };
} | {
    name: string;
    presets: {
        NOTES: {
            BASIC: TestPresetEntryV4;
        };
    };
} | {
    name: string;
    presets: {
        NOTES: {
            NOTE_REF: TestPresetEntryV4;
        };
        SCHEMAS: {};
    };
})[];
export declare const ENGINE_PRESETS_MULTI: ({
    name: string;
    presets: {
        NOTES: {
            NEW_DOMAIN: TestPresetEntryV4;
            NEW_DOMAIN_WITH_FULL_PATH_VAULT: TestPresetEntryV4;
            ID_UPDATED: TestPresetEntryV4;
            BODY_UPDATED: TestPresetEntryV4;
        };
        SCHEMAS: {};
    };
} | {
    name: string;
    presets: {
        NOTES: {
            GRANDCHILD_WITH_ALL_STUB_PARENTS: TestPresetEntryV4;
            NOTE_NO_CHILDREN: TestPresetEntryV4;
            NOTE_WITH_TARGET: TestPresetEntryV4;
            DOMAIN_CHILDREN: TestPresetEntryV4;
            DOMAIN_NO_CHILDREN: TestPresetEntryV4;
            STALE_CACHE_ENTRY: TestPresetEntryV4;
            MULTIPLE_DELETES: TestPresetEntryV4;
        };
        SCHEMAS: {
            BASIC: TestPresetEntryV4;
        };
    };
} | {
    name: string;
    presets: {
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
            NOTE_WITH_STUB_CHILD: TestPresetEntryV4;
        };
        SCHEMAS: {};
    };
} | {
    name: string;
    presets: {
        NOTES: {
            VAULT_WORKSPACE: TestPresetEntryV4;
            VAULT_WORKSPACE_W_SAME_VAULT_NAME: TestPresetEntryV4;
            BASIC: TestPresetEntryV4;
            FIND: TestPresetEntryV4;
            NOTE_TOO_LONG: TestPresetEntryV4;
            NOTE_TOO_LONG_CONFIG: TestPresetEntryV4;
            MIXED_CASE_PARENT: TestPresetEntryV4;
            LINKS: TestPresetEntryV4;
            DOMAIN_STUB: TestPresetEntryV4;
            NOTE_WITH_CUSTOM_ATT: TestPresetEntryV4;
            BAD_PARSE: TestPresetEntryV4;
        };
        SCHEMAS: {
            BASICS: TestPresetEntryV4;
            BAD_SCHEMA: TestPresetEntryV4;
        };
    };
} | {
    name: string;
    presets: {
        NOTES: {
            EMPTY_QS: TestPresetEntryV4;
            MISSING_QUERY: TestPresetEntryV4;
            STAR_QUERY: TestPresetEntryV4;
            DOMAIN_QUERY_WITH_SCHEMA: TestPresetEntryV4;
            CHILD_QUERY_WITH_SCHEMA: TestPresetEntryV4;
        };
        SCHEMAS: {
            STAR_QUERY: TestPresetEntryV4;
            SIMPLE: TestPresetEntryV4;
        };
    };
})[];
