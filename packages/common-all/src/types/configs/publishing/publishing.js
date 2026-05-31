"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishingSchema = exports.SearchMode = exports.Theme = void 0;
exports.genDefaultPublishingConfig = genDefaultPublishingConfig;
const github_1 = require("./github");
const seo_1 = require("./seo");
const parse_1 = require("../../../parse");
var Theme;
(function (Theme) {
    Theme["DARK"] = "dark";
    Theme["LIGHT"] = "light";
    Theme["CUSTOM"] = "custom";
})(Theme || (exports.Theme = Theme = {}));
var SearchMode;
(function (SearchMode) {
    SearchMode["SEARCH"] = "search";
    SearchMode["LOOKUP"] = "lookup";
})(SearchMode || (exports.SearchMode = SearchMode = {}));
const searchModeSchema = parse_1.z.enum([SearchMode.SEARCH, SearchMode.LOOKUP]);
exports.publishingSchema = (0, parse_1.schemaForType)()(parse_1.z
    .object({
    enableFMTitle: parse_1.z.boolean().optional().default(true),
    // enableHierarchyDisplay?: boolean;
    // hierarchyDisplayTitle?: string;
    enableNoteTitleForLink: parse_1.z.boolean().optional().default(true),
    enablePrettyRefs: parse_1.z.boolean().optional().default(true),
    // enableBackLinks?: boolean;
    enableKatex: parse_1.z.boolean().optional().default(true),
    //
    // assetsPrefix?: string;
    copyAssets: parse_1.z.boolean().default(true),
    //
    // canonicalBaseUrl?: string;
    // customHeaderPath?: string;
    // ga?: GoogleAnalyticsConfig;
    // logoPath?: string;
    // siteFaviconPath?: string;
    // siteIndex?: string;
    siteHierarchies: parse_1.z.array(parse_1.z.string()).default(["root"]),
    writeStubs: parse_1.z.boolean().default(false),
    siteRootDir: parse_1.z.string().default("docs"),
    seo: seo_1.seoSchema,
    github: github_1.githubSchema.optional(),
    enableSiteLastModified: parse_1.z.boolean().default(true),
    // siteUrl?: string;
    enableFrontmatterTags: parse_1.z.boolean().default(true),
    enableHashesForFMTags: parse_1.z.boolean().default(false),
    enableRandomlyColoredTags: parse_1.z.boolean().optional().default(true),
    enableTaskNotes: parse_1.z.boolean().optional().default(true),
    // hierarchy?: { [key: string]: HierarchyConfig };
    // duplicateNoteBehavior?: DuplicateNoteBehavior;
    // theme?: Theme;
    // segmentKey?: string;
    // cognitoUserPoolId?: string;
    // cognitoClientId?: string;
    enablePrettyLinks: parse_1.z.boolean().default(true),
    // siteBanner?: string;
    // giscus?: GiscusConfig;
    // sidebarPath?: string | false;
    searchMode: searchModeSchema.optional().default(SearchMode.LOOKUP),
})
    .passthrough());
/**
 * Generate default {@link DendronPublishingConfig}
 * @returns DendronPublishingConfig
 */
function genDefaultPublishingConfig() {
    return {
        enableFMTitle: true,
        enableNoteTitleForLink: true,
        enablePrettyRefs: true,
        enableKatex: true,
        copyAssets: true,
        siteHierarchies: ["root"],
        writeStubs: false,
        siteRootDir: "docs",
        seo: (0, seo_1.genDefaultSEOConfig)(),
        github: (0, github_1.genDefaultGithubConfig)(),
        enableSiteLastModified: true,
        enableFrontmatterTags: true,
        enableHashesForFMTags: false,
        enableRandomlyColoredTags: true,
        enableTaskNotes: true,
        enablePrettyLinks: true,
        searchMode: SearchMode.LOOKUP,
    };
}
//# sourceMappingURL=publishing.js.map