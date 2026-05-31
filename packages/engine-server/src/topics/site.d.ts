import { DendronConfig, DuplicateNoteBehavior, DVault, HierarchyConfig, NotePropsByIdDict, NoteProps, DendronPublishingConfig, IDendronError, NotePropsMeta } from "@dendronhq/common-all";
import { DEngineClient } from "../types";
/**
 * @deprecated - prefer to use methods in unified/SiteUtils if they exist.
 */
export declare class SiteUtils {
    static canPublish(opts: {
        note: NotePropsMeta;
        config: DendronConfig;
        engine: DEngineClient;
    }): boolean;
    static isPublished(opts: {
        note: NoteProps;
        config: DendronConfig;
        engine: DEngineClient;
    }): boolean;
    static copyAssets(opts: {
        wsRoot: string;
        vault: DVault;
        siteAssetsDir: string;
        /**
         * Delete existing siteAssets
         */
        deleteSiteAssetsDir?: boolean;
    }): Promise<void>;
    /**
     * Creates a placeholder note that can be used for rendering a 403 error
     * message.
     */
    static create403StaticNote(opts: {
        engine: DEngineClient;
    }): NoteProps;
    static createSiteOnlyNotes(opts: {
        engine: DEngineClient;
    }): NoteProps[];
    static filterByConfig(opts: {
        engine: DEngineClient;
        config: DendronConfig;
        noExpandSingleDomain?: boolean;
    }): Promise<{
        notes: NotePropsByIdDict;
        domains: NoteProps[];
    }>;
    /**
     * Filter notes to be published using hierarchy
     */
    static filterByHierarchy(opts: {
        domain: string;
        config: DendronConfig;
        engine: DEngineClient;
        navOrder: number;
    }): Promise<{
        notes: NotePropsByIdDict;
        domain: NoteProps;
    } | undefined>;
    /**
     * Apply custom frontmatter and formatting to note
     */
    static cleanNote({ note, hConfig, }: {
        note: NoteProps;
        hConfig: HierarchyConfig;
    }): {
        body: string;
        id: string;
        title: string;
        desc: string;
        updated: number;
        created: number;
        config?: import("@dendronhq/common-all").NoteLocalConfig;
        fname: string;
        links: import("@dendronhq/common-all").DLink[];
        anchors: {
            [index: string]: import("@dendronhq/common-all").DNoteAnchorPositioned | undefined;
        };
        type: import("@dendronhq/common-all").DNodeType;
        stub?: boolean;
        schemaStub?: boolean;
        parent: import("@dendronhq/common-all").DNodePointer | null;
        children: import("@dendronhq/common-all").DNodePointer[];
        data: any;
        custom?: any;
        schema?: {
            moduleId: string;
            schemaId: string;
        } | undefined;
        vault: DVault;
        contentHash?: string | undefined;
        color?: string | undefined;
        tags?: string | string[] | undefined;
        image?: import("@dendronhq/common-all").DNodeImage | undefined;
        traits?: string[];
    };
    static getConfigForHierarchy(opts: {
        config: DendronConfig;
        noteOrName: NotePropsMeta | string;
    }): HierarchyConfig;
    static getSiteOutputPath(opts: {
        config: DendronConfig;
        wsRoot: string;
        stage: "dev" | "prod";
    }): string;
    static getSiteUrlRootForVault({ vault, config, }: {
        vault: DVault;
        config: DendronConfig;
    }): {
        url?: string;
        index?: string;
    };
    static getSitePrefixForNote(config: DendronConfig): string;
    static getSiteUrlPathForNote({ pathValue, pathAnchor, config, addPrefix, note, }: {
        pathValue?: string;
        pathAnchor?: string;
        config: DendronConfig;
        addPrefix?: boolean;
        note?: NoteProps;
    }): string;
    static handleDup(opts: {
        dupBehavior?: DuplicateNoteBehavior;
        allowStubs?: boolean;
        engine: DEngineClient;
        fname: string;
        config: DendronConfig;
        noteCandidates: NoteProps[];
    }): Promise<NoteProps | undefined>;
    /**
     * Is the current note equivalent ot the index of the published site?
     * @returns
     */
    static isIndexNote({ indexNote, note, }: {
        indexNote?: string;
        note: NoteProps;
    }): boolean;
    static validateConfig(sconfig: DendronPublishingConfig): {
        error?: IDendronError;
    };
}
