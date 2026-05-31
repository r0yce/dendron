"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuseQueryStore = void 0;
const lodash_1 = __importDefault(require("lodash"));
const neverthrow_1 = require("neverthrow");
const dnode_1 = require("../dnode");
const error_1 = require("../error");
const FuseEngine_1 = require("../FuseEngine");
class FuseQueryStore {
    fuseEngine;
    constructor(opts) {
        this.fuseEngine = new FuseEngine_1.FuseEngine({
            fuzzThreshold: lodash_1.default.defaults(opts, { fuzzThreshold: 0.2 }).fuzzThreshold,
        });
    }
    addSchemaToIndex(schema) {
        return neverthrow_1.ResultAsync.fromPromise(Promise.resolve(this.fuseEngine.schemaIndex.add(dnode_1.SchemaUtils.getModuleRoot(schema))), (err) => new error_1.DendronError({
            message: "issue adding schema to index",
            innerError: err,
        }));
    }
    queryNotes(qs, opts) {
        const items = this.fuseEngine.queryNote({
            qs,
            ...opts,
        });
        return neverthrow_1.ResultAsync.fromSafePromise(Promise.resolve(items));
    }
    querySchemas(qs) {
        const schemaIds = this.fuseEngine.querySchema({ qs });
        return neverthrow_1.ResultAsync.fromSafePromise(Promise.resolve(schemaIds));
    }
    removeSchemaFromIndex(schema) {
        this.fuseEngine.removeSchemaFromIndex(schema);
        return neverthrow_1.ResultAsync.fromSafePromise(Promise.resolve());
    }
    replaceNotesIndex(props) {
        return neverthrow_1.ResultAsync.fromPromise(this.fuseEngine.replaceNotesIndex(props), (err) => new error_1.DendronError({
            message: "issue replacing index",
            innerError: err,
        }));
    }
    replaceSchemasIndex(props) {
        return neverthrow_1.ResultAsync.fromPromise(this.fuseEngine.replaceSchemaIndex(props), (err) => new error_1.DendronError({
            message: "issue replacing index",
            innerError: err,
        }));
    }
    updateNotesIndex(changes) {
        return neverthrow_1.ResultAsync.fromPromise(
        // return signature requires us to return void vs void[]
        this.fuseEngine.updateNotesIndex(changes).then(() => { }), (err) => new error_1.DendronError({
            message: "issue updating index",
            innerError: err,
        }));
    }
    updateSchemasIndex() {
        throw new Error("Method not implemented.");
    }
}
exports.FuseQueryStore = FuseQueryStore;
//# sourceMappingURL=FuseMetadataStore.js.map