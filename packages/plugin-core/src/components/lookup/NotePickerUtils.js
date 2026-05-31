"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotePickerUtils = exports.PAGINATE_LIMIT = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const unified_1 = require("@dendronhq/unified");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const ExtensionProvider_1 = require("../../ExtensionProvider");
const logger_1 = require("../../logger");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const constants_1 = require("./constants");
const utils_1 = require("./utils");
exports.PAGINATE_LIMIT = 50;
class NotePickerUtils {
    static async createItemsFromSelectedWikilinks() {
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        const { vaults, wsRoot } = engine;
        // get selection
        const { text } = vsCodeUtils_1.VSCodeUtils.getSelection();
        if (text === undefined) {
            return;
        }
        const wikiLinks = unified_1.LinkUtils.extractWikiLinks(text);
        // dedupe wikilinks by value
        const uniqueWikiLinks = lodash_1.default.uniqBy(wikiLinks, "value");
        const activeNote = await ExtensionProvider_1.ExtensionProvider.getWSUtils().getActiveNote();
        if (!activeNote) {
            return;
        }
        // make a list of picker items from wikilinks
        const notesFromWikiLinks = await unified_1.LinkUtils.getNotesFromWikiLinks({
            activeNote,
            wikiLinks: uniqueWikiLinks,
            engine,
        });
        const pickerItemsFromSelection = await Promise.all(notesFromWikiLinks.map(async (note) => common_all_1.DNodeUtils.enhancePropForQuickInputV3({
            props: note,
            schema: note.schema
                ? (await engine.getSchema(note.schema.moduleId)).data
                : undefined,
            vaults,
            wsRoot,
        })));
        return pickerItemsFromSelection;
    }
    static createNoActiveItem({ fname, detail, }) {
        const props = common_all_1.DNodeUtils.create({
            id: constants_1.CREATE_NEW_LABEL,
            fname,
            type: "note",
            // @ts-ignore
            vault: {},
        });
        return {
            ...props,
            label: constants_1.CREATE_NEW_LABEL,
            detail,
            alwaysShow: true,
        };
    }
    static createNewWithTemplateItem({ fname, }) {
        const props = common_all_1.DNodeUtils.create({
            id: constants_1.CREATE_NEW_WITH_TEMPLATE_LABEL,
            fname,
            type: "note",
            // @ts-ignore
            vault: {},
        });
        const label = common_all_1.LabelUtils.createLabelWithHighlight({
            value: constants_1.CREATE_NEW_WITH_TEMPLATE_LABEL,
            highlight: {
                value: "$(beaker) [New] ",
                location: "prefix",
                expirationDate: new Date("2022-11-15"),
            },
        });
        return {
            ...props,
            label,
            detail: constants_1.CREATE_NEW_NOTE_WITH_TEMPLATE_DETAIL,
            alwaysShow: true,
        };
    }
    static getInitialValueFromOpenEditor() {
        const initialValue = path_1.default.basename(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "", ".md");
        return initialValue;
    }
    static getSelection(picker) {
        return [...picker.selectedItems];
    }
    static fetchRootQuickPickResults = async ({ engine, }) => {
        const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const nodes = await common_all_1.NoteLookupUtils.fetchRootResultsFromEngine(engine);
        return Promise.all(nodes.map(async (ent) => {
            return common_all_1.DNodeUtils.enhancePropForQuickInput({
                wsRoot,
                props: ent,
                schema: ent.schema
                    ? (await engine.getSchema(ent.schema.moduleId)).data
                    : undefined,
                vaults,
            });
        }));
    };
    /**
     * Get picker results without input from the user
     */
    static async fetchPickerResultsNoInput({ picker, }) {
        const engine = ExtensionProvider_1.ExtensionProvider.getDWorkspace().engine;
        const resp = await common_all_1.NoteLookupUtils.lookup({
            qsRaw: picker.value,
            engine,
            showDirectChildrenOnly: picker.showDirectChildrenOnly,
        });
        if (resp.length) {
            const note = resp[0];
            const isPerfectMatch = note.fname === picker.value;
            if (isPerfectMatch) {
                return [await this.enhanceNoteForQuickInput({ note, engine })];
            }
        }
        return [
            NotePickerUtils.createNoActiveItem({
                fname: picker.value,
                detail: constants_1.CREATE_NEW_NOTE_DETAIL,
            }),
        ];
    }
    static async enhanceNoteForQuickInput(input) {
        const { wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        return common_all_1.DNodeUtils.enhancePropForQuickInputV3({
            wsRoot,
            props: input.note,
            schema: input.note.schema
                ? (await input.engine.getSchema(input.note.schema.moduleId)).data
                : undefined,
            vaults,
        });
    }
    static async fetchPickerResults(opts) {
        const ctx = "createPickerItemsFromEngine";
        const start = process.hrtime();
        const { picker, transformedQuery, originalQS } = opts;
        const { engine, wsRoot, vaults } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        // if we are doing a query, reset pagination options
        utils_1.PickerUtilsV2.resetPaginationOpts(picker);
        let nodes = await engine.queryNotes({
            qs: transformedQuery.queryString,
            onlyDirectChildren: transformedQuery.onlyDirectChildren,
            originalQS,
        });
        if (nodes.length === 0) {
            return [];
        }
        // We need to filter our results to abide by different variations of our
        // transformed query. We should do filtering prior to doing pagination cut off.
        nodes = (0, utils_1.filterPickerResults)({ itemsToFilter: nodes, transformedQuery });
        logger_1.Logger.info({ ctx, msg: "post:queryNotes" });
        if (nodes.length > exports.PAGINATE_LIMIT) {
            picker.allResults = nodes;
            picker.offset = exports.PAGINATE_LIMIT;
            picker.moreResults = true;
            nodes = nodes.slice(0, exports.PAGINATE_LIMIT);
        }
        else {
            utils_1.PickerUtilsV2.resetPaginationOpts(picker);
        }
        const updatedItems = await Promise.all(nodes.map(async (ent) => common_all_1.DNodeUtils.enhancePropForQuickInputV3({
            wsRoot,
            props: ent,
            schema: ent.schema
                ? (await engine.getSchema(ent.schema.moduleId)).data
                : undefined,
            vaults,
            alwaysShow: picker.alwaysShowAll,
        })));
        const profile = (0, common_server_1.getDurationMilliseconds)(start);
        logger_1.Logger.info({ ctx, msg: "engine.query", profile });
        return updatedItems;
    }
    static getPickerValue(picker) {
        return [
            picker.prefix,
            picker.noteModifierValue,
            picker.selectionModifierValue,
        ]
            .filter((ent) => !lodash_1.default.isEmpty(ent))
            .join(".");
    }
}
exports.NotePickerUtils = NotePickerUtils;
//# sourceMappingURL=NotePickerUtils.js.map