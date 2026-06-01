import { DendronTreeViewKey, DendronEditorViewKey, NoteProps, LookupModifierStatePayload, TreeMenu, GraphThemeEnum } from "@dendronhq/common-all";
import { PayloadAction } from "@reduxjs/toolkit";
type Theme = "light" | "dark" | "unknown";
type InitialState = {
    noteActive: NoteProps | undefined;
    /** The previous value of `noteActive` */
    notePrev: NoteProps | undefined;
    theme: Theme;
    graphStyles: string;
    views: {
        [key in DendronTreeViewKey | DendronEditorViewKey]?: {
            ready: boolean;
        };
    };
    seedsInWorkspace: string[] | undefined;
    lookupModifiers: LookupModifierStatePayload | undefined;
    tree?: TreeMenu;
    graphTheme?: GraphThemeEnum;
    graphDepth?: number;
    showBacklinks?: boolean;
    showOutwardLinks?: boolean;
    showHierarchy?: boolean;
    isLocked?: boolean;
    previewHTML: string;
};
export { InitialState as IDEState };
export declare const ideSlice: import("@reduxjs/toolkit").Slice<InitialState, {
    setPreviewHTML: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<string>) => void;
    setNoteActive: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<NoteProps | undefined>) => void;
    setTree: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<TreeMenu>) => void;
    setTheme: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<Theme>) => void;
    setGraphStyles: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<string>) => void;
    setViewReady: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<{
        key: DendronTreeViewKey;
        ready: boolean;
    }>) => void;
    refreshLookup: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<LookupModifierStatePayload>) => void;
    setSeedsInWorkspace: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<string[]>) => void;
    setGraphTheme: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<GraphThemeEnum>) => void;
    setGraphDepth: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<number>) => void;
    setShowBacklinks: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<boolean>) => void;
    setShowOutwardLinks: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<boolean>) => void;
    setShowHierarchy: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<boolean>) => void;
    setLock: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<boolean>) => void;
}, "ide">;
export declare const actions: import("@reduxjs/toolkit").CaseReducerActions<{
    setPreviewHTML: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<string>) => void;
    setNoteActive: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<NoteProps | undefined>) => void;
    setTree: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<TreeMenu>) => void;
    setTheme: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<Theme>) => void;
    setGraphStyles: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<string>) => void;
    setViewReady: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<{
        key: DendronTreeViewKey;
        ready: boolean;
    }>) => void;
    refreshLookup: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<LookupModifierStatePayload>) => void;
    setSeedsInWorkspace: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<string[]>) => void;
    setGraphTheme: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<GraphThemeEnum>) => void;
    setGraphDepth: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<number>) => void;
    setShowBacklinks: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<boolean>) => void;
    setShowOutwardLinks: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<boolean>) => void;
    setShowHierarchy: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<boolean>) => void;
    setLock: (state: import("immer/dist/internal").WritableDraft<InitialState>, action: PayloadAction<boolean>) => void;
}>;
export declare const reducer: import("redux").Reducer<InitialState>;
