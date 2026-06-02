import { DendronError } from "@dendronhq/common-all";
import type { CompileContext } from "mdast-util-from-markdown";
import type { Handle as ToMarkdownHandle } from "mdast-util-to-markdown";
import { html } from "mdast-builder";
import { Plugin, Processor } from "unified";
import { createInlineRegexExtension } from "../micromark/inlineRegex";
import { registerSyntaxExtensions } from "../micromark/registerExtensions";
import { MDUtilsV5 } from "..";
import { BlockAnchor, DendronASTDest } from "../types";

// Letters, digits, dashes, and underscores.
// The underscores are an extension over Obsidian.
// Another extension is that it allows whitespace after the anchor.
export const BLOCK_LINK_REGEX = /^\^([\w-]+)\w*(\n|$)/;
export const BLOCK_LINK_REGEX_LOOSE = /\^([\w-]+)/;

/**
 *
 * @param text The text to check if it matches an block anchor.
 * @param matchLoose If true, a block anchor anywhere in the string will match. Otherwise the string must contain only the anchor.
 * @returns The identifier for the match block anchor, or undefined if it did not match.
 */
export const matchBlockAnchor = (
  text: string,
  matchLoose: boolean = true
): string | undefined => {
  const match = (matchLoose ? BLOCK_LINK_REGEX_LOOSE : BLOCK_LINK_REGEX).exec(
    text
  );
  if (match && match[1]) return match[1]!;
  return undefined;
};

type PluginOpts = {
  /** @deprecated */
  hideBlockAnchors?: boolean;
};

function blockAnchorToMarkdown(proc: Processor): ToMarkdownHandle {
  return function blockAnchorHandler(node, _parent, _context) {
    const blockNode = node as BlockAnchor;
    const { dest } = MDUtilsV5.getProcData(proc);
    const fullId = blockNode.id;
    switch (dest) {
      case DendronASTDest.MD_DENDRON:
        return `^${fullId}`;
      case DendronASTDest.MD_REGULAR:
        return "";
      case DendronASTDest.MD_ENHANCED_PREVIEW:
        return `<a aria-hidden="true" class="block-anchor anchor-heading" id="${fullId}" href="#${fullId}">^${fullId}</a>`;
      default:
        throw new DendronError({ message: "Unable to render block anchor" });
    }
  };
}

function blockAnchorSyntax(proc: Processor) {
  return createInlineRegexExtension<BlockAnchor>({
    charCode: "^".charCodeAt(0),
    tokenType: "dendronBlockAnchor",
    mdastType: "blockAnchor",
    match: BLOCK_LINK_REGEX,
    toFields: (matched, _context: CompileContext) => {
      if (!matched[1]) {
        return undefined;
      }
      return {
        value: matched[0]!,
        id: matched[1]!,
      } as unknown as Omit<BlockAnchor, "type">;
    },
    toMarkdown: blockAnchorToMarkdown(proc),
  });
}

const plugin: Plugin<[PluginOpts?]> = function (
  this: Processor,
  _opts?: PluginOpts
) {
  registerSyntaxExtensions(this, blockAnchorSyntax(this));
};

export function blockAnchor2htmlRaw(node: BlockAnchor, _opts?: PluginOpts) {
  const fullId = `^${node.id}`;
  return (
    `<a aria-hidden="true" class="block-anchor anchor-heading icon-link" id="${fullId}" href="#${fullId}">` +
    "</a>"
  );
}

export function blockAnchor2html(
  node: BlockAnchor,
  opts?: PluginOpts
): import("mdast").HTML {
  return html(blockAnchor2htmlRaw(node, opts)) as import("mdast").HTML;
}

export { plugin as blockAnchors };
export { PluginOpts as BlockAnchorOpts };