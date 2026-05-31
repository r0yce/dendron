"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.schemaForType = exports.z = void 0;
const zod_1 = require("zod");
Object.defineProperty(exports, "z", { enumerable: true, get: function () { return zod_1.z; } });
const zod_validation_error_1 = require("zod-validation-error");
const utils_1 = require("./utils");
const error_1 = require("./error");
/**
 * util for defining zod schemas with external/custom types.
 * Origin: https://github.com/colinhacks/zod/issues/372#issuecomment-826380330
 * @returns a function to be called with a zod schema
 */
const schemaForType = () => (arg) => {
    return arg;
};
exports.schemaForType = schemaForType;
/**
 * Parse `zod` schema into `Result`
 * @param schema ZodType
 * @param raw unknown
 * @param msg string
 * @returns Result<T>
 */
const parse = (schema, raw, msg) => {
    const parsed = schema.safeParse(raw);
    if (parsed.success) {
        return (0, utils_1.ok)(parsed.data);
    }
    else {
        return (0, utils_1.err)(new error_1.DendronError({
            message: [
                (0, zod_validation_error_1.fromZodError)(parsed.error, { prefix: msg }).message,
                ...(schema.description ? [`Schema:${schema.description}`] : []),
            ].join("\n"),
        }));
    }
};
exports.parse = parse;
//# sourceMappingURL=parse.js.map