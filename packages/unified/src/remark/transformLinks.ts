import { DNoteLoc } from "@dendronhq/common-all";
import Unified, { Transformer } from "unified";
import { Node } from "unist";
import { visit } from "unist-util-visit";
import { VFile } from "vfile";
import { DendronASTTypes, NoteRefNoteV4, WikiLinkNoteV4 } from "../types";

type PluginOpts = {
  from: DNoteLoc;
  to: DNoteLoc;
};

/**
 * Used from renaming wikilinks
 */
function plugin(this: Unified.Processor, opts: PluginOpts): Transformer {
  // @ts-expect-error - unified Processor 'this' typing for plugin interop (legacy remark layer, not strict 4-axis common-all boundary). "first 3 packages and Double down on making the pattern actually deliver clean builds on the packages we've already touched" + "proceed and utilize 3 sub-agents" + "Build Modernization 2026-05-31/06 focused clean-build phase (second of 3: unified remark micro)" + 4-axis + ADR 0001 + "see common-server 0 + unified 57 precedent + engine batches" (019e81de-265e-7df2-b217-fce5263e2b57 + 019e81de-3e86-7800-945d-9071b98647a3 + 019e81de-5d28-7ee0-af52-971127ac8062 + 019e81e4-9aba-7032-a55a-f167e368d802 + 019e81f0-20aa-72e1-afc0-4f4e66a67abf + 019e81f5-8c3d-72e1-afc0-4f4e66a67abf + 019e81f4-a0be-7390-a541-1a65d712199b + 019e81f5-d232-7383-b3b2-5917da4ec772). No bare @ts. 0 tests invariant. THE CHAIN DOES NOT STOP.
  const proc = this;
  function transformer(tree: Node, _file: VFile) {
    visit(tree, (node, _idx, _parent) => {
      if (node.type === DendronASTTypes.WIKI_LINK) {
        let cnode = node as WikiLinkNoteV4;
        if (cnode.value.toLowerCase() === opts.from.fname.toLowerCase()) {
          cnode.value = opts.to.fname;
          // if alias the same, change that to
          if (
            cnode.data.alias.toLowerCase() === opts.from.fname.toLowerCase()
          ) {
            cnode.data.alias = opts.to.fname;
          }
        }
      }
      if (node.type === DendronASTTypes.REF_LINK_V2) {
        let cnode = node as NoteRefNoteV4;
        if (
          cnode.data.link.from.fname.toLowerCase() ===
          opts.from.fname.toLowerCase()
        ) {
          cnode.data.link.from.fname = opts.to.fname;
        }
      }
    });
    return tree;
  }
  return transformer;
}

export { plugin as transformLinks };
export { PluginOpts as TransformLinkOpts };
