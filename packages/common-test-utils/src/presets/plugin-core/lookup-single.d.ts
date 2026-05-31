import { DVault, NoteProps } from "@dendronhq/common-all";
import { TestPresetEntry } from "../../utils";
declare const LOOKUP_SINGLE_TEST_PRESET: {
    UPDATE_ITEMS: {
        SCHEMA_SUGGESTION: TestPresetEntry<{
            vault: DVault;
        }, any, {
            items: NoteProps;
        }>;
    };
    ACCEPT_ITEMS: {
        EXISTING_ITEM: TestPresetEntry<unknown, any, {
            activeFileName: string;
            activeNote: NoteProps;
        }>;
    };
};
export default LOOKUP_SINGLE_TEST_PRESET;
