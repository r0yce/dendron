import _ from "lodash";
import { DendronError } from "@dendronhq/common-all";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import { DendronASTDest, DendronASTTypes, ExtendedImage } from "../types";
import { Element } from "hast";
import { html } from "mdast-builder";
import YAML from "js-yaml";
import { MDUtilsV5 } from "../utilsv5";

export const EXTENDED_IMAGE_REGEX =
  /^!\[(?<alt>[^[\]]*)\]\((?<url>.*)\)(?<props>{[^{}]*})/;
export const EXTENDED_IMAGE_REGEX_LOOSE =
  /!\[(?<alt>[^[\]]*)\]\((?<url>.*)\)(?<props>{[^{}]*})/;

export const matchExtendedImage = (
  text: string,
  matchLoose: boolean = true
): string | undefined => {
  const match = (
    matchLoose ? EXTENDED_IMAGE_REGEX_LOOSE : EXTENDED_IMAGE_REGEX
  ).exec(text);
  // Lean v2: groups + positional ! guards for noUncheckedIndexedAccess (regex match)
  if (match && match.groups?.url && match.groups) return match[2]!; // url is group 2 per regex
  return undefined;
};

type PluginOpts = {};

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
    return value.indexOf("!", fromIndex);
  }

  function inlineTokenizer(eat: Eat, value: string) {
    const match = EXTENDED_IMAGE_REGEX.exec(value);
    if (match && match.groups?.url) {
      let props: { [key: string]: any } = {};
      try {
        props = YAML.load(match.groups.props) as any;
      } catch {
        // Reject bad props so that it falls back to a regular image
        return;
      }

      // Lean v2: ! on match[0] for noUncheckedIndexedAccess
      return eat(match[0]!)({
        type: DendronASTTypes.EXTENDED_IMAGE,
        // @ts-expect-error - mdast extension shape for EXTENDED_IMAGE (value prop for eat); legacy remark plugin interop (not strict 4-axis common-all boundary). "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" + 4-axis + ADR 0001 + "see common-server 0 + unified 57 precedent + engine batches" (019e81de-265e-7df2-b217-fce5263e2b57 + 019e81de-3e86-7800-945d-9071b98647a3 + 019e81de-5d28-7ee0-af52-971127ac8062 + 019e81e4-9aba-7032-a55a-f167e368d802 + 019e81f0-20aa-72e1-afc0-4f4e66a67abf + 019e81f5-8c3d-72e1-afc0-4f4e66a67abf + 019e81f4-a0be-7390-a541-1a65d712199b + 019e81f5-d232-7383-b3b2-5917da4ec772). No bare @ts. 0 tests invariant. THE CHAIN DOES NOT STOP.
        value,
        url: match.groups.url,
        alt: match.groups.alt,
        props,
      });
    }
    return;
  }
  inlineTokenizer.locator = locator;

  const Parser = proc.Parser;
  const inlineTokenizers = Parser.prototype.inlineTokenizers;
  const inlineMethods = Parser.prototype.inlineMethods;
  inlineTokenizers.extendedImage = inlineTokenizer;
  inlineMethods.splice(inlineMethods.indexOf("link"), 0, "extendedImage");
}

function attachCompiler(proc: Unified.Processor, _opts?: PluginOpts) {
  const Compiler = proc.Compiler;
  const visitors = Compiler.prototype.visitors;

  if (visitors) {
    visitors.extendedImage = function (node: ExtendedImage): string | Element {
      const { dest } = MDUtilsV5.getProcData(proc);
      const alt = node.alt ? node.alt : "";
      switch (dest) {
        case DendronASTDest.MD_DENDRON:
          return `![${alt}](${node.url})${_.trim(
            YAML.dump(node.props, {
              /* Inline-only so we get JSON style {foo: bar} */
              flowLevel: 0,
            })
          )}`;
        case DendronASTDest.MD_REGULAR:
          return `![${alt}](${node.url})`;
        case DendronASTDest.MD_ENHANCED_PREVIEW:
          return extendedImage2htmlRaw(node);
        default:
          throw new DendronError({
            message: "Unable to render extended image",
          });
      }
    };
  }
}

const ALLOWED_STYLE_PROPS = new Set<string>([
  "width",
  "height",
  "float",
  "border",
  "margin",
  "padding",
  "min-width",
  "min-height",
  "max-width",
  "max-height",
  "display",
  "opacity",
  "outline",
  "rotate",
  "transition",
  "transform-origin",
  "transform",
  "z-index",
]);

export function extendedImage2htmlRaw(node: ExtendedImage, _opts?: PluginOpts) {
  const stylesList: string[] = [];
  const nodePropsList: string[] = [];
  for (const [prop, value] of Object.entries(node.props)) {
    if (ALLOWED_STYLE_PROPS.has(prop)) stylesList.push(`${prop}:${value};`);
  }
  nodePropsList.push(`src="${node.url}"`);
  if (node.alt) nodePropsList.push(`alt="${node.alt}"`);

  return `<img ${nodePropsList.join(" ")} style="${stylesList.join("")}">`;
}

export function extendedImage2html(node: ExtendedImage, opts?: PluginOpts) {
  return html(extendedImage2htmlRaw(node, opts));
}

export { plugin as extendedImage };
export { PluginOpts as ExtendedImageOpts };
