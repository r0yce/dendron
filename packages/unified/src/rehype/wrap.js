"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrap = void 0;
const unist_util_visit_1 = __importDefault(require("unist-util-visit"));
// @ts-ignore
const hast_util_parse_selector_1 = __importDefault(require("hast-util-parse-selector"));
// @ts-ignore
const hast_util_select_1 = require("hast-util-select");
const plugin = function plugin(opts) {
    function transformer(tree) {
        const root = tree;
        for (const match of (0, hast_util_select_1.selectAll)(opts.selector, root)) {
            const wrapper = (0, hast_util_parse_selector_1.default)(opts.wrapper);
            (0, unist_util_visit_1.default)(tree, match, (node, i, parent) => {
                wrapper.children = [node];
                if (parent) {
                    parent.children[i] = wrapper;
                }
            });
        }
    }
    return transformer;
};
exports.wrap = plugin;
//# sourceMappingURL=wrap.js.map