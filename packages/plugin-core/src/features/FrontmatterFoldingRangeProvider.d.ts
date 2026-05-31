import vscode from "vscode";
export default class FrontmatterFoldingRangeProvider implements vscode.FoldingRangeProvider {
    /**
     * Returns the folding range of the frontmatter section of a markdown note.
     * @param document The document we want to find the folding range.
     * @returns The frontmatter folding range of given Dendron note as an array.
     */
    provideFoldingRanges(document: vscode.TextDocument): Promise<vscode.FoldingRange[]>;
}
