"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaLookupProviderFactory = exports.NoteLookupProviderFactory = void 0;
const SchemaLookupProvider_1 = require("./SchemaLookupProvider");
const NoteLookupProvider_1 = require("./NoteLookupProvider");
class NoteLookupProviderFactory {
    extension;
    constructor(extension) {
        this.extension = extension;
    }
    create(id, opts) {
        return new NoteLookupProvider_1.NoteLookupProvider(id, opts, this.extension);
    }
}
exports.NoteLookupProviderFactory = NoteLookupProviderFactory;
class SchemaLookupProviderFactory {
    extension;
    constructor(extension) {
        this.extension = extension;
    }
    create(id, opts) {
        return new SchemaLookupProvider_1.SchemaLookupProvider(id, opts, this.extension);
    }
}
exports.SchemaLookupProviderFactory = SchemaLookupProviderFactory;
//# sourceMappingURL=LookupProviderV3Factory.js.map