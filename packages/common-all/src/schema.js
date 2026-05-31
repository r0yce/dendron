"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaCreationUtils = void 0;
const js_yaml_1 = __importDefault(require("js-yaml"));
const lodash_1 = __importDefault(require("lodash"));
/**
 * Utils for generating a Schema **JSON** file.  For working with Schema
 * objects, see SchemaUtils.
 */
class SchemaCreationUtils {
    static getBodyForTokenizedMatrix({ topLevel, tokenizedMatrix, }) {
        for (let r = 0; r < tokenizedMatrix.length; r += 1) {
            const tokenizedRow = tokenizedMatrix[r];
            let currParent = topLevel;
            // Top level is already taken care of hence we start out and index 1.
            for (let i = 1; i < tokenizedRow.length; i += 1) {
                if (lodash_1.default.isUndefined(currParent["children"])) {
                    currParent.children = [];
                }
                const currPattern = tokenizedRow[i];
                if (currParent.children?.some((ch) => ch.pattern === currPattern.pattern)) {
                    // There is already our pattern in the schema schema hierarchy, so we should
                    // not double add it, find the matching element and assign it as parent for next iteration.
                    currParent = currParent.children?.filter((ch) => ch.pattern === currPattern.pattern)[0];
                }
                else {
                    let curr;
                    if (currPattern.template) {
                        curr = {
                            pattern: currPattern.pattern,
                            template: currPattern.template,
                        };
                    }
                    else {
                        curr = {
                            pattern: currPattern.pattern,
                        };
                    }
                    if (currPattern.desc) {
                        curr["desc"] = currPattern.desc;
                    }
                    currParent.children?.push(curr);
                    currParent = curr;
                }
            }
        }
        return js_yaml_1.default.dump({
            version: 1,
            imports: [],
            schemas: [topLevel],
        });
    }
}
exports.SchemaCreationUtils = SchemaCreationUtils;
//# sourceMappingURL=schema.js.map