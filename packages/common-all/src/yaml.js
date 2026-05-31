"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toStr = exports.fromStr = void 0;
const js_yaml_1 = __importDefault(require("js-yaml"));
const neverthrow_1 = require("neverthrow");
const constants_1 = require("./constants");
const error_1 = require("./error");
const load = (0, neverthrow_1.fromThrowable)(js_yaml_1.default.load, (error) => {
    return new error_1.DendronError({
        message: error instanceof js_yaml_1.default.YAMLException
            ? `${error.name}: ${error.message}`
            : `YAMLException`,
        severity: constants_1.ERROR_SEVERITY.FATAL,
        ...(error instanceof Error && { innerError: error }),
    });
});
const dump = (0, neverthrow_1.fromThrowable)(js_yaml_1.default.dump, (error) => {
    return new error_1.DendronError({
        message: error instanceof js_yaml_1.default.YAMLException
            ? `${error.name}: ${error.message}`
            : `YAMLException`,
        severity: constants_1.ERROR_SEVERITY.FATAL,
        ...(error instanceof Error && { innerError: error }),
    });
});
const fromStr = (str, overwriteDuplicate) => {
    return load(str, {
        schema: js_yaml_1.default.JSON_SCHEMA,
        json: overwriteDuplicate ?? false,
    });
};
exports.fromStr = fromStr;
const toStr = (data) => {
    return dump(data, { indent: 4, schema: js_yaml_1.default.JSON_SCHEMA });
};
exports.toStr = toStr;
//# sourceMappingURL=yaml.js.map