"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isYamlUnistParent = isYamlUnistParent;
exports.isMappingItem = isMappingItem;
exports.isPlain = isPlain;
exports.isQuoteSingle = isQuoteSingle;
exports.isQuoteDouble = isQuoteDouble;
exports.isYamlString = isYamlString;
exports.visitYamlUnist = visitYamlUnist;
exports.parseFrontmatter = parseFrontmatter;
exports.getFrontmatterTags = getFrontmatterTags;
const yaml_unist_parser_1 = require("yaml-unist-parser");
const lodash_1 = __importDefault(require("lodash"));
function isYamlUnistParent(node) {
    return lodash_1.default.isArray(node?.children);
}
function isMappingItem(node) {
    return node?.type === "mappingItem";
}
function isPlain(node) {
    return node?.type === "plain";
}
function isQuoteSingle(node) {
    return node?.type === "quoteSingle";
}
function isQuoteDouble(node) {
    return node?.type === "quoteDouble";
}
function isYamlString(node) {
    return isPlain(node) || isQuoteSingle(node) || isQuoteDouble(node);
}
/** `unist-util-visit`, kind of, but for YamlUnist.
 *
 * The reason this is duplicated here is that even though YamlUnist is
 * technically Unist compatible, the types don't match so we can't use the unist
 * function.
 */
function visitYamlUnist(node, visitor) {
    const toVisit = lodash_1.default.isArray(node) ? [...node] : [node];
    while (toVisit.length > 0) {
        const item = toVisit.pop();
        if (lodash_1.default.isUndefined(item))
            return;
        const out = visitor(item);
        if (out === false)
            return;
        if (isYamlUnistParent(item)) {
            toVisit.push(...item.children);
        }
    }
}
/** Get the mapping items (`key: value`) from the frontmatter. */
function parseFrontmatter(frontmatter) {
    const parsed = (0, yaml_unist_parser_1.parse)(lodash_1.default.isString(frontmatter) ? frontmatter : frontmatter.value);
    const mapping = parsed.children[0]?.children[1]?.children[0]
        ?.children;
    return mapping;
}
function getFrontmatterTags(frontmatter) {
    const tags = [];
    visitYamlUnist(frontmatter, (node) => {
        if (!isMappingItem(node))
            return;
        const [key, value] = node.children;
        let isTags = false;
        visitYamlUnist(key, (keyPlain) => {
            if (!isYamlString(keyPlain))
                return;
            if (keyPlain.value === "tags") {
                isTags = true;
                return false; // stop traversal
            }
            return;
        });
        if (!isTags)
            return;
        visitYamlUnist(value, (valuePlain) => {
            if (!isYamlString(valuePlain))
                return;
            tags.push(valuePlain);
            return;
        });
        return;
    });
    return tags;
}
//# sourceMappingURL=yaml.js.map