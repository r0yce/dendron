"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteLookupProvider = void 0;
const common_all_1 = require("@dendronhq/common-all");
const inject_1 = require("../../../di/inject");
const vscode_1 = require("vscode");
/**
 * Provides Note Lookup results by querying the engine.
 */
let NoteLookupProvider = class NoteLookupProvider {
    engine;
    constructor(engine) {
        this.engine = engine;
    }
    async provideItems(opts) {
        const { token, showDirectChildrenOnly, workspaceState } = opts;
        const { pickerValue } = opts;
        const transformedQuery = common_all_1.NoteLookupUtils.transformQueryString({
            query: pickerValue,
            onlyDirectChildren: showDirectChildrenOnly,
        });
        const queryOrig = common_all_1.NoteLookupUtils.slashToDot(pickerValue);
        // const queryUpToLastDot =
        //   queryOrig.lastIndexOf(".") >= 0
        //     ? queryOrig.slice(0, queryOrig.lastIndexOf("."))
        //     : undefined;
        try {
            // if empty string, show all 1st level results
            if (transformedQuery.queryString === "") {
                return this.fetchRootQuickPickResults();
            }
            // const items: NoteQuickInput[] = [...picker.items];
            // let updatedItems = PickerUtilsV2.filterDefaultItems(items);
            if (token?.isCancellationRequested) {
                return [];
            }
            const updatedItems = await this.fetchPickerResults({
                transformedQuery,
                originalQS: queryOrig,
                workspaceState,
            });
            if (token?.isCancellationRequested) {
                return [];
            }
            //TODO: Dunno if we still need this?
            // check if single item query, vscode doesn't surface single letter queries
            // we need this so that suggestions will show up
            // TODO: this might be buggy since we don't apply filter middleware
            // if (
            //   picker.activeItems.length === 0 &&
            //   transformedQuery.queryString.length === 1
            // ) {
            //   picker.items = updatedItems;
            //   picker.activeItems = picker.items;
            //   return;
            // }
            // TODO: Clean up Schema Section
            // add schema completions
            // if (
            //   !_.isUndefined(queryUpToLastDot) &&
            //   !transformedQuery.wasMadeFromWikiLink
            // ) {
            //   const results = SchemaUtils.matchPath({
            //     notePath: queryUpToLastDot,
            //     schemaModDict: workspaceState.schemas,
            //   });
            //   // since namespace matches everything, we don't do queries on that
            //   if (results && !results.namespace) {
            //     const { schema, schemaModule } = results;
            //     const dirName = queryUpToLastDot;
            //     const candidates = schema.children
            //       .map((ent) => {
            //         const mschema = schemaModule.schemas[ent];
            //         if (
            //           SchemaUtils.hasSimplePattern(mschema, {
            //             isNotNamespace: true,
            //           })
            //         ) {
            //           const pattern = SchemaUtils.getPattern(mschema, {
            //             isNotNamespace: true,
            //           });
            //           const fname = [dirName, pattern].join(".");
            //           return NoteUtils.fromSchema({
            //             schemaModule,
            //             schemaId: ent,
            //             fname,
            //             vault: workspaceState.vaults[0], // TODO: Fix
            //             // vault: PickerUtilsV2.getVaultForOpenEditor(),
            //           });
            //         }
            //         return;
            //       })
            //       .filter(Boolean) as NoteProps[];
            //     let candidatesToAdd = _.differenceBy(
            //       candidates,
            //       updatedItems,
            //       (ent) => ent.fname
            //     );
            //     candidatesToAdd = this.sortBySimilarity(
            //       candidatesToAdd,
            //       transformedQuery.originalQuery
            //     );
            //     updatedItems = updatedItems.concat(
            //       candidatesToAdd.map((ent) => {
            //         return DNodeUtils.enhancePropForQuickInputV4({
            //           props: ent,
            //         });
            //       })
            //     );
            //   }
            // }
            // We do NOT want quick pick to filter out items since it does not match with FuseJS.
            updatedItems.forEach((item) => {
                item.alwaysShow = true;
            });
            return updatedItems;
        }
        catch (err) {
            vscode_1.window.showErrorMessage(err);
            throw Error(err);
        }
    }
    fetchRootQuickPickResults = async () => {
        const nodes = await common_all_1.NoteLookupUtils.fetchRootResultsFromEngine(this.engine);
        return nodes.map((ent) => {
            return common_all_1.DNodeUtils.enhancePropForQuickInputV4({
                props: ent,
            });
        });
    };
    async fetchPickerResults(opts) {
        const { transformedQuery, originalQS } = opts;
        const nodes = await this.engine.queryNotes({
            qs: transformedQuery.queryString,
            onlyDirectChildren: transformedQuery.onlyDirectChildren,
            originalQS,
        });
        return Promise.all(nodes.map(async (ent) => common_all_1.DNodeUtils.enhancePropForQuickInputV4({
            props: ent,
        })));
    }
};
exports.NoteLookupProvider = NoteLookupProvider;
exports.NoteLookupProvider = NoteLookupProvider = __decorate([
    (0, inject_1.injectable)(),
    __param(0, (0, inject_1.inject)("ReducedDEngine")),
    __metadata("design:paramtypes", [Object])
], NoteLookupProvider);
//# sourceMappingURL=NoteLookupProvider.js.map