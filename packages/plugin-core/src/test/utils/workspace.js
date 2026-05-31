"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceTestUtils = void 0;
const common_all_1 = require("@dendronhq/common-all");
class WorkspaceTestUtils {
    /**
     * Hardcoded version of the default config.
     */
    static generateDefaultConfig({ vaults, duplicateNoteBehavior, }) {
        const config = {
            version: 5,
            dev: {
                enablePreviewV2: true,
            },
            commands: {
                lookup: {
                    note: {
                        selectionMode: "extract",
                        confirmVaultOnCreate: true,
                        vaultSelectionModeOnCreate: "smart",
                        leaveTrace: false,
                        bubbleUpCreateNew: true,
                        fuzzThreshold: 0.2,
                    },
                },
                randomNote: {},
                copyNoteLink: { aliasMode: "title" },
                insertNoteLink: {
                    aliasMode: common_all_1.InsertNoteLinkAliasModeEnum.none,
                    enableMultiSelect: false,
                },
                insertNoteIndex: {
                    enableMarker: false,
                },
                templateHierarchy: "template",
            },
            workspace: {
                vaults,
                journal: {
                    dailyDomain: "daily",
                    name: "journal",
                    dateFormat: "y.MM.dd",
                    addBehavior: common_all_1.NoteAddBehaviorEnum.childOfDomain,
                },
                scratch: {
                    name: "scratch",
                    dateFormat: "y.MM.dd.HHmmss",
                    addBehavior: common_all_1.NoteAddBehaviorEnum.asOwnDomain,
                },
                task: {
                    name: "task",
                    dateFormat: "y.MM.dd",
                    addBehavior: common_all_1.NoteAddBehaviorEnum.asOwnDomain,
                    taskCompleteStatus: ["done", "x"],
                    statusSymbols: {
                        "": " ",
                        wip: "w",
                        done: "x",
                        assigned: "a",
                        moved: "m",
                        blocked: "b",
                        delegated: "l",
                        dropped: "d",
                        pending: "y",
                    },
                    prioritySymbols: {
                        H: "high",
                        M: "medium",
                        L: "low",
                    },
                    todoIntegration: false,
                    createTaskSelectionType: "selection2link",
                },
                graph: {
                    zoomSpeed: 1,
                    createStub: false,
                },
                enableAutoCreateOnDefinition: false,
                enableXVaultWikiLink: false,
                enableRemoteVaultInit: true,
                enableUserTags: true,
                enableHashTags: true,
                enablePersistentHistory: false,
                workspaceVaultSyncMode: "noCommit",
                enableAutoFoldFrontmatter: false,
                enableEditorDecorations: true,
                maxPreviewsCached: 10,
                maxNoteLength: 204800,
                enableFullHierarchyNoteTitle: false,
            },
            preview: {
                enableFMTitle: true,
                enableNoteTitleForLink: true,
                enableFrontmatterTags: true,
                enableHashesForFMTags: false,
                enablePrettyRefs: true,
                enableKatex: true,
                automaticallyShowPreview: false,
            },
            publishing: {
                enableFMTitle: true,
                enableFrontmatterTags: true,
                enableHashesForFMTags: false,
                enableKatex: true,
                enableNoteTitleForLink: true,
                copyAssets: true,
                enablePrettyRefs: true,
                siteHierarchies: ["root"],
                writeStubs: false,
                siteRootDir: "docs",
                searchMode: common_all_1.SearchMode.SEARCH,
                seo: {
                    title: "Dendron",
                    description: "Personal Knowledge Space",
                },
                github: {
                    enableEditLink: true,
                    editLinkText: "Edit this page on GitHub",
                    editBranch: "main",
                    editViewMode: "tree",
                },
                enableSiteLastModified: true,
                enableRandomlyColoredTags: true,
                enableTaskNotes: true,
                enablePrettyLinks: true,
            },
        };
        if (duplicateNoteBehavior) {
            config.publishing.duplicateNoteBehavior = duplicateNoteBehavior;
        }
        return config;
    }
}
exports.WorkspaceTestUtils = WorkspaceTestUtils;
//# sourceMappingURL=workspace.js.map