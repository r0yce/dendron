import { DLogger, DNoteAnchorBasic, NotePropsMeta, NoteViewMessage, ReducedDEngine, URI } from "@dendronhq/common-all";
import { IPreviewLinkHandler, LinkType } from "../../../components/views/IPreviewLinkHandler";
/**
 * Web extension implementation for handling link clicks in preview
 */
export declare class PreviewLinkHandler implements IPreviewLinkHandler {
    private wsRoot;
    private engine;
    private logger;
    constructor(wsRoot: URI, engine: ReducedDEngine, logger: DLogger);
    onLinkClicked({ data, }: {
        data: {
            id?: string | undefined;
            href?: string | undefined;
        };
    }): Promise<LinkType.WIKI | LinkType.WEBSITE | LinkType.COMMAND | LinkType.UNKNOWN>;
    /**
     * Try to find the note to navigate to if the given path references a note.
     * @returns a note if one was found, `undefined` if no notes were found, and
     * `null` if the link was ambiguous and user cancelled the prompt to pick a
     * note.
     */
    getNavigationTargetNoteForWikiLink({ data, }: {
        data: NoteViewMessage["data"];
    }): Promise<{
        note: NotePropsMeta | undefined;
        anchor: DNoteAnchorBasic | undefined;
    }>;
    extractNoteIdFromHref(data: {
        id?: string;
        href?: string;
    }): string | undefined;
}
