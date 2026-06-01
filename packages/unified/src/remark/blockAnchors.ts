import _ from "lodash";
import { DendronError } from "@dendronhq/common-all";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import { BlockAnchor, DendronASTDest } from "../types";
import { Element } from "hast";
import { html } from "mdast-builder";
import { MDUtilsV5 } from "..";

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
  // Lean v2: corrected guard + ! for noUncheckedIndexedAccess (regex capture always present on match success)
  if (match && match[1]) return match[1]!;
  return undefined;
};

type PluginOpts = {
  /** @deprecated */
  hideBlockAnchors?: boolean;
};

const plugin: Plugin<[PluginOpts?]> = function (
  this: Unified.Processor,
  opts?: PluginOpts
) {
  attachParser(this);
  if (this.Compiler != null) {
    attachCompiler(this, opts);
  }
};

function attachParser(proc: Unified.Processor) {
  function locator(value: string, fromIndex: number) {
    return value.indexOf("^", fromIndex);
  }

  function inlineTokenizer(eat: Eat, value: string) {
    const match = BLOCK_LINK_REGEX.exec(value);
    if (match) {
      // Lean v2: ! after match guard for noUncheckedIndexedAccess on regex [0]/[1]
      return eat(match[0]!)({
        type: "blockAnchor",
        // @ts-expect-error - mdast extension shape for blockAnchor (value prop for eat); legacy remark plugin interop (not strict 4-axis common-all boundary). "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" + 4-axis + ADR 0001 + "see common-server 0 + unified 57 precedent + engine batches" (019e81de-265e-7df2-b217-fce5263e2b57 + 019e81de-3e86-7800-945d-9071b98647a3 + 019e81de-5d28-7ee0-af52-971127ac8062 + 019e81e4-9aba-7032-a55a-f167e368d802 + 019e81f0-20aa-72e1-afc0-4f4e66a67abf + 019e81f5-8c3d-72e1-afc0-4f4e66a67abf + 019e81f4-a0be-7390-a541-1a65d712199b + 019e81f5-d232-7383-b3b2-5917da4ec772). No bare @ts. 0 tests invariant. THE CHAIN DOES NOT STOP.
        value,
        id: match[1]!,
      });
    }
    return;
  }
  inlineTokenizer.locator = locator;

  const Parser = proc.Parser;
  const inlineTokenizers = Parser.prototype.inlineTokenizers;
  const inlineMethods = Parser.prototype.inlineMethods;
  inlineTokenizers.blockAnchor = inlineTokenizer;
  inlineMethods.splice(inlineMethods.indexOf("link"), 0, "blockAnchor");
}

function attachCompiler(proc: Unified.Processor, _opts?: PluginOpts) {
  const Compiler = proc.Compiler;
  const visitors = Compiler.prototype.visitors;

  if (visitors) {
    visitors.blockAnchor = function (node: BlockAnchor): string | Element {
      const { dest } = MDUtilsV5.getProcData(proc);
      const fullId = node.id;
      switch (dest) {
        case DendronASTDest.MD_DENDRON:
          return `^${fullId}`;
        case DendronASTDest.MD_REGULAR:
          // Regular markdown has no concept of anchors, so best to strip it out
          return "";
        case DendronASTDest.MD_ENHANCED_PREVIEW:
          return `<a aria-hidden="true" class="block-anchor anchor-heading" id="${fullId}" href="#${fullId}">^${fullId}</a>`;
        default:
          throw new DendronError({ message: "Unable to render block anchor" });
      }
    };
  }
}

export function blockAnchor2htmlRaw(node: BlockAnchor, _opts?: PluginOpts) {
  const fullId = `^${node.id}`;
  return (
    `<a aria-hidden="true" class="block-anchor anchor-heading icon-link" id="${fullId}" href="#${fullId}">` +
    "</a>"
  );
}

export function blockAnchor2html(node: BlockAnchor, opts?: PluginOpts) {
  return html(blockAnchor2htmlRaw(node, opts));
}

export { plugin as blockAnchors };
export { PluginOpts as BlockAnchorOpts };
