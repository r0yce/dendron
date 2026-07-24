/**
 * VS Code markdown editor helpers (legacy preview, fenced blocks, code spans, URL-at-cursor).
 */
import _ from "lodash";
import vscode, {
  commands,
  extensions,
  Selection,
  TextDocument,
} from "vscode";
import { REGEX_CODE_SPAN, REGEX_FENCED_CODE_BLOCK } from "./paths";

export class MarkdownUtils {
  static hasLegacyPreview() {
    return !_.isUndefined(
      extensions.getExtension("dendron.dendron-markdown-preview-enhanced")
    );
  }

  static showLegacyPreview() {
    return commands.executeCommand("markdown-preview-enhanced.openPreview");
  }
}

export const isInFencedCodeBlock = (
  documentOrContent: TextDocument | string,
  lineNum: number
): boolean => {
  const content =
    typeof documentOrContent === "string"
      ? documentOrContent
      : documentOrContent.getText();
  const textBefore = content
    .slice(0, positionToOffset(content, { line: lineNum, column: 0 }))
    .replace(REGEX_FENCED_CODE_BLOCK, "")
    .replace(/<!--[\W\w]+?-->/g, "");
  // So far `textBefore` should contain no valid fenced code block or comment
  return /^( {0,3}|\t)```[^`\r\n]*$[\w\W]*$/gm.test(textBefore);
};

export const getURLAt = (editor: vscode.TextEditor | undefined): string => {
  if (editor) {
    const docText = editor.document.getText();
    const offsetStart = editor.document.offsetAt(editor.selection.start);
    const offsetEnd = editor.document.offsetAt(editor.selection.end);
    const selectedText = docText.substring(offsetStart, offsetEnd);
    const selectUri = true;
    const validUriChars = "A-Za-z0-9-._~:/?#@!$&'*+,;%=\\\\";
    const invalidUriChars = ["[^", validUriChars, "]"].join("");
    const regex = new RegExp(invalidUriChars);

    if (selectedText !== "" && regex.test(selectedText)) {
      return "";
    }

    const leftSplit = docText.substring(0, offsetStart).split(regex);
    const leftText = leftSplit[leftSplit.length - 1]!;
    const selectStart = offsetStart - leftText.length;

    const rightSplit = docText.substring(offsetEnd, docText.length);
    const rightText = rightSplit.substring(0, regex.exec(rightSplit)?.index);
    const selectEnd = offsetEnd + rightText.length;

    if (selectEnd && selectStart) {
      if (
        selectStart >= 0 &&
        selectStart < selectEnd &&
        selectEnd <= docText.length
      ) {
        if (selectUri) {
          editor.selection = new Selection(
            editor.document.positionAt(selectStart),
            editor.document.positionAt(selectEnd)
          );
          editor.revealRange(editor.selection);
        }
        return [leftText, selectedText, rightText].join("");
      }
    }
  }
  return "";
};

export const positionToOffset = (
  content: string,
  position: { line: number; column: number }
) => {
  if (position.line < 0) {
    throw new Error("Illegal argument: line must be non-negative");
  }

  if (position.column < 0) {
    throw new Error("Illegal argument: column must be non-negative");
  }

  const lineBreakOffsetsByIndex = lineBreakOffsetsByLineIndex(content);
  if (lineBreakOffsetsByIndex[position.line] !== undefined) {
    return (
      (lineBreakOffsetsByIndex[position.line - 1] || 0) + position.column || 0
    );
  }

  return 0;
};

export const lineBreakOffsetsByLineIndex = (value: string): number[] => {
  const result = [];
  let index = value.indexOf("\n");

  while (index !== -1) {
    result.push(index + 1);
    index = value.indexOf("\n", index + 1);
  }

  result.push(value.length + 1);

  return result;
};

export const isInCodeSpan = (
  documentOrContent: TextDocument | string,
  lineNum: number,
  offset: number
): boolean => {
  const content =
    typeof documentOrContent === "string"
      ? documentOrContent
      : documentOrContent.getText();
  const textBefore = content
    .slice(0, positionToOffset(content, { line: lineNum, column: offset }))
    .replace(REGEX_CODE_SPAN, "")
    .trim();

  return /`[^`]*$/gm.test(textBefore);
};

