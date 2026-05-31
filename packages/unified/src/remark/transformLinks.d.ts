import { DNoteLoc } from "@dendronhq/common-all";
import Unified, { Transformer } from "unified";
type PluginOpts = {
    from: DNoteLoc;
    to: DNoteLoc;
};
/**
 * Used from renaming wikilinks
 */
declare function plugin(this: Unified.Processor, opts: PluginOpts): Transformer;
export { plugin as transformLinks };
export { PluginOpts as TransformLinkOpts };
