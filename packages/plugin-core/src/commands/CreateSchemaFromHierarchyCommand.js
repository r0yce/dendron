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
exports.CreateSchemaFromHierarchyCommand = exports.SchemaCreator = exports.UserQueries = exports.StopReason = exports.Hierarchy = exports.HierarchyLevel = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const fs = __importStar(require("fs"));
const _ = __importStar(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const pluginSchemaUtils_1 = require("../pluginSchemaUtils");
const pluginVaultUtils_1 = require("../pluginVaultUtils");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
/**
 * Represents the level of the file hierarchy that will have the '*' pattern.
 * */
class HierarchyLevel {
    label;
    hierarchyTokens;
    idx;
    noteMatchRegex;
    constructor(idx, tokens) {
        this.hierarchyTokens = tokens;
        this.idx = idx;
        // https://regex101.com/r/kmOBbq/1
        this.noteMatchRegex = new RegExp("^" + this.hierarchyTokens.slice(0, this.idx).join(".") + "\\..*");
        this.label =
            [...tokens.slice(0, idx), "*", ...tokens.slice(idx + 1)].join(".") +
                ` (${tokens[idx]})`;
    }
    /** Id of the first token of the hierarchy (will be utilized for identifying the schema) */
    topId() {
        return this.hierarchyTokens[0];
    }
    tokenize(fname) {
        const tokens = fname.split(".");
        return [...tokens.slice(0, this.idx), "*", ...tokens.slice(this.idx + 1)];
    }
    isCandidateNote(fname) {
        return this.noteMatchRegex.test(fname);
    }
    getDefaultSchemaName() {
        // Schema naming currently is set to be a single level deep hence
        // we should avoid using '.' in schema names.
        return this.hierarchyTokens.slice(0, this.idx).join("-");
    }
}
exports.HierarchyLevel = HierarchyLevel;
class Hierarchy {
    fname;
    levels;
    tokens;
    constructor(fname) {
        this.fname = fname;
        this.tokens = fname.split(".");
        this.levels = [];
        for (let i = 0; i < this.tokens.length; i += 1) {
            this.levels.push(new HierarchyLevel(i, this.tokens));
        }
    }
    depth() {
        return this.tokens.length;
    }
    topId() {
        // noUnchecked: levels is populated in constructor; guard for safety per Batch 6 plan on CreateSchema residuals.
        return this.levels.length > 0 ? this.levels[0].topId() : undefined; // ! after explicit length > 0 guard (only allowed form per SKILL Batch 5+/6+ debug launch sweep)
    }
    /**
     * Levels of the hierarchy that we deem as viable options for creating a schema for.
     * We remove the first level since having something like `*.h1.h2` with `*` at the
     * beginning will match all hierarchies. Therefore we slice off the first level.
     *
     * */
    getSchemaebleLevels() {
        return this.levels.slice(1);
    }
}
exports.Hierarchy = Hierarchy;
function isDescendentOf(descendentCandidate, ancestorCandidate) {
    const isChild = descendentCandidate.note.fname.startsWith(ancestorCandidate.note.fname + ".");
    return isChild;
}
function createCandidatesMapByFname(items) {
    return new Map(items.map((item) => [item.note.fname, item]));
}
function getUriFromSchema(schema) {
    const vaultPath = (0, common_server_1.vault2Path)({
        vault: schema.vault,
        wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
    });
    const uri = vscode_1.Uri.file(common_all_1.SchemaUtils.getPath({ root: vaultPath, fname: schema.fname }));
    return uri;
}
function getSchemaUri(vault, schemaName) {
    const vaultPath = (0, common_server_1.vault2Path)({
        vault,
        wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
    });
    const uri = vscode_1.Uri.file(common_all_1.SchemaUtils.getPath({ root: vaultPath, fname: schemaName }));
    return uri;
}
var StopReason;
(function (StopReason) {
    StopReason["SCHEMA_WITH_TOP_ID_ALREADY_EXISTS"] = "SCHEMA_WITH_TOP_ID_ALREADY_EXISTS";
    StopReason["NOTE_DID_NOT_HAVE_REQUIRED_DEPTH"] = "NOTE_DID_NOT_HAVE_REQUIRED_DEPTH";
    StopReason["DID_NOT_PICK_HIERARCHY_LEVEL"] = "DID_NOT_PICK_HIERARCHY_LEVEL";
    StopReason["CANCELLED_PATTERN_SELECTION"] = "CANCELLED_PATTERN_SELECTION";
    StopReason["UNSELECTED_ALL_PATTERNS"] = "UNSELECTED_ALL_PATTERNS";
    StopReason["DID_NOT_PICK_SCHEMA_FILE_NAME"] = "DID_NOT_PICK_SCHEMA_FILE_NAME";
})(StopReason || (exports.StopReason = StopReason = {}));
/**
 * Encapsulates methods that are responsible for user interaction when
 * asking user for input data.
 * */
class UserQueries {
    static async promptUserForSchemaFileName(hierarchyLevel, vault) {
        let alreadyExists = false;
        let schemaName;
        do {
            // eslint-disable-next-line no-await-in-loop
            schemaName = await vsCodeUtils_1.VSCodeUtils.showInputBox({
                value: hierarchyLevel.getDefaultSchemaName(),
            });
            if (!schemaName) {
                // Cancelled.
                return schemaName;
            }
            alreadyExists = fs.existsSync(getSchemaUri(vault, schemaName).fsPath);
            if (alreadyExists) {
                vscode.window.showInformationMessage(`Schema with name '${schemaName}' already exists. Please choose a different name.`);
            }
        } while (alreadyExists);
        return schemaName;
    }
    static async promptUserToSelectHierarchyLevel(currDocFsPath) {
        const hierarchy = new Hierarchy(path_1.default.basename(currDocFsPath, ".md"));
        if (hierarchy.depth() <= 1) {
            // We require some depth to the hierarchy to be able to choose a variance
            // pattern within in it. More info within Hierarchy object.
            await vscode.window.showErrorMessage(`Pick a note with note depth greater than 1.`);
            return { stopReason: StopReason.NOTE_DID_NOT_HAVE_REQUIRED_DEPTH };
        }
        if (await pluginSchemaUtils_1.PluginSchemaUtils.doesSchemaExist(hierarchy.topId())) {
            // To avoid unpredictable conflicts of schemas: for now we will not allow
            // creation schemas for hierarchies that already have existing top
            // level schema id. Instead we will pop up error message with navigation
            // action to the existing schema.
            const msgGoToSchema = "Go to schema";
            const action = await vscode.window.showErrorMessage(`Schema with top level id: '${hierarchy.topId()}' already exists.`, msgGoToSchema);
            if (action === msgGoToSchema) {
                const schema = await pluginSchemaUtils_1.PluginSchemaUtils.getSchema(hierarchy.topId());
                if (schema.data) {
                    await vsCodeUtils_1.VSCodeUtils.openFileInEditor(getUriFromSchema(schema.data));
                }
            }
            return { stopReason: StopReason.SCHEMA_WITH_TOP_ID_ALREADY_EXISTS };
        }
        const hierarchyLevel = await vsCodeUtils_1.VSCodeUtils.showQuickPick(hierarchy.getSchemaebleLevels(), {
            title: "Select hierarchy level that will vary within note hierarchies.",
        });
        if (_.isUndefined(hierarchyLevel)) {
            return { stopReason: StopReason.DID_NOT_PICK_HIERARCHY_LEVEL };
        }
        else {
            return { hierarchyLevel };
        }
    }
    static promptUserToPickPatternsFromCandidates(labeledCandidates) {
        let hasResolved = false;
        return new Promise((resolve) => {
            // There are limitations with .showQuickPick() for our use case (like checking/unchecking items)
            // hence we are using lower level createQuickPick().
            const quickPick = vscode.window.createQuickPick();
            quickPick.canSelectMany = true;
            quickPick.items = labeledCandidates;
            quickPick.selectedItems = quickPick.items;
            // By the time we get to onDidChangeSelection function quickPick.selectedItems
            // is already changed, hence we will keep our own copy of what was previously selected.
            let prevSelected = quickPick.selectedItems;
            quickPick.onDidChangeSelection(() => {
                const currSelected = quickPick.selectedItems;
                if (this.hasUnselected(prevSelected, currSelected)) {
                    quickPick.selectedItems = this.determineAfterUnselect(prevSelected, currSelected);
                }
                else if (this.hasSelected(prevSelected, currSelected)) {
                    quickPick.selectedItems = this.determineAfterSelect(prevSelected, currSelected, labeledCandidates);
                }
                prevSelected = quickPick.selectedItems;
            });
            quickPick.onDidHide(() => {
                if (!hasResolved) {
                    resolve({ stopReason: StopReason.CANCELLED_PATTERN_SELECTION });
                    hasResolved = true;
                }
                quickPick.dispose();
            });
            quickPick.onDidAccept(() => {
                if (quickPick.selectedItems.length === 0) {
                    vscode.window.showErrorMessage(`Must select at least one pattern for schema creation.`);
                    resolve({ stopReason: StopReason.UNSELECTED_ALL_PATTERNS });
                }
                else {
                    resolve({ pickedCandidates: quickPick.selectedItems });
                }
                hasResolved = true;
                quickPick.hide();
            });
            quickPick.show();
        });
    }
    static determineAfterSelect(prevSelected, currSelected, all) {
        // When something is selected we want to make sure its hierarchical parents are selected
        // as well, since it makes no sense to have 'h1.h2.h3' selected without having
        // 'h1.h2' selected (since we will still need to create a schema path for 'h1.h2'.
        const justChecked = this.findCheckedItem(prevSelected, currSelected);
        const ancestorsToCheck = all.filter((ancestorCandidate) => isDescendentOf(justChecked, ancestorCandidate));
        // Create a map to avoid double counting ancestors
        const selectedMap = createCandidatesMapByFname(currSelected);
        ancestorsToCheck.forEach((ancestor) => selectedMap.set(ancestor.note.fname, ancestor));
        return Array.from(selectedMap.values());
    }
    static determineAfterUnselect(prevSelected, currSelected) {
        // When something is unselected we want to unselect all hierarchical
        // children of that note.
        const justUnchecked = this.findUncheckedItem(prevSelected, currSelected);
        const withoutUncheckedChildren = currSelected.filter((item) => !isDescendentOf(item, justUnchecked));
        return withoutUncheckedChildren;
    }
    static hasSelected(prevSelected, currSelected) {
        return prevSelected.length < currSelected.length;
    }
    static hasUnselected(prevSelected, currSelected) {
        return prevSelected.length > currSelected.length;
    }
    /** Finds the item from previously selected that is not selected anymore. */
    static findUncheckedItem(prevSelected, currSelected) {
        const map = createCandidatesMapByFname(currSelected);
        // The only time there will be more than one item unchecked in a single update event
        // is when all the items are unchecked at the same time. At such case we don't need to
        // worry about unchecking things anyway, hence we can just grab the first unchecked.
        const uncheckedItem = prevSelected.filter((item) => !map.has(item.note.fname))[0];
        return uncheckedItem;
    }
    /** Finds newly selected item.*/
    static findCheckedItem(prevSelected, currSelected) {
        const map = createCandidatesMapByFname(prevSelected);
        // The only time there will be more than checked one item in a single event
        // is when everything got checked. In that case we don't need to worry
        // about checking the parents anyway, hence we can just grab the first item.
        return currSelected.filter((item) => !map.has(item.note.fname))[0]; // ! after filter (explicit non-empty expectation in context); only allowed form per strict-mode-fixer SKILL (debug launch sweep 2026-05-31)
    }
}
exports.UserQueries = UserQueries;
/**
 * Responsible for forming the schema body from the hierarchical files that user chose. */
class SchemaCreator {
    static makeSchemaBody({ candidates, hierarchyLevel, }) {
        const tokenizedMatrix = candidates.map((cand) => hierarchyLevel.tokenize(cand.note.fname).map((value) => {
            return { pattern: value };
        }));
        const topLevel = {
            // Top level schema requires an id to function.
            id: hierarchyLevel.topId(),
            title: hierarchyLevel.topId(),
            parent: "root",
        }; // 4-axis boundary for SchemaInMaking (local but used in residual CreateSchema constructions under exactOptional); Batch 6 debug launch sweep 2026-05-31 (per Strict-Fixer plan on CreateSchema/SchemaInMaking + user mandate to 0 + full test + Clean Host smoke + merge); see 4-axis + ADR 0001.
        return common_all_1.SchemaCreationUtils.getBodyForTokenizedMatrix({
            topLevel,
            tokenizedMatrix,
        });
    }
}
exports.SchemaCreator = SchemaCreator;
class CreateSchemaFromHierarchyCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.CREATE_SCHEMA_FROM_HIERARCHY.key;
    async sanityCheck() {
        const activeTextEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        if (_.isUndefined(activeTextEditor) ||
            !common_all_1.NoteUtils.isNote(activeTextEditor.document.uri)) {
            return "No note document open. Must have note document open for Create Schema from Hierarchy command.";
        }
        return;
    }
    async gatherInputs() {
        const activeTextEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        if (!activeTextEditor) {
            // Error message will be displayed from the sanityCheck function.
            return;
        }
        const currDocumentFSPath = activeTextEditor.document.uri.fsPath;
        const vault = pluginVaultUtils_1.PluginVaultUtils.getVaultByNotePath({
            fsPath: currDocumentFSPath,
        });
        const hierLvlOpts = await UserQueries.promptUserToSelectHierarchyLevel(currDocumentFSPath);
        if (hierLvlOpts.hierarchyLevel === undefined) {
            // User must have cancelled the command or the note was deemed not valid for
            // schema from hierarchy creation.
            return { isHappy: false, stopReason: hierLvlOpts.stopReason };
        }
        const candidates = await this.getHierarchyCandidates(hierLvlOpts.hierarchyLevel);
        const patternsOpts = await UserQueries.promptUserToPickPatternsFromCandidates(candidates);
        if (_.isUndefined(patternsOpts.pickedCandidates)) {
            return { isHappy: false, stopReason: patternsOpts.stopReason };
        }
        const schemaName = await UserQueries.promptUserForSchemaFileName(hierLvlOpts.hierarchyLevel, vault);
        if (schemaName === undefined || schemaName.length === 0) {
            // User must have cancelled the command, get out.
            return {
                isHappy: false,
                stopReason: StopReason.DID_NOT_PICK_SCHEMA_FILE_NAME,
            };
        }
        const uri = getSchemaUri(vault, schemaName);
        const commandOpts = {
            candidates: patternsOpts.pickedCandidates,
            schemaName,
            hierarchyLevel: hierLvlOpts.hierarchyLevel,
            uri,
            isHappy: true,
        };
        return commandOpts;
    }
    async getHierarchyCandidates(hierarchyLevel) {
        const { engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const engineNotes = await engine.findNotesMeta({ excludeStub: false });
        const noteCandidates = _.filter(engineNotes, (n) => hierarchyLevel.isCandidateNote(n.fname));
        const candidates = this.formatSchemaCandidates(noteCandidates, hierarchyLevel);
        return this.filterDistinctLabel(candidates);
    }
    filterDistinctLabel(candidates) {
        const distinct = [];
        new Map(candidates.map((cand) => [cand.label, cand])).forEach((value) => {
            distinct.push(value);
        });
        return distinct;
    }
    formatSchemaCandidates(noteCandidates, hierarchyLevel) {
        return noteCandidates
            .map((note) => {
            const tokens = note.fname.split(".");
            const patternStr = [
                ...tokens.slice(0, hierarchyLevel.idx),
                "*",
                ...tokens.slice(hierarchyLevel.idx + 1),
            ].join(".");
            return {
                label: patternStr,
                detail: `Will match notes like ${note.fname}`,
                note,
            };
        })
            .sort((a, b) => {
            if (a.note.fname === b.note.fname) {
                return 0;
            }
            return a.note.fname < b.note.fname ? -1 : 1;
        });
    }
    async execute({ candidates, hierarchyLevel, uri, isHappy, }) {
        if (!isHappy) {
            return { successfullyCreated: false };
        }
        const schemaBody = SchemaCreator.makeSchemaBody({
            candidates: candidates,
            hierarchyLevel: hierarchyLevel,
        });
        fs.writeFileSync(uri.fsPath, schemaBody);
        await ExtensionProvider_1.ExtensionProvider.getExtension().schemaSyncService.saveSchema({
            uri: uri,
            isBrandNewFile: true,
        });
        await vsCodeUtils_1.VSCodeUtils.openFileInEditor(uri);
        return { successfullyCreated: true };
    }
    addAnalyticsPayload(opts, out) {
        if (out && out.successfullyCreated) {
            return { successfullyCreated: true };
        }
        else if (opts && opts.stopReason) {
            return {
                stopReason: opts.stopReason,
                successfullyCreated: false,
            };
        }
        else {
            return { successfullyCreated: false };
        }
    }
}
exports.CreateSchemaFromHierarchyCommand = CreateSchemaFromHierarchyCommand;
//# sourceMappingURL=CreateSchemaFromHierarchyCommand.js.map