import type { Extension as FromMarkdownExtension } from "mdast-util-from-markdown";
import type { Options as ToMarkdownExtension } from "mdast-util-to-markdown";
import type { Extension as MicromarkExtension } from "micromark-util-types";
import type { Processor } from "unified";

type ExtensionField =
  | "micromarkExtensions"
  | "fromMarkdownExtensions"
  | "toMarkdownExtensions";

export function addExtension(
  processor: Processor,
  field: ExtensionField,
  value:
    | MicromarkExtension
    | FromMarkdownExtension
    | ToMarkdownExtension
): void {
  const data = processor.data() as Record<string, unknown[]>;
  const list = data[field];
  if (list) {
    list.push(value);
  } else {
    data[field] = [value];
  }
}

export function registerSyntaxExtensions(
  processor: Processor,
  extensions: {
    micromark?: MicromarkExtension;
    fromMarkdown?: FromMarkdownExtension;
    toMarkdown?: ToMarkdownExtension;
  }
): void {
  if (extensions.micromark) {
    addExtension(processor, "micromarkExtensions", extensions.micromark);
  }
  if (extensions.fromMarkdown) {
    addExtension(processor, "fromMarkdownExtensions", extensions.fromMarkdown);
  }
  if (extensions.toMarkdown) {
    addExtension(processor, "toMarkdownExtensions", extensions.toMarkdown);
  }
}