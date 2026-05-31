import { Node as UnistNode } from "unist";
export declare class TestUnifiedUtils {
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
    static verifyPrivateLink: ({ contents, value, }: {
        contents: string;
        value: string;
    }) => Promise<void>;
    /** Gets the descendent (child, or child of child...) node of a given node.
     *
     * @param node The root node to start descending from.
     * @param indices Left-to-right indexes for children, e.g. first index is for the root, second is for the child of the root...
     * @returns Requested child. Note that this function has no way of checking types, so the child you get might not be of the right type.
     */
    static getDescendantNode<Child extends UnistNode>(expect: any, node: UnistNode, ...indices: number[]): Child;
}
