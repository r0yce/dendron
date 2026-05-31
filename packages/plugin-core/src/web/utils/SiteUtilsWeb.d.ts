import { DVault, NoteProps } from "@dendronhq/common-all";
export declare class SiteUtilsWeb {
    private siteUrl?;
    private siteIndex?;
    private assetsPrefix?;
    private enablePrettyLinks?;
    constructor(siteUrl?: string | undefined, siteIndex?: string | undefined, assetsPrefix?: string | undefined, enablePrettyLinks?: boolean | undefined);
    getSiteUrlRootForVault({ vault }: {
        vault: DVault;
    }): {
        url?: string;
        index?: string;
    };
    /**
     * Is the current note equivalent ot the index of the published site?
     * @returns
     */
    isIndexNote({ indexNote, note, }: {
        indexNote?: string | undefined;
        note: NoteProps;
    }): boolean;
    getSiteUrlPathForNote({ pathValue, pathAnchor, addPrefix, note, }: {
        pathValue?: string;
        pathAnchor?: string;
        addPrefix?: boolean;
        note?: NoteProps;
    }): string;
    /**
     * Generate url for given note
     * @param opts
     *
     */
    getNoteUrl(opts: {
        note: NoteProps;
        vault: DVault;
    }): string;
}
