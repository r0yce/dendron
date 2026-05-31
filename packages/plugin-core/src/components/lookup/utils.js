"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterPickerResults = exports.PickerUtilsV2 = exports.ProviderAcceptHooks = exports.FULL_MATCH_DETAIL = exports.HIERARCHY_MATCH_DETAIL = exports.CONTEXT_DETAIL = exports.UPDATET_SOURCE = void 0;
exports.createNoActiveItem = createNoActiveItem;
exports.createMoreResults = createMoreResults;
exports.node2Uri = node2Uri;
exports.showDocAndHidePicker = showDocAndHidePicker;
exports.shouldBubbleUpCreateNew = shouldBubbleUpCreateNew;
exports.sortBySimilarity = sortBySimilarity;
/* eslint-disable no-dupe-class-members */
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importStar(require("lodash"));
const path_1 = __importDefault(require("path"));
const string_similarity_1 = __importDefault(require("string-similarity"));
const vscode_1 = require("vscode");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const logger_1 = require("../../logger");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const ButtonTypes_1 = require("./ButtonTypes");
const constants_1 = require("./constants");
const TabUtils_1 = require("./TabUtils");
const types_1 = require("./types");
exports.UPDATET_SOURCE = {
    UPDATE_PICKER_FILTER: "UPDATE_PICKER_FILTER",
};
// Vault Recommendation Detail Descriptions
exports.CONTEXT_DETAIL = "current note context";
exports.HIERARCHY_MATCH_DETAIL = "hierarchy match";
exports.FULL_MATCH_DETAIL = "hierarchy match and current note context";
function isDVaultArray(overrides) {
    return lodash_1.default.some(overrides, (item) => item.vault === undefined);
}
function createNoActiveItem(vault) {
    const props = common_all_1.DNodeUtils.create({
        fname: constants_1.CREATE_NEW_LABEL,
        type: "note",
        vault,
    });
    return {
        ...props,
        label: constants_1.CREATE_NEW_LABEL,
        detail: constants_1.CREATE_NEW_NOTE_DETAIL,
        alwaysShow: true,
    };
}
function createMoreResults() {
    // @ts-ignore
    return {
        label: constants_1.MORE_RESULTS_LABEL,
        detail: "",
        alwaysShow: true,
    };
}
function node2Uri(node) {
    const ext = node.type === "note" ? ".md" : ".yml";
    const nodePath = node.fname + ext;
    const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
    const vault = node.vault;
    const vpath = (0, common_server_1.vault2Path)({ wsRoot, vault });
    return vscode_1.Uri.file(path_1.default.join(vpath, nodePath));
}
async function showDocAndHidePicker(uris, picker) {
    const ctx = "showDocAndHidePicker";
    const maybeSplitSelection = lodash_1.default.find(picker.buttons, (ent) => {
        return (0, ButtonTypes_1.getButtonCategory)(ent) === "split" && ent.pressed;
    });
    let viewColumn = vscode_1.ViewColumn.Active;
    if (maybeSplitSelection) {
        const splitType = maybeSplitSelection.type;
        if (splitType === "horizontal") {
            viewColumn = vscode_1.ViewColumn.Beside;
        }
        else {
            // TODO: close current button
            // await commands.executeCommand("workbench.action.splitEditorDown");
        }
    }
    await Promise.all(uris.map(async (uri) => {
        return vscode_1.window.showTextDocument(uri, { viewColumn }).then(() => {
            logger_1.Logger.info({ ctx, msg: "showTextDocument", fsPath: uri.fsPath });
            picker.hide();
            return;
        }, (err) => {
            logger_1.Logger.error({ ctx, error: err, msg: "exit" });
            throw err;
        });
    }));
    return uris;
}
class ProviderAcceptHooks {
    /**
     * Returns current location and new location for note
     * @param param0
     * @returns
     */
    static oldNewLocationHook = async ({ quickpick, selectedItems, }) => {
        // setup vars
        const oldVault = PickerUtilsV2.getVaultForOpenEditor();
        const newVault = quickpick.vault ? quickpick.vault : oldVault;
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        // get old note
        const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        const oldUri = editor.document.uri;
        const oldFname = common_all_1.DNodeUtils.fname(oldUri.fsPath);
        const selectedItem = selectedItems[0];
        const fname = PickerUtilsV2.isCreateNewNotePickedForSingle(selectedItem)
            ? quickpick.value
            : selectedItem.fname;
        // get new note
        const newNote = (await engine.findNotesMeta({ fname, vault: newVault }))[0];
        const isStub = newNote?.stub;
        if (newNote && !isStub) {
            const vaultName = common_all_1.VaultUtils.getName(newVault);
            const errMsg = `${vaultName}/${quickpick.value} exists`;
            vscode_1.window.showErrorMessage(errMsg);
            return {
                error: new common_all_1.DendronError({ message: errMsg }),
            };
        }
        const data = {
            oldLoc: {
                fname: oldFname,
                vaultName: common_all_1.VaultUtils.getName(oldVault),
            },
            newLoc: {
                fname: quickpick.value,
                vaultName: common_all_1.VaultUtils.getName(newVault),
            },
        };
        return { data, error: null };
    };
    static NewLocationHook = async ({ quickpick, }) => {
        const activeEditorVault = PickerUtilsV2.getVaultForOpenEditor();
        const newVault = quickpick.vault ? quickpick.vault : activeEditorVault;
        const data = {
            newLoc: {
                fname: quickpick.value,
                vaultName: common_all_1.VaultUtils.getName(newVault),
            },
        };
        return { data, error: null };
    };
}
exports.ProviderAcceptHooks = ProviderAcceptHooks;
class PickerUtilsV2 {
    static createDendronQuickPick(opts) {
        const { title, placeholder, ignoreFocusOut, initialValue } = lodash_1.default.defaults(opts, {
            ignoreFocusOut: true,
        });
        const quickPick = vscode_1.window.createQuickPick();
        quickPick.title = title;
        quickPick.state = types_1.DendronQuickPickState.IDLE;
        quickPick.nonInteractive = opts.nonInteractive;
        quickPick.placeholder = placeholder;
        quickPick.ignoreFocusOut = ignoreFocusOut;
        quickPick._justActivated = true;
        quickPick.canSelectMany = false;
        quickPick.matchOnDescription = false;
        quickPick.matchOnDetail = false;
        quickPick.sortByLabel = false;
        quickPick.showNote = async (uri) => {
            let viewColumn;
            // if current tab is a preview, open note in a different view
            if (TabUtils_1.TabUtils.tabAPIAvailable()) {
                const allTabGroups = TabUtils_1.TabUtils.getAllTabGroups();
                const activeTabGroup = allTabGroups.activeTabGroup;
                if (activeTabGroup.activeTab &&
                    TabUtils_1.TabUtils.isPreviewTab(activeTabGroup.activeTab)) {
                    const nonPreviewTabGroup = lodash_1.default.find(allTabGroups.all, (tb) => tb.viewColumn !== activeTabGroup.viewColumn);
                    if (nonPreviewTabGroup) {
                        viewColumn = nonPreviewTabGroup.viewColumn;
                    }
                }
            }
            return vscode_1.window.showTextDocument(uri, { viewColumn });
        };
        if (initialValue !== undefined) {
            quickPick.rawValue = initialValue;
            quickPick.prefix = initialValue;
            quickPick.value = initialValue;
        }
        return quickPick;
    }
    static createDendronQuickPickItem(opts) {
        return {
            ...opts,
        };
    }
    static createDendronQuickPickItemFromNote(opts) {
        return {
            ...opts,
            label: opts.fname,
        };
    }
    static getValue(picker) {
        return picker.value;
    }
    static getSelection(picker) {
        return [...picker.selectedItems];
    }
    static filterCreateNewItem = (items) => {
        return lodash_1.default.reject(items, { label: constants_1.CREATE_NEW_LABEL });
    };
    static filterDefaultItems = (items) => {
        return lodash_1.default.reject(items, (ent) => ent.label === constants_1.CREATE_NEW_LABEL || ent.label === constants_1.MORE_RESULTS_LABEL);
    };
    /**
     * Reject all items that are over a given level
     * @param items
     * @param lvl
     */
    static filterByDepth = (items, depth) => {
        return lodash_1.default.reject(items, (ent) => {
            return common_all_1.DNodeUtils.getDepth(ent) > depth;
        });
    };
    /** Reject all items that are stubs */
    static filterNonStubs(items) {
        return lodash_1.default.filter(items, (ent) => {
            return !ent.stub;
        });
    }
    static getFnameForOpenEditor() {
        const activeEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        if (activeEditor) {
            return path_1.default.basename(activeEditor.document.fileName, ".md");
        }
        return;
    }
    /**
     * Defaults to first vault if current note is not part of a vault
     * @returns
     */
    static getVaultForOpenEditor(fsPath) {
        const ctx = "getVaultForOpenEditor";
        const { vaults, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        let vault;
        const activeDocument = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document;
        const fpath = fsPath || activeDocument?.uri.fsPath;
        if (fpath &&
            engine_server_1.WorkspaceUtils.isPathInWorkspace({
                wsRoot,
                vaults,
                fpath,
            })) {
            logger_1.Logger.info({ ctx, activeDocument: fpath });
            vault = common_all_1.VaultUtils.getVaultByFilePath({
                vaults,
                wsRoot,
                fsPath: fpath,
            });
        }
        else {
            logger_1.Logger.info({ ctx, msg: "no active doc" });
            vault = vaults[0];
        }
        // TODO: remove
        logger_1.Logger.info({ ctx, msg: "exit", vault });
        return vault;
    }
    /** @deprecated use `getVaultForOpenEditor` instead, this function no longer prompts anything. */
    static getOrPromptVaultForOpenEditor() {
        return PickerUtilsV2.getVaultForOpenEditor();
    }
    static getQueryUpToLastDot = (query) => {
        return query.lastIndexOf(".") >= 0
            ? query.slice(0, query.lastIndexOf("."))
            : "";
    };
    static getCreateNewItem = (items) => {
        return lodash_1.default.find(items, { label: constants_1.CREATE_NEW_LABEL });
    };
    /**
     * Check if this picker still has further pickers
     */
    static hasNextPicker = (quickpick, opts) => {
        const { selectedItems, providerId } = opts;
        const nextPicker = quickpick.nextPicker;
        const isNewPick = PickerUtilsV2.isCreateNewNotePicked(selectedItems[0]);
        const isNewPickAllowed = ["lookup", "dendron.moveHeader"];
        return (!lodash_1.default.isUndefined(nextPicker) &&
            (isNewPickAllowed.includes(providerId) ? isNewPick : true));
    };
    static isCreateNewNotePickedForSingle(node) {
        if (!node) {
            return true;
        }
        if (constants_1.CREATE_NEW_DETAIL_LIST.includes(node.detail || "") ||
            node.stub ||
            node.schemaStub) {
            return true;
        }
        else {
            return false;
        }
    }
    static isCreateNewNotePicked(node) {
        if (!node) {
            return true;
        }
        if (constants_1.CREATE_NEW_DETAIL_LIST.includes(node.detail || "") ||
            node.stub ||
            node.schemaStub) {
            return true;
        }
        else {
            return false;
        }
    }
    static isCreateNewNoteWithTemplatePicked(node) {
        return (this.isCreateNewNotePicked(node) &&
            node.detail === constants_1.CREATE_NEW_NOTE_WITH_TEMPLATE_DETAIL);
    }
    static isInputEmpty(value) {
        if (lodash_1.default.isUndefined(value)) {
            return true;
        }
        if (lodash_1.default.isEmpty(value)) {
            return true;
        }
        return false;
    }
    static async getOrPromptVaultForNewNote({ vault, fname, vaultSelectionMode = types_1.VaultSelectionMode.smart, }) {
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        const vaultSuggestions = await PickerUtilsV2.getVaultRecommendations({
            vault,
            vaults: engine.vaults,
            engine,
            fname,
        });
        if (vaultSuggestions?.length === 1 ||
            vaultSelectionMode === types_1.VaultSelectionMode.auto) {
            return vaultSuggestions[0].vault;
        }
        // Auto select for the user if either the hierarchy pattern matches in the
        // current vault context, or if there are no hierarchy matches
        if (vaultSelectionMode === types_1.VaultSelectionMode.smart) {
            if (vaultSuggestions[0].detail === exports.FULL_MATCH_DETAIL ||
                vaultSuggestions[0].detail === exports.CONTEXT_DETAIL) {
                return vaultSuggestions[0].vault;
            }
        }
        return PickerUtilsV2.promptVault(vaultSuggestions);
    }
    static async promptVault(overrides) {
        const { vaults: wsVaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const pickerOverrides = isDVaultArray(overrides)
            ? overrides.map((value) => {
                return { vault: value, label: common_all_1.VaultUtils.getName(value) };
            })
            : overrides;
        const vaults = pickerOverrides ??
            wsVaults.map((vault) => {
                return { vault, label: common_all_1.VaultUtils.getName(vault) };
            });
        const items = vaults.map((ent) => ({
            ...ent,
            label: ent.label ? ent.label : ent.vault.fsPath,
        }));
        const resp = await vsCodeUtils_1.VSCodeUtils.showQuickPick(items, {
            title: "Select Vault",
        });
        return resp ? resp.vault : undefined;
    }
    /**
     * Determine which vault(s) are the most appropriate to create this note in.
     * Vaults determined as better matches appear earlier in the returned array
     * @param
     * @returns
     */
    static async getVaultRecommendations({ vault, vaults, engine, fname, }) {
        let vaultSuggestions = [];
        // Only 1 vault, no other options to choose from:
        if (vaults.length <= 1) {
            return Array.of({ vault, label: common_all_1.VaultUtils.getName(vault) });
        }
        const domain = fname.split(".").slice(0, -1);
        const newQs = domain.join(".");
        const queryResponse = await engine.queryNotes({
            qs: newQs,
            originalQS: newQs,
            createIfNew: false,
        });
        // Sort Alphabetically by the Path Name
        const sortByPathNameFn = (a, b) => {
            return a.fsPath <= b.fsPath ? -1 : 1;
        };
        let allVaults = engine.vaults.sort(sortByPathNameFn);
        const vaultsWithMatchingHierarchy = queryResponse
            .filter((value) => value.fname === newQs)
            .map((value) => value.vault)
            .sort(sortByPathNameFn)
            .map((value) => {
            return {
                vault: value,
                detail: exports.HIERARCHY_MATCH_DETAIL,
                label: common_all_1.VaultUtils.getName(value),
            };
        });
        if (!vaultsWithMatchingHierarchy) {
            // Suggest current vault context as top suggestion
            vaultSuggestions.push({
                vault,
                detail: exports.CONTEXT_DETAIL,
                label: common_all_1.VaultUtils.getName(vault),
            });
            allVaults.forEach((cmpVault) => {
                if (cmpVault !== vault) {
                    vaultSuggestions.push({
                        vault: cmpVault,
                        label: common_all_1.VaultUtils.getName(vault),
                    });
                }
            });
        }
        // One of the vaults with a matching hierarchy is also the current note context:
        else if (vaultsWithMatchingHierarchy.find((value) => value.vault.fsPath === vault.fsPath) !== undefined) {
            // Prompt with matching hierarchies & current context, THEN other matching contexts; THEN any other vaults
            vaultSuggestions.push({
                vault,
                detail: exports.FULL_MATCH_DETAIL,
                label: common_all_1.VaultUtils.getName(vault),
            });
            // remove from allVaults the one we already pushed.
            allVaults = lodash_1.default.filter(allVaults, (v) => {
                return !lodash_1.default.isEqual(v, vault);
            });
            vaultsWithMatchingHierarchy.forEach((ent) => {
                if (!vaultSuggestions.find((suggestion) => suggestion.vault.fsPath === ent.vault.fsPath)) {
                    vaultSuggestions.push({
                        vault: ent.vault,
                        detail: exports.HIERARCHY_MATCH_DETAIL,
                        label: common_all_1.VaultUtils.getName(ent.vault),
                    });
                    // remove from allVaults the one we already pushed.
                    allVaults = lodash_1.default.filter(allVaults, (v) => {
                        return !lodash_1.default.isEqual(v, ent.vault);
                    });
                }
            });
            // push the rest of the vaults
            allVaults.forEach((wsVault) => {
                vaultSuggestions.push({
                    vault: wsVault,
                    label: common_all_1.VaultUtils.getName(wsVault),
                });
            });
        }
        else {
            // Suggest vaults with matching hierarchy, THEN current note context, THEN any other vaults
            vaultSuggestions = vaultSuggestions.concat(vaultsWithMatchingHierarchy);
            vaultSuggestions.push({
                vault,
                detail: exports.CONTEXT_DETAIL,
                label: common_all_1.VaultUtils.getName(vault),
            });
            allVaults = lodash_1.default.filter(allVaults, (v) => {
                return !lodash_1.default.isEqual(v, vault);
            });
            allVaults.forEach((wsVault) => {
                vaultSuggestions.push({
                    vault: wsVault,
                    label: common_all_1.VaultUtils.getName(wsVault),
                });
            });
        }
        return vaultSuggestions;
    }
    static resetPaginationOpts(picker) {
        delete picker.moreResults;
        delete picker.offset;
        delete picker.allResults;
    }
    static noteQuickInputToNote(item) {
        const props = lodash_1.default.omit(item, "label", "detail", "alwaysShow");
        return props;
    }
}
exports.PickerUtilsV2 = PickerUtilsV2;
function countDots(subStr) {
    return Array.from(subStr).filter((ch) => ch === ".").length;
}
function sortForQueryEndingWithDot(transformedQuery, itemsToFilter) {
    const lowercaseQuery = transformedQuery.originalQuery.toLowerCase();
    // If the user enters the query 'data.' we want to keep items that have 'data.'
    // and sort the results in the along the following order:
    //
    // ```
    // data.driven                  (data. has clean-match, grandchild-free, 1st in hierarchy)
    // level1.level2.data.integer   (data. has clean-match, grandchild-free, 3rd in hierarchy)
    // l1.l2.l3.data.bool           (data. has clean-match, grandchild-free, 4th in hierarchy)
    // l1.with-data.and-child       (data. has partial match 2nd level)
    // l1.l2.with-data.and-child    (data. has partial match 3rd level)
    // level1.level2.data.integer.has-grandchild
    // l1.l2.with-data.and-child.has-grandchild
    // data.stub (Stub notes come at the end).
    // ```
    const itemsWithMetadata = itemsToFilter
        .map((item) => {
        // Firstly pre-process the items in attempt to find the match.
        const lowercaseFName = item.fname.toLowerCase();
        const matchIndex = lowercaseFName.indexOf(lowercaseQuery);
        return { matchIndex, item };
    })
        // Filter out items without a match.
        .filter((item) => item.matchIndex !== -1)
        // Filter out items where the match is at the end (match does not have children)
        .filter((item) => !(item.matchIndex + lowercaseQuery.length === item.item.fname.length))
        .map((item) => {
        // Meaning the match takes up entire level of the hierarchy.
        // 'one.two-hi.three'->'two-hi.' is clean match while 'o-hi.' is a
        // match but not a clean one.
        const isCleanMatch = item.matchIndex === 0 ||
            item.item.fname.charAt(item.matchIndex - 1) === ".";
        const dotsBeforeMatch = countDots(item.item.fname.substring(0, item.matchIndex));
        const dotsAfterMatch = countDots(item.item.fname.substring(item.matchIndex + lowercaseQuery.length));
        const isStub = item.item.stub;
        const zeroGrandchildren = dotsAfterMatch === 0;
        return {
            isStub,
            dotsBeforeMatch,
            dotsAfterMatch,
            zeroGrandchildren,
            isCleanMatch,
            ...item,
        };
    });
    const sortOrder = [
        { fieldName: "isStub", order: "desc" },
        { fieldName: "zeroGrandchildren", order: "desc" },
        { fieldName: "isCleanMatch", order: "desc" },
        { fieldName: "dotsAfterMatch", order: "asc" },
        { fieldName: "dotsBeforeMatch", order: "asc" },
    ];
    return (0, lodash_1.orderBy)(itemsWithMetadata, sortOrder.map((it) => it.fieldName), sortOrder.map((it) => it.order)).map((item) => item.item);
}
const filterPickerResults = ({ itemsToFilter, transformedQuery, }) => {
    // If we have specific vault name within the query then keep only those results
    // that match the specific vault name.
    if (transformedQuery.vaultName) {
        itemsToFilter = itemsToFilter.filter((item) => common_all_1.VaultUtils.getName(item.vault) === transformedQuery.vaultName);
    }
    // Ending the query with a dot adds special processing of showing matched descendents.
    if (transformedQuery.originalQuery.endsWith(".")) {
        itemsToFilter = sortForQueryEndingWithDot(transformedQuery, itemsToFilter);
    }
    if (transformedQuery.splitByDots && transformedQuery.splitByDots.length > 0) {
        const matcher = new common_all_1.OrderedMatcher(transformedQuery.splitByDots);
        itemsToFilter = itemsToFilter.filter((item) => matcher.isMatch(item.fname));
    }
    if (transformedQuery.wasMadeFromWikiLink) {
        // If we are dealing with a wiki link we want to show only the exact matches
        // for the link instead some fuzzy/partial matches.
        itemsToFilter = itemsToFilter.filter((item) => item.fname === transformedQuery.queryString);
    }
    return itemsToFilter;
};
exports.filterPickerResults = filterPickerResults;
/** This function presumes that 'CreateNew' should be shown and determines whether
 *  CreateNew should be at the top of the look up results or not. */
function shouldBubbleUpCreateNew({ numberOfExactMatches, querystring, bubbleUpCreateNew, }) {
    // We don't want to bubble up create new if there is an exact match since
    // vast majority of times if there is an exact match user wants to navigate to it
    // rather than create a new file with exact same file name in different vault.
    const noExactMatches = numberOfExactMatches === 0;
    // Note: one of the special characters is space/' ' which for now we want to allow
    // users to make the files with ' ' in them but we won't bubble up the create new
    // option for the special characters, including space. The more contentious part
    // about previous/current behavior is that we allow creation of files with
    // characters like '$' which FuseJS will not match (Meaning '$' will NOT match 'hi$world').
    const noSpecialQueryChars = !common_all_1.FuseEngine.doesContainSpecialQueryChars(querystring);
    if (lodash_1.default.isUndefined(bubbleUpCreateNew))
        bubbleUpCreateNew = true;
    return noSpecialQueryChars && noExactMatches && bubbleUpCreateNew;
}
/**
 * Sorts the given candidates notes by similarity to the query string in
 * descending order (the most similar come first) */
function sortBySimilarity(candidates, query) {
    return (candidates
        // To avoid duplicate similarity score calculation we will first map
        // to have the similarity score cached and then sort using cached value.
        .map((cand) => ({
        cand,
        similarityScore: string_similarity_1.default.compareTwoStrings(cand.fname, query),
    }))
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .map((v) => v.cand));
}
//# sourceMappingURL=utils.js.map