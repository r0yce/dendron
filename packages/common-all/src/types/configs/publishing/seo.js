"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seoSchema = void 0;
exports.genDefaultSEOConfig = genDefaultSEOConfig;
const parse_1 = require("../../../parse");
/**
 * Generate default {@link SEOConfig}
 * @returns SEOConfig
 */
function genDefaultSEOConfig() {
    return {
        title: "Dendron",
        description: "Personal Knowledge Space",
    };
}
/**
 * `zod` schema to be used with `parse.ts` for validation.
 */
exports.seoSchema = (0, parse_1.schemaForType)()(parse_1.z.object({
    title: parse_1.z.string().optional().default("Dendron"),
    description: parse_1.z.string().optional().default("Personal Knowledge Space"),
    author: parse_1.z.string().optional(),
    twitter: parse_1.z.string().optional(),
    image: parse_1.z
        .object({
        url: parse_1.z.string(),
        alt: parse_1.z.string(),
    })
        .optional(),
}));
//# sourceMappingURL=seo.js.map