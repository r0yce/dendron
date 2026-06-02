import _ from "lodash";
import { DendronError } from "@dendronhq/common-all";
import { Plugin, Processor } from "unified";
import { DendronASTDest, DendronASTTypes, ExtendedImage } from "../types";
import { html } from "mdast-builder";
import YAML from "js-yaml";
import type { Handle as ToMarkdownHandle } from "mdast-util-to-markdown";
import { MDUtilsV5 } from "../utilsv5";
import { createInlineRegexExtension } from "../micromark/inlineRegex";
import { registerSyntaxExtensions } from "../micromark/registerExtensions";

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

function extendedImageToMarkdown(proc: Processor): ToMarkdownHandle {
  return function extendedImageHandler(node, _parent, _context) {
    const imageNode = node as ExtendedImage;
    const { dest } = MDUtilsV5.getProcData(proc);
    const alt = imageNode.alt ? imageNode.alt : "";
    switch (dest) {
      case DendronASTDest.MD_DENDRON:
        return `![${alt}](${imageNode.url})${_.trim(
          YAML.dump(imageNode.props, {
            /* Inline-only so we get JSON style {foo: bar} */
            flowLevel: 0,
          })
        )}`;
      case DendronASTDest.MD_REGULAR:
        return `![${alt}](${imageNode.url})`;
      case DendronASTDest.MD_ENHANCED_PREVIEW:
        return extendedImage2htmlRaw(imageNode);
      default:
        throw new DendronError({
          message: "Unable to render extended image",
        });
    }
  };
}

function extendedImageSyntax(proc: Processor) {
  return createInlineRegexExtension<ExtendedImage>({
    charCode: "!".charCodeAt(0),
    tokenType: "dendronExtendedImage",
    mdastType: DendronASTTypes.EXTENDED_IMAGE,
    match: EXTENDED_IMAGE_REGEX,
    toFields: (matched) => {
      if (!matched.groups?.url) {
        return undefined;
      }
      let props: { [key: string]: any } = {};
      try {
        props = YAML.load(matched.groups.props ?? "") as any;
      } catch {
        // Reject bad props so that it falls back to a regular image
        return undefined;
      }
      return {
        value: matched[0]!,
        url: matched.groups.url,
        ...(matched.groups.alt !== undefined && matched.groups.alt !== ""
          ? { alt: matched.groups.alt }
          : {}),
        props,
      } as unknown as Omit<ExtendedImage, "type">;
    },
    toMarkdown: extendedImageToMarkdown(proc),
  });
}

const plugin: Plugin<[PluginOpts?]> = function (
  this: Processor,
  _opts?: PluginOpts
) {
  registerSyntaxExtensions(this, extendedImageSyntax(this));
};

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

export function extendedImage2html(
  node: ExtendedImage,
  opts?: PluginOpts
): import("mdast").HTML {
  return html(extendedImage2htmlRaw(node, opts)) as import("mdast").HTML;
}

export { plugin as extendedImage };
export { PluginOpts as ExtendedImageOpts };