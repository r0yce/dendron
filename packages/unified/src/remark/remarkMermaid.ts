import type { Code } from "mdast";
import type { Transformer } from "unified";
import type { Node, Parent } from "unist";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

export type RemarkMermaidOptions = {
  /**
   * When true (default), emit `<div class="mermaid">` for client-side rendering
   * instead of generating SVG images via mermaid-cli.
   */
  simple?: boolean;
};

function escapeMermaidContents(contents: string): string {
  return contents.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function createMermaidDiv(contents: string) {
  return {
    type: "html" as const,
    value: `<div class="mermaid">
  ${escapeMermaidContents(contents)}
</div>`,
  };
}

/**
 * Remark plugin: transforms fenced `mermaid` code blocks into HTML divs that
 * client-side Mermaid can render. Replaces @dendronhq/remark-mermaid (simple mode only).
 */
export function remarkMermaid(opts?: RemarkMermaidOptions): Transformer {
  const simpleMode = opts?.simple ?? true;

  return function transformer(tree: Node, _file: VFile) {
    if (!simpleMode) {
      return;
    }

    visit(tree, "code", (node: Node, index, parent: Parent | undefined) => {
      const codeNode = node as Code;
      if (
        codeNode.lang !== "mermaid" ||
        parent === undefined ||
        index === undefined
      ) {
        return;
      }

      parent.children.splice(index, 1, createMermaidDiv(codeNode.value ?? ""));
    });
  };
}

export default remarkMermaid;