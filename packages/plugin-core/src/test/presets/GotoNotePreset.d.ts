import { TestPresetEntry } from "@dendronhq/common-test-utils";
import { IDendronExtension } from "../../dendronExtensionInterface";
export declare const GOTO_NOTE_PRESETS: {
    ANCHOR: TestPresetEntry<unknown, any, any>;
    ANCHOR_WITH_SPECIAL_CHARS: TestPresetEntry<unknown, any, any>;
    LINK_TO_NOTE_IN_SAME_VAULT: TestPresetEntry<{
        ext: IDendronExtension;
    }, any, any>;
    LINK_IN_CODE_BLOCK: TestPresetEntry<{
        ext: IDendronExtension;
    }, any, any>;
    LINK_TO_NOTE_WITH_URI_HTTP: TestPresetEntry<{
        ext: IDendronExtension;
    }, any, any>;
    VALID_URL: TestPresetEntry<{
        ext: IDendronExtension;
    }, any, any>;
    PARTIAL_URL: TestPresetEntry<{
        ext: IDendronExtension;
    }, any, any>;
    NO_LINK: TestPresetEntry<{
        ext: IDendronExtension;
    }, any, any>;
};
