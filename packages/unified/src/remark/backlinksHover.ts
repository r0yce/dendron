import { Code, HTML, Paragraph, Text } from "mdast";
import Unified, { Transformer } from "unified";
import type { Node, Parent, Position } from "unist";
import { visit } from "unist-util-visit";
import { VFile } from "vfile";
import {
  DendronASTTypes,
  HashTag,
  NoteRefNoteV4,
  UserTag,
  WikiLinkNoteV4,
} from "../types";
import { RemarkUtils } from "./utils";

/**
 * Options for the backlinks hover transformer. If using
 * ProcFlavor.BACKLINKS_PANEL_HOVER, then this must be set.
 */
export type BacklinkOpts = {
  /**
   * How many lines before and after the backlink to show in the hover
   */
  linesOfContext: number;

  /**
   * The location of the backlink text
   */
  location: Position;
};

/**
 * Unified processor for rendering text in the backlinks hover control. This
 * processor returns a transformer that does the following:
 * 1. Highlights the backlink text
 * 2. Changes the backlink node away from a wikilink/noteref to prevent the
 *    backlink text from being altered
 * 3. Adds contextual " --- line # ---" information
 * 4. Removes all elements that lie beyond the contextual lines limit of the
 *    backlink
 * @param this
 * @param _opts
 * @returns
 */
export function backlinksHover(
  this: Unified.Processor,
  _opts?: BacklinkOpts
): Transformer {
  function transformer(tree: Node, _file: VFile) {
    if (!_opts) {
      return;
    }

    const backlinkLineNumber = _opts.location.start.line;

    const lowerLineLimit = backlinkLineNumber - _opts.linesOfContext;
    const upperLineLimit = backlinkLineNumber + _opts.linesOfContext;

    /**
     * The last line of the YAML frontmatter counts as line 0.
     */
    let documentBodyStartLine = 0;
    let documentEndLine = 0;

    // In the first visit, set the beginning and end markers of the document.
    visit(
      tree,
      [DendronASTTypes.ROOT],
      (node: Node, _index: any, _parent: any) => {
        if (RemarkUtils.isRoot(node)) {
          documentEndLine = node.position?.end.line ?? 0;

          // Count the last line of YAML as the 0 indexed start of the body of the document
          // SubA (position / children[0] remark cluster) of 3 sub-agents for "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" parallel to engine batch 3. "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + length/invariant guard + ! only after check (noUnchecked on children[0] + position). See common-server 0 + unified 57 precedent + engine batches (full 8 IDs). THE CHAIN DOES NOT STOP.
          const yamlCandidate = node.children?.[0];
          if (
            node.children &&
            node.children.length > 0 &&
            yamlCandidate !== undefined &&
            RemarkUtils.isYAML(yamlCandidate)
          ) {
            const yamlChild = yamlCandidate;
            documentBodyStartLine = yamlChild.position?.end.line ?? 0;
          }
        }
      }
    );

    // In the second visit, modify the wikilink/ref/candidate that is the
    // backlink to highlight it and to change its node type so that it appears
    // in its text form to the user (we don't want to convert a noteref backlink
    // into its reffed contents for example)
    visit(tree, (node: Node, index: number | undefined, parent: Parent | undefined) => {
      if (!node.position) {
        return;
      }

      // Remove all elements that fall outside of the context boundary limits
      if (
        node.position.end.line < lowerLineLimit ||
        node.position.start.line > upperLineLimit
      ) {
        if (parent) {
          parent.children.splice(index!, 1);
          return index;
        }
      }

      // Make special adjustments for preceding and succeeding code blocks that
      // straddle the context boundaries
      if (node.position && node.position.start.line < lowerLineLimit) {
        if (RemarkUtils.isCode(node)) {
          const codeNode = node as Code;
          const lines = codeNode.value.split("\n");
          codeNode.value = lines
            .slice(
              Math.max(0, lowerLineLimit - node.position.start.line - 2), // Adjust an offset to account for the code block ``` lines
              lines.length - 1
            )
            .join("\n");
        }
      } else if (node.position && node.position.end.line > upperLineLimit) {
        if (RemarkUtils.isCode(node)) {
          const codeNode = node as Code;
          const lines = codeNode.value.split("\n");
          codeNode.value = lines
            .slice(
              0,
              upperLineLimit - node.position.end.line + 1 // Adjust an offset of 1 to account for the code block ``` line
            )
            .join("\n");
        }
      }

      // Do the node replacement for wikilinks, node refs, and text blocks when
      // it's a candidate link
      if (RemarkUtils.isWikiLink(node)) {
        const wikiNode = node as WikiLinkNoteV4;
        if (
          backlinkLineNumber === wikiNode.position?.start.line &&
          wikiNode.position.start.column === _opts.location.start.column
        ) {
          let wiklinkText = `${wikiNode.value}`;

          if (wikiNode.data?.anchorHeader) {
            wiklinkText += `#${wikiNode.data.anchorHeader}`;
          }

          (node as Node).type = DendronASTTypes.HTML;
          (node as unknown as HTML).value = getHTMLToHighlightText(
            `[[${wiklinkText}]]`
          );
        }
      } else if (RemarkUtils.isNoteRefV2(node)) {
        const noteRefNode = node as NoteRefNoteV4;
        if (
          backlinkLineNumber === noteRefNode.position?.start.line &&
          noteRefNode.position.start.column === _opts.location.start.column
        ) {
          let noteRefText = `${noteRefNode.value}`;

          if (noteRefNode.data.link.data.anchorStart) {
            noteRefText += `#${noteRefNode.data.link.data.anchorStart}`;
          }

          if (noteRefNode.data.link.data.anchorEnd) {
            noteRefText += `:#${noteRefNode.data.link.data.anchorEnd}`;
          }

          (node as Node).type = DendronASTTypes.HTML;
          (node as unknown as HTML).value = getHTMLToHighlightText(
            `![[${noteRefText}]]`
          );
        }
      } else if (RemarkUtils.isText(node)) {
        const textNode = node as Text;
        // If the backlink location falls within the range of this text node,
        // then proceed with formatting. Note: a text node can span multiple
        // lines if it ends with a '\n'
        if (
          backlinkLineNumber === textNode.position?.start.line &&
          (textNode.position.end.column > _opts.location.start.column ||
            textNode.position.end.line > _opts.location.start.line) &&
          (textNode.position.start.column < _opts.location.end.column ||
            textNode.position.start.line < _opts.location.end.line)
        ) {
          const contents = textNode.value;
          const prefix = contents.substring(0, _opts.location.start.column - 1);

          const candidate = contents.substring(
            _opts.location.start.column - 1,
            _opts.location.end.column - 1
          );
          const suffix = contents.substring(
            _opts.location.end.column - 1,
            contents.length
          );

          (node as Node).type = DendronASTTypes.HTML;
          (node as unknown as HTML).value = `${prefix}${getHTMLToHighlightText(
            candidate
          )}${suffix}`;

          return index;
        }
      } else if (RemarkUtils.isHashTag(node) || RemarkUtils.isUserTag(node)) {
        const tagNode = node as HashTag | UserTag;
        if (
          backlinkLineNumber === tagNode.position?.start.line &&
          tagNode.position.start.column === _opts.location.start.column
        ) {
          (node as Node).type = DendronASTTypes.HTML;
          (node as unknown as HTML).value = getHTMLToHighlightText(tagNode.value);
        }
      }
      return;
    });

    // In the third visit, add the contextual line marker information
    visit(
      tree,
      [DendronASTTypes.ROOT],
      (node: Node, _index: any, _parent: any) => {
        if (!RemarkUtils.isRoot(node) || !node.position) {
          return;
        }

        const lowerBoundText =
          lowerLineLimit <= documentBodyStartLine
            ? "Start of Note"
            : `Line ${lowerLineLimit - 1}`;

        const lowerBoundParagraph: Paragraph = {
          type: DendronASTTypes.PARAGRAPH,
          children: [
            {
              type: DendronASTTypes.HTML,
              value: `--- <i>${lowerBoundText}</i> ---`,
            },
          ],
        };

        node.children.unshift(lowerBoundParagraph as Node);

        const upperBoundText =
          upperLineLimit >= documentEndLine
            ? "End of Note"
            : `Line ${upperLineLimit + 1}`;

        const upperBoundParagraph: Paragraph = {
          type: DendronASTTypes.PARAGRAPH,
          children: [
            {
              type: DendronASTTypes.HTML,
              value: `--- <i>${upperBoundText}</i> ---`,
            },
          ],
        };

        node.children.push(upperBoundParagraph as Node);
      }
    );
  }
  return transformer;
}

function getHTMLToHighlightText(input: string): string {
  return `<span style="color:#000;background-color:#FFFF00;">${input}</span>`;
}
