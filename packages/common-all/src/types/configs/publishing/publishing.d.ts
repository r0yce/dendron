import { DVault } from "../../DVault";
import { GiscusConfig } from "./giscus";
import { GithubConfig } from "./github";
import { SEOConfig } from "./seo";
import { z } from "../../../parse";
export declare enum Theme {
    DARK = "dark",
    LIGHT = "light",
    CUSTOM = "custom"
}
export declare enum SearchMode {
    SEARCH = "search",
    LOOKUP = "lookup"
}
/**
 * Namespace for all publishing related configurations
 */
export type DendronPublishingConfig = {
    enableFMTitle?: boolean | undefined;
    enableHierarchyDisplay?: boolean | undefined;
    hierarchyDisplayTitle?: string | undefined;
    enableNoteTitleForLink?: boolean | undefined;
    enablePrettyRefs?: boolean | undefined;
    enableBackLinks?: boolean | undefined;
    enableKatex?: boolean | undefined;
    assetsPrefix?: string | undefined;
    copyAssets: boolean;
    canonicalBaseUrl?: string | undefined;
    customHeaderPath?: string | undefined;
    ga?: GoogleAnalyticsConfig | undefined;
    logoPath?: string | undefined;
    siteFaviconPath?: string | undefined;
    siteIndex?: string | undefined;
    siteHierarchies: string[];
    enableSiteLastModified: boolean;
    siteRootDir: string;
    siteUrl?: string | undefined;
    enableFrontmatterTags: boolean | undefined;
    enableHashesForFMTags: boolean | undefined;
    enableRandomlyColoredTags?: boolean | undefined;
    enableTaskNotes?: boolean | undefined;
    hierarchy?: {
        [key: string]: HierarchyConfig;
    } | undefined;
    duplicateNoteBehavior?: DuplicateNoteBehavior | undefined;
    writeStubs: boolean;
    seo: SEOConfig;
    github?: GithubConfig | undefined;
    theme?: Theme | undefined;
    segmentKey?: string | undefined;
    cognitoUserPoolId?: string | undefined;
    cognitoClientId?: string | undefined;
    enablePrettyLinks: boolean;
    siteBanner?: string | undefined;
    giscus?: GiscusConfig | undefined;
    sidebarPath?: string | false | undefined;
    searchMode?: SearchMode | undefined;
};
export type CleanDendronPublishingConfig = DendronPublishingConfig & Required<Pick<DendronPublishingConfig, "siteIndex" | "siteUrl">>;
export type DuplicateNoteAction = "useVault";
export type UseVaultBehaviorPayload = {
    vault: DVault;
} | string[];
export type DuplicateNoteActionPayload = UseVaultBehaviorPayload;
export type UseVaultBehavior = {
    action: DuplicateNoteAction;
    payload: DuplicateNoteActionPayload;
};
export type DuplicateNoteBehavior = UseVaultBehavior;
export type HierarchyConfig = {
    publishByDefault?: boolean | {
        [key: string]: boolean;
    };
    customFrontmatter?: CustomFMEntry[];
};
export type CustomFMEntry = {
    key: string;
    value: any;
};
export type GoogleAnalyticsConfig = {
    tracking?: string;
};
export declare const publishingSchema: z.ZodObject<{
    enableFMTitle: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    enableNoteTitleForLink: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    enablePrettyRefs: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    enableKatex: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    copyAssets: z.ZodDefault<z.ZodBoolean>;
    siteHierarchies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    writeStubs: z.ZodDefault<z.ZodBoolean>;
    siteRootDir: z.ZodDefault<z.ZodString>;
    seo: z.ZodObject<{
        title: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        author: z.ZodOptional<z.ZodString>;
        twitter: z.ZodOptional<z.ZodString>;
        image: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            alt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            alt: string;
        }, {
            url: string;
            alt: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        image?: {
            url: string;
            alt: string;
        } | undefined;
        author?: string | undefined;
        twitter?: string | undefined;
        title: string;
        description: string;
    }, {
        title?: string | undefined;
        image?: {
            url: string;
            alt: string;
        } | undefined;
        description?: string | undefined;
        author?: string | undefined;
        twitter?: string | undefined;
    }>;
    github: z.ZodOptional<z.ZodObject<{
        cname: z.ZodOptional<z.ZodString>;
        enableEditLink: z.ZodDefault<z.ZodBoolean>;
        editLinkText: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        editBranch: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        editViewMode: z.ZodDefault<z.ZodOptional<z.ZodUnion<[z.ZodLiteral<import("./github").GithubEditViewModeEnum.tree>, z.ZodLiteral<import("./github").GithubEditViewModeEnum.edit>]>>>;
        editRepository: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        cname?: string | undefined;
        editRepository?: string | undefined;
        enableEditLink: boolean;
        editLinkText: string;
        editBranch: string;
        editViewMode: import("./github").GithubEditViewModeEnum;
    }, {
        cname?: string | undefined;
        enableEditLink?: boolean | undefined;
        editLinkText?: string | undefined;
        editBranch?: string | undefined;
        editViewMode?: import("./github").GithubEditViewModeEnum | undefined;
        editRepository?: string | undefined;
    }>>;
    enableSiteLastModified: z.ZodDefault<z.ZodBoolean>;
    enableFrontmatterTags: z.ZodDefault<z.ZodBoolean>;
    enableHashesForFMTags: z.ZodDefault<z.ZodBoolean>;
    enableRandomlyColoredTags: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    enableTaskNotes: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    enablePrettyLinks: z.ZodDefault<z.ZodBoolean>;
    searchMode: z.ZodDefault<z.ZodOptional<z.ZodEnum<[SearchMode.SEARCH, SearchMode.LOOKUP]>>>;
}, "passthrough", z.ZodTypeAny, {
    github?: {
        cname?: string | undefined;
        editRepository?: string | undefined;
        enableEditLink: boolean;
        editLinkText: string;
        editBranch: string;
        editViewMode: import("./github").GithubEditViewModeEnum;
    } | undefined;
    enablePrettyRefs: boolean;
    enableFMTitle: boolean;
    enableNoteTitleForLink: boolean;
    enableKatex: boolean;
    copyAssets: boolean;
    siteHierarchies: string[];
    enableSiteLastModified: boolean;
    siteRootDir: string;
    enableFrontmatterTags: boolean;
    enableHashesForFMTags: boolean;
    enableRandomlyColoredTags: boolean;
    enableTaskNotes: boolean;
    writeStubs: boolean;
    seo: {
        image?: {
            url: string;
            alt: string;
        } | undefined;
        author?: string | undefined;
        twitter?: string | undefined;
        title: string;
        description: string;
    };
    enablePrettyLinks: boolean;
    searchMode: SearchMode;
}, {
    enablePrettyRefs?: boolean | undefined;
    enableFMTitle?: boolean | undefined;
    enableNoteTitleForLink?: boolean | undefined;
    enableKatex?: boolean | undefined;
    copyAssets?: boolean | undefined;
    siteHierarchies?: string[] | undefined;
    enableSiteLastModified?: boolean | undefined;
    siteRootDir?: string | undefined;
    enableFrontmatterTags?: boolean | undefined;
    enableHashesForFMTags?: boolean | undefined;
    enableRandomlyColoredTags?: boolean | undefined;
    enableTaskNotes?: boolean | undefined;
    writeStubs?: boolean | undefined;
    github?: {
        cname?: string | undefined;
        enableEditLink?: boolean | undefined;
        editLinkText?: string | undefined;
        editBranch?: string | undefined;
        editViewMode?: import("./github").GithubEditViewModeEnum | undefined;
        editRepository?: string | undefined;
    } | undefined;
    enablePrettyLinks?: boolean | undefined;
    searchMode?: SearchMode | undefined;
    seo: {
        title?: string | undefined;
        image?: {
            url: string;
            alt: string;
        } | undefined;
        description?: string | undefined;
        author?: string | undefined;
        twitter?: string | undefined;
    };
}>;
/**
 * Generate default {@link DendronPublishingConfig}
 * @returns DendronPublishingConfig
 */
export declare function genDefaultPublishingConfig(): DendronPublishingConfig;
