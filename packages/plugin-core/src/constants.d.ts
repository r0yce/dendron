import { DendronTreeViewKey } from "@dendronhq/common-all";
export declare const extensionQualifiedId = "dendron.dendron";
export declare const DEFAULT_LEGACY_VAULT_NAME = "vault";
export declare enum DendronContext {
    PLUGIN_ACTIVE = "dendron:pluginActive",
    PLUGIN_NOT_ACTIVE = "!dendron:pluginActive",
    DEV_MODE = "dendron:devMode",
    HAS_LEGACY_PREVIEW = "dendron:hasLegacyPreview",
    HAS_CUSTOM_MARKDOWN_VIEW = "hasCustomMarkdownPreview",
    NOTE_LOOK_UP_ACTIVE = "dendron:noteLookupActive",
    SHOULD_SHOW_LOOKUP_VIEW = "dendron:shouldShowLookupView",
    BACKLINKS_SORT_ORDER = "dendron:backlinksSortOrder",
    ENABLE_EXPORT_PODV2 = "dendron:enableExportPodV2",
    TREEVIEW_TREE_ITEM_LABEL_TYPE = "dendron:treeviewItemLabelType",
    GRAPH_PANEL_SHOW_BACKLINKS = "dendron.graph-panel.showBacklinks",
    GRAPH_PANEL_SHOW_OUTWARD_LINKS = "dendron.graph-panel.showOutwardLinks",
    GRAPH_PANEL_SHOW_HIERARCHY = "dendron.graph-panel.showHierarchy"
}
/**
 * Invocation point for the LaunchTutorialCommand. Used for telemetry purposes
 */
export declare enum LaunchTutorialCommandInvocationPoint {
    RecentWorkspacesPanel = "RecentWorkspacesPanel",
    WelcomeWebview = "WelcomeWebview"
}
export declare const DENDRON_VIEWS_WELCOME: {
    view: DendronTreeViewKey;
    contents: string;
}[];
export declare const DENDRON_VIEWS_CONTAINERS: {
    activitybar: {
        id: string;
        title: string;
        icon: string;
    }[];
};
export declare const DENDRON_VIEWS: ({
    id: DendronTreeViewKey;
    name: string;
    when: string;
    type: string;
    where: string;
} | {
    when: string;
    where: string;
    icon: string;
    id: string;
    name: string;
    type?: "webview";
} | {
    when: string;
    where: string;
    id: string;
    name: string;
    type?: "webview";
})[];
type KeyBinding = {
    key?: string;
    mac?: string;
    windows?: string;
    when?: string;
    args?: any;
};
type ConfigEntry = {
    key: string;
    description: string;
    type: "string" | "boolean" | "number";
    default?: any;
    enum?: string[];
    scope?: CommandEntry;
};
type Entry = {
    name: string;
    description: string;
    data: any;
};
type CommandEntry = {
    key: string;
    title: string;
    keybindings?: KeyBinding;
    icon?: string;
    when?: string;
    enablement?: string;
};
export declare const ICONS: {
    LINK_CANDIDATE: string;
    WIKILINK: string;
    SCHEMA: string;
};
export declare const DENDRON_WORKSPACE_FILE = "dendron.code-workspace";
export declare const DENDRON_REMOTE_VAULTS: Entry[];
type CommandPaletteEntry = {
    command: string;
    when?: string;
};
export declare const DENDRON_MENUS: {
    commandPalette: CommandPaletteEntry[];
    "view/title": ({
        command: string;
        when: string;
        group: string;
    } | {
        command: string;
        when: string;
        group?: never;
    })[];
    "explorer/context": {
        when: string;
        command: string;
        group: string;
    }[];
    "editor/context": {
        when: string;
        command: string;
        group: string;
    }[];
    "editor/title": {
        command: string;
        when: string;
        group: string;
    }[];
    "editor/title/context": {
        command: string;
        when: string;
        group: string;
    }[];
    "view/item/context": ({
        command: string;
        when: string;
        group?: never;
    } | {
        command: string;
        when: string;
        group: string;
    })[];
};
export declare const DENDRON_COMMANDS: {
    BACKLINK_SORT_BY_LAST_UPDATED: {
        key: string;
        title: string;
    };
    BACKLINK_SORT_BY_LAST_UPDATED_CHECKED: {
        key: string;
        title: string;
    };
    BACKLINK_SORT_BY_PATH_NAMES: {
        key: string;
        title: string;
    };
    BACKLINK_SORT_BY_PATH_NAMES_CHECKED: {
        key: string;
        title: string;
    };
    BACKLINK_EXPAND_ALL: {
        key: string;
        title: string;
        icon: string;
    };
    TREEVIEW_LABEL_BY_TITLE: {
        key: string;
        title: string;
        icon: string;
    };
    TREEVIEW_LABEL_BY_FILENAME: {
        key: string;
        title: string;
        icon: string;
    };
    TREEVIEW_EXPAND_ALL: {
        key: string;
        title: string;
        icon: string;
        when: DendronContext;
    };
    TREEVIEW_CREATE_NOTE: {
        key: string;
        title: string;
        icon: string;
        when: string;
    };
    TREEVIEW_EXPAND_STUB: {
        key: string;
        title: string;
        when: string;
    };
    TREEVIEW_GOTO_NOTE: {
        key: string;
        title: string;
        icon: string;
        when: string;
    };
    GRAPH_PANEL_INCREASE_DEPTH: {
        key: string;
        title: string;
        icon: string;
    };
    GRAPH_PANEL_DECREASE_DEPTH: {
        key: string;
        title: string;
        icon: string;
    };
    GRAPH_PANEL_SHOW_BACKLINKS: {
        key: string;
        title: string;
    };
    GRAPH_PANEL_SHOW_OUTWARD_LINKS: {
        key: string;
        title: string;
    };
    GRAPH_PANEL_SHOW_HIERARCHY: {
        key: string;
        title: string;
    };
    GRAPH_PANEL_SHOW_BACKLINKS_CHECKED: {
        key: string;
        title: string;
    };
    GRAPH_PANEL_SHOW_OUTWARD_LINKS_CHECKED: {
        key: string;
        title: string;
    };
    GRAPH_PANEL_SHOW_HIERARCHY_CHECKED: {
        key: string;
        title: string;
    };
    BROWSE_NOTE: {
        key: string;
        title: string;
        when: string;
    };
    CONTRIBUTE: {
        key: string;
        title: string;
        when: string;
    };
    GOTO: {
        key: string;
        title: string;
        when: string;
        keybindings: {
            when: string;
        };
    };
    GOTO_NOTE: {
        key: string;
        title: string;
        when: string;
        keybindings: {
            key: string;
            when: string;
        };
    };
    CREATE_SCHEMA_FROM_HIERARCHY: {
        key: string;
        title: string;
        keybindings: {
            when: string;
        };
        when: string;
    };
    CREATE_DAILY_JOURNAL_NOTE: {
        key: string;
        title: string;
        keybindings: {
            key: string;
            mac: string;
            when: string;
        };
        when: string;
    };
    COPY_NOTE_LINK: {
        key: string;
        title: string;
        keybindings: {
            key: string;
            mac: string;
            when: string;
        };
        when: string;
    };
    COPY_NOTE_REF: {
        key: string;
        title: string;
        keybindings: {
            key: string;
            mac: string;
            when: string;
        };
        when: string;
    };
    COPY_TO_CLIPBOARD: {
        key: string;
        title: string;
        when: string;
    };
    COPY_CODESPACE_URL: {
        key: string;
        title: string;
        when: string;
    };
    COPY_AS: {
        key: string;
        title: string;
        keybindings: {
            key: string;
            mac: string;
            when: string;
        };
        when: string;
    };
    DELETE: {
        key: string;
        title: string;
        keybindings: {
            key: string;
            mac: string;
            when: string;
        };
        when: string;
    };
    INSERT_NOTE_LINK: {
        key: string;
        title: string;
        when: string;
    };
    INSERT_NOTE_INDEX: {
        key: string;
        title: string;
        when: string;
    };
    MOVE_NOTE: {
        key: string;
        title: string;
        when: string;
    };
    MOVE_SELECTION_TO: {
        key: string;
        title: string;
        when: string;
    };
    MERGE_NOTE: {
        key: string;
        title: string;
        when: string;
    };
    RANDOM_NOTE: {
        key: string;
        title: string;
        when: string;
    };
    RENAME_NOTE_V2A: {
        key: string;
        title: string;
        when: string;
    };
    RENAME_NOTE: {
        key: string;
        title: string;
        when: string;
    };
    RENAME_HEADER: {
        key: string;
        title: string;
        when: string;
    };
    MOVE_HEADER: {
        key: string;
        title: string;
        when: string;
    };
    CONVERT_CANDIDATE_LINK: {
        key: string;
        title: string;
        when: string;
    };
    CONVERT_LINK: {
        key: string;
        title: string;
        when: string;
    };
    LOOKUP_NOTE: {
        key: string;
        title: string;
        keybindings: {
            mac: string;
            key: string;
            when: string;
        };
        when: string;
    };
    LOOKUP_NOTE_AUTO_COMPLETE: {
        key: string;
        /** This command will NOT show up within the command palette
         *  since its disabled within package.json in contributes.menus.commandPalette */
        title: string;
        keybindings: {
            key: string;
            when: string;
        };
        when: string;
    };
    CREATE_JOURNAL: {
        key: string;
        title: string;
        keybindings: {
            key: string;
            mac: string;
            args: {
                noteType: string;
            };
            when: string;
        };
        when: string;
    };
    CREATE_SCRATCH: {
        key: string;
        title: string;
        keybindings: {
            key: string;
            mac: string;
            when: string;
        };
        when: string;
    };
    CREATE_NOTE: {
        key: string;
        title: string;
        when: string;
    };
    CREATE_MEETING_NOTE: {
        key: string;
        title: string;
        when: string;
    };
    LOOKUP_SCHEMA: {
        key: string;
        title: string;
        keybindings: {
            mac: string;
            key: string;
            when: string;
        };
        when: string;
    };
    RELOAD_INDEX: {
        key: string;
        title: string;
        when: string;
    };
    TASK_CREATE: {
        key: string;
        title: string;
        when: string;
    };
    TASK_SET_STATUS: {
        key: string;
        title: string;
        when: string;
    };
    TASK_COMPLETE: {
        key: string;
        title: string;
        when: string;
    };
    APPLY_TEMPLATE: {
        key: string;
        title: string;
        when: string;
    };
    ARCHIVE_HIERARCHY: {
        key: string;
        title: string;
        when: string;
    };
    REFACTOR_HIERARCHY: {
        key: string;
        title: string;
        when: string;
    };
    GO_UP_HIERARCHY: {
        key: string;
        title: string;
        keybindings: {
            mac: string;
            key: string;
            when: string;
        };
        when: string;
    };
    GO_NEXT_HIERARCHY: {
        key: string;
        title: string;
        keybindings: {
            key: string;
            when: string;
        };
        when: string;
    };
    GO_PREV_HIERARCHY: {
        key: string;
        title: string;
        keybindings: {
            key: string;
            when: string;
        };
        when: string;
    };
    GO_DOWN_HIERARCHY: {
        key: string;
        title: string;
        keybindings: {
            mac: string;
            key: string;
            when: string;
        };
        when: string;
    };
    GOTO_BACKLINK: {
        key: string;
        title: string;
        when: string;
    };
    ADD_AND_COMMIT: {
        key: string;
        title: string;
        when: string;
    };
    SYNC: {
        key: string;
        title: string;
        when: string;
    };
    VAULT_ADD: {
        key: string;
        title: string;
        when: string;
    };
    REMOVE_VAULT: {
        key: string;
        title: string;
        when: string;
    };
    CONVERT_VAULT: {
        key: string;
        title: string;
        when: string;
    };
    CREATE_NEW_VAULT: {
        key: string;
        title: string;
        when: string;
    };
    ADD_EXISTING_VAULT: {
        key: string;
        title: string;
        when: string;
    };
    INIT_WS: {
        key: string;
        title: string;
        when: string;
    };
    CHANGE_WS: {
        key: string;
        title: string;
        when: string;
    };
    UPGRADE_SETTINGS: {
        key: string;
        title: string;
        when: string;
    };
    CONFIGURE_POD: {
        key: string;
        title: string;
        when: string;
    };
    CONFIGURE_SERVICE_CONNECTION: {
        key: string;
        title: string;
        enablement: string;
    };
    CONFIGURE_EXPORT_POD_V2: {
        key: string;
        title: string;
        enablement: string;
    };
    IMPORT_POD: {
        key: string;
        title: string;
        when: string;
    };
    IMPORT_OBSIDIAN_POD: {
        key: string;
        title: string;
        when: string;
    };
    EXPORT_POD: {
        key: string;
        title: string;
        when: string;
    };
    EXPORT_POD_V2: {
        key: string;
        title: string;
        enablement: string;
    };
    PUBLISH_POD: {
        key: string;
        title: string;
        when: string;
    };
    SNAPSHOT_VAULT: {
        key: string;
        title: string;
        when: string;
    };
    RESTORE_VAULT: {
        key: string;
        title: string;
        when: string;
    };
    COPY_NOTE_URL: {
        key: string;
        title: string;
        keybindings: {
            mac: string;
            windows: string;
            when: string;
        };
        when: string;
    };
    CREATE_HOOK: {
        key: string;
        title: string;
        when: string;
    };
    DELETE_HOOK: {
        key: string;
        title: string;
        when: string;
    };
    REGISTER_NOTE_TRAIT: {
        key: string;
        title: string;
        when: string;
    };
    CONFIGURE_NOTE_TRAITS: {
        key: string;
        title: string;
        when: string;
    };
    CREATE_USER_DEFINED_NOTE: {
        key: string;
        title: string;
        when: string;
    };
    PUBLISH_EXPORT: {
        key: string;
        title: string;
        when: string;
    };
    PUBLISH_DEV: {
        key: string;
        title: string;
        when: string;
    };
    SIGNUP: {
        key: string;
        title: string;
        when: string;
    };
    SIGNIN: {
        key: string;
        title: string;
        when: string;
    };
    ENABLE_TELEMETRY: {
        key: string;
        title: string;
        when: string;
    };
    DISABLE_TELEMETRY: {
        key: string;
        title: string;
        when: string;
    };
    OPEN_LINK: {
        key: string;
        title: string;
        when: string;
    };
    PASTE_LINK: {
        key: string;
        title: string;
        when: string;
    };
    SHOW_HELP: {
        key: string;
        title: string;
        when: string;
    };
    SHOW_NOTE_GRAPH: {
        key: string;
        title: string;
        when: string;
    };
    SHOW_SCHEMA_GRAPH: {
        key: string;
        title: string;
        when: string;
    };
    SHOW_LEGACY_PREVIEW: {
        key: string;
        title: string;
        keybindings: {
            windows: string;
            mac: string;
            when: string;
        };
        when: string;
    };
    TOGGLE_PREVIEW: {
        key: string;
        title: string;
        icon: string;
        keybindings: {
            key: string;
            mac: string;
            when: string;
        };
        when: string;
    };
    TOGGLE_PREVIEW_LOCK: {
        key: string;
        title: string;
        icon: string;
        when: string;
    };
    PASTE_FILE: {
        key: string;
        title: string;
        when: string;
    };
    CONFIGURE_RAW: {
        key: string;
        title: string;
        when: string;
    };
    CONFIGURE_UI: {
        key: string;
        title: string;
        when: string;
    };
    CONFIGURE_GRAPH_STYLES: {
        key: string;
        title: string;
        when: string;
    };
    CONFIGURE_LOCAL_OVERRIDE: {
        key: string;
        title: string;
        when: string;
    };
    SEED_ADD: {
        key: string;
        title: string;
        when: string;
    };
    SEED_REMOVE: {
        key: string;
        title: string;
        when: string;
    };
    SEED_BROWSE: {
        key: string;
        title: string;
        when: string;
    };
    DOCTOR: {
        key: string;
        title: string;
        when: string;
    };
    DUMP_STATE: {
        key: string;
        title: string;
        when: string;
    };
    DEV_TRIGGER: {
        key: string;
        title: string;
        when: DendronContext;
    };
    DEV_SHOW_ACTIVATION_REPORT: {
        key: string;
        title: string;
        when: DendronContext;
    };
    DEV_SHOW_ALL_PERF_REPORTS: {
        key: string;
        title: string;
        when: DendronContext;
    };
    RESET_CONFIG: {
        key: string;
        title: string;
        when: string;
    };
    RUN_MIGRATION: {
        key: string;
        title: string;
        when: string;
    };
    MIGRATE_SELF_CONTAINED: {
        key: string;
        title: string;
        when: string;
    };
    OPEN_LOGS: {
        key: string;
        title: string;
        when: string;
    };
    DEV_DIAGNOSTICS_REPORT: {
        key: string;
        title: string;
        when: string;
    };
    /**
     * This launches the welcome screen, which has a button that will launch the
     * tutorial when clicked.
     */
    SHOW_WELCOME_PAGE: {
        key: string;
        title: string;
        when: string;
    };
    /**
     * This command actually launches the tutorial workspace
     */
    LAUNCH_TUTORIAL_WORKSPACE: {
        key: string;
        title: string;
        when: string;
    };
    OPEN_BACKUP: {
        key: string;
        title: string;
        when: string;
    };
    INSTRUMENTED_WRAPPER_COMMAND: {
        key: string;
        title: string;
        when: string;
    };
    VALIDATE_ENGINE: {
        key: string;
        title: string;
        when: string;
    };
};
export declare const DENDRON_CHANNEL_NAME = "Dendron";
export declare const WORKSPACE_STATE: {
    VERSION: string;
};
export declare enum GLOBAL_STATE {
    VERSION = "dendron.version",
    /**
     * Context that can be used on extension activation to trigger special behavior.
     */
    WORKSPACE_ACTIVATION_CONTEXT = "dendron.workspace_activation_context",
    /**
     * Extension is being debugged
     */
    VSCODE_DEBUGGING_EXTENSION = "dendron.vscode_debugging_extension",
    /**
     * Most Recently Imported Doc
     */
    MRUDocs = "MRUDocs",
    /**
     * @deprecated
     * Checks if initial survey was prompted and submitted.
     */
    INITIAL_SURVEY_SUBMITTED = "dendron.initial_survey_submitted",
    /**
     * @deprecated
     * Checks if lapsed user survey was submitted.
     */
    LAPSED_USER_SURVEY_SUBMITTED = "dendron.lapsed_user_survey_submitted",
    /**
     * @deprecated
     * Chekcs if inactive user survey was submitted.
     */
    INACTIVE_USER_SURVEY_SUBMITTED = "dendron.inactive_user_survey_submitted"
}
/**
 * @deprecated
 */
export declare enum WORKSPACE_ACTIVATION_CONTEXT {
    "NORMAL" = 0,// Normal Launch; No Special Behavior
    "TUTORIAL" = 1,// Launch the Tutorial
    "SEED_BROWSER" = 2
}
export type ConfigKey = keyof typeof CONFIG;
export declare const _noteAddBehaviorEnum: string[];
export declare const CONFIG: {
    [key: string]: ConfigEntry;
};
export declare const gdocRequiredScopes: string[];
export declare const Oauth2Pods: string[];
export declare const INCOMPATIBLE_EXTENSIONS: string[];
export type osType = "Linux" | "Darwin" | "Windows_NT";
export declare function isOSType(str: string): str is osType;
export type KeybindingConflict = {
    /**
     * extension id of the extension that has keybinding conflict
     */
    extensionId: string;
    /**
     * command id of the command contributed by `extensionId` that conflicts
     */
    commandId: string;
    /**
     * command id of Dendron command that conflicts with `commandId`
     */
    conflictsWith: string;
    /**
     * os in which this conflict exists. assume all platforms if undefined.
     * this is the os type returned by {@link os.type}
     */
    os?: osType[];
};
export declare const KNOWN_CONFLICTING_EXTENSIONS: string[];
/**
 * List of known keybinding conflicts
 */
export declare const KNOWN_KEYBINDING_CONFLICTS: KeybindingConflict[];
export {};
