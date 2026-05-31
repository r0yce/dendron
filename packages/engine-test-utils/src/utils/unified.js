"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestUnifiedUtils = void 0;
const lodash_1 = __importDefault(require("lodash"));
const _1 = require(".");
class TestUnifiedUtils {
    /**
     * Check if a link is private
     *
     * NOTE: by default, the `value` is capitalized
     *
     * Private links generate the following HTML
     * <a href=\"/notes/beta\">Beta</a> <a title=\"Private\"
     *   style=\"color: brown\" href=\"https://wiki.dendron.so/notes/hfyvYGJZQiUwQaaxQO27q.html\" target=\"_blank\">
     *  ${value}(Private)
     * </a>
     *
     * @param link: name of link
     */
    static verifyPrivateLink = ({ contents, value, }) => {
        return (0, _1.checkString)(contents, 'class="private"', value + " (Private)");
    };
    /** Gets the descendent (child, or child of child...) node of a given node.
     *
     * @param node The root node to start descending from.
     * @param indices Left-to-right indexes for children, e.g. first index is for the root, second is for the child of the root...
     * @returns Requested child. Note that this function has no way of checking types, so the child you get might not be of the right type.
     */
    static getDescendantNode(expect, node, ...indices) {
        const index = indices.shift();
        if (lodash_1.default.isUndefined(index))
            return node;
        // TODO: pass in instead of call
        expect(node).toHaveProperty("children");
        // @ts-ignore
        expect(node.children).toHaveProperty("length");
        // @ts-ignore
        const children = node.children;
        expect(children.length).toBeGreaterThanOrEqual(index);
        return TestUnifiedUtils.getDescendantNode(expect, children[index], ...indices);
    }
}
exports.TestUnifiedUtils = TestUnifiedUtils;
//# sourceMappingURL=unified.js.map