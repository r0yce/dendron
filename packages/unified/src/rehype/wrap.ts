import type { Processor, Plugin } from "unified";
import { visit } from "unist-util-visit";
import type { Node, Parent } from "unist";
import parseSelector from "hast-util-parse-selector";
import { selectAll } from "hast-util-select";

type PluginOpts = {
  wrapper: string;
  selector: string;
  fallback?: boolean;
};

const plugin: Plugin<[PluginOpts]> = function plugin(this: Processor, opts) {
  function transformer(tree: Node): void {
    const root = tree as Node;
    for (const match of selectAll(opts.selector, root as any)) {
      const wrapper = parseSelector(opts.wrapper) as Node & { children: Node[] };
      visit(tree, (node) => node === match, (node, i, parent) => {
        wrapper.children = [node];
        if (parent) {
          (parent as Parent).children[i!] = wrapper;
        }
      });
    }
  }
  return transformer;
};

export { plugin as wrap };
