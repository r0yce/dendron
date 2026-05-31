"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteUtils = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("../utils");
const LOGGER_NAME = "SiteUtils";
/**
 * @deprecated - prefer to use methods in unified/SiteUtils if they exist.
 */
class SiteUtils {
    static canPublish(opts) {
        const { note, config, engine } = opts;
        const { wsRoot, vaults } = engine;
        // not private note
        if (note.custom?.published === false) {
            return false;
        }
        // check if note is note blocked
        const hconfig = this.getConfigForHierarchy({
            config,
            noteOrName: note,
        });
        const noteVault = common_all_1.VaultUtils.matchVault({
            vault: note.vault,
            vaults,
            wsRoot,
        });
        (0, common_all_1.assert)(noteVault !== false, `noteVault ${note.vault.fsPath} should exist`);
        const cNoteVault = noteVault;
        // not from private vault
        if (noteVault.visibility &&
            noteVault.visibility === common_all_1.DVaultVisibility.PRIVATE) {
            return false;
        }
        // check if allowed in hconfig
        let publishByDefault;
        if (!lodash_1.default.isUndefined(hconfig?.publishByDefault)) {
            // handle property being a boolean or an object
            publishByDefault = lodash_1.default.isBoolean(hconfig.publishByDefault)
                ? hconfig.publishByDefault
                : hconfig.publishByDefault[common_all_1.VaultUtils.getName(cNoteVault)];
        }
        if (!publishByDefault && !(note.custom?.published === true)) {
            return false;
        }
        return true;
    }
    static isPublished(opts) {
        const { note, config } = opts;
        // check if note is in index
        const domain = common_all_1.DNodeUtils.domainName(note.fname);
        const publishingConfig = common_all_1.ConfigUtils.getPublishing(config);
        if (publishingConfig.siteHierarchies[0] !== "root" &&
            publishingConfig.siteHierarchies.indexOf(domain) < 0) {
            return false;
        }
        return this.canPublish(opts);
    }
    static async copyAssets(opts) {
        const { wsRoot, vault, siteAssetsDir, deleteSiteAssetsDir } = opts;
        const vaultAssetsDir = path_1.default.join((0, common_server_1.vault2Path)({ wsRoot, vault }), "assets");
        if (fs_extra_1.default.existsSync(siteAssetsDir) && deleteSiteAssetsDir) {
            console.log("removing existing assets");
            fs_extra_1.default.removeSync(siteAssetsDir);
        }
        if (fs_extra_1.default.existsSync(vaultAssetsDir)) {
            // TODO: be smarter about this
            return fs_extra_1.default.copy(path_1.default.join(vaultAssetsDir), siteAssetsDir, {
                overwrite: true,
                errorOnExist: false,
            });
        }
        return;
    }
    /**
     * Creates a placeholder note that can be used for rendering a 403 error
     * message.
     */
    static create403StaticNote(opts) {
        const { engine } = opts;
        const vaults = engine.vaults;
        return common_all_1.NoteUtils.create({
            vault: vaults[0],
            fname: "403",
            id: "403",
            title: "This page has not yet sprouted",
            body: [
                "[Dendron](https://dendron.so/) (the tool used to generate this site) lets authors selective publish content. You will see this page whenever you click on a link to an unpublished page",
                "",
                "![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/not-sprouted.png)",
            ].join("\n"),
        });
    }
    static createSiteOnlyNotes(opts) {
        const { engine } = opts;
        const note403 = this.create403StaticNote({ engine });
        return [note403];
    }
    static async filterByConfig(opts) {
        const logger = (0, common_server_1.createLogger)(LOGGER_NAME);
        const { engine, config } = opts;
        const cleanPublishingConfig = common_server_1.DConfig.cleanPublishingConfig(common_all_1.ConfigUtils.getPublishing(config));
        common_server_1.DConfig.setCleanPublishingConfig({
            config,
            cleanConfig: cleanPublishingConfig,
        });
        const { siteHierarchies } = cleanPublishingConfig;
        logger.info({ ctx: "filterByConfig", config });
        let domains = [];
        const hiearchiesToPublish = [];
        // async pass to process all notes
        const domainsAndhiearchiesToPublish = await Promise.all(siteHierarchies.map(async (domain, idx) => {
            const out = await SiteUtils.filterByHierarchy({
                domain,
                config,
                engine,
                navOrder: idx,
            });
            if (lodash_1.default.isUndefined(out)) {
                return undefined;
            }
            return out;
        }));
        // synchronous pass to add notes in order
        lodash_1.default.forEach(domainsAndhiearchiesToPublish, (ent) => {
            if (lodash_1.default.isUndefined(ent)) {
                return;
            }
            const { domain, notes } = ent;
            domains.push(domain);
            hiearchiesToPublish.push(notes);
        });
        // if single hierarchy, domain includes all immediate children
        if (!opts.noExpandSingleDomain &&
            siteHierarchies.length === 1 &&
            domains.length === 1) {
            const rootDomain = domains[0];
            // special case, check if any of these children were supposed to be hidden
            domains = domains
                .concat((await engine.bulkGetNotes(rootDomain.children)).data)
                .filter((note) => this.canPublish({ note, config, engine }));
        }
        logger.info({
            ctx: "filterByConfig",
            domains: domains.map((ent) => ent.fname),
        });
        return {
            notes: lodash_1.default.reduce(hiearchiesToPublish, (ent, acc) => {
                return lodash_1.default.merge(acc, ent);
            }, {}),
            domains,
        };
    }
    /**
     * Filter notes to be published using hierarchy
     */
    static async filterByHierarchy(opts) {
        const { domain, engine, navOrder, config } = opts;
        const logger = (0, common_server_1.createLogger)(LOGGER_NAME);
        logger.info({ ctx: "filterByHierarchy:enter", domain, config });
        const hConfig = this.getConfigForHierarchy({
            config,
            noteOrName: domain,
        });
        // get the domain notes
        const notes = await engine.findNotes({ fname: domain });
        logger.info({
            ctx: "filterByHierarchy:candidates",
            domain,
            hConfig,
            notes: notes.map((ent) => ent.id),
        });
        let domainNote;
        const publishingConfig = common_all_1.ConfigUtils.getPublishing(config);
        const duplicateNoteBehavior = publishingConfig.duplicateNoteBehavior;
        // duplicate notes found with same name, need to intelligently resolve
        if (notes.length > 1) {
            domainNote = await SiteUtils.handleDup({
                allowStubs: false,
                dupBehavior: duplicateNoteBehavior,
                engine,
                config,
                fname: domain,
                noteCandidates: notes,
            });
            // no note found
        }
        else if (notes.length < 1) {
            logger.error({
                ctx: "filterByHierarchy",
                msg: "note not found",
                domain,
            });
            // TODO: add warning
            return;
        }
        else {
            // get the note
            domainNote = { ...notes[0] };
        }
        // if no note found or can't publish, then stop here
        if (lodash_1.default.isUndefined(domainNote) ||
            !this.canPublish({ note: domainNote, config, engine })) {
            return;
        }
        // correct metadata since `custom` is an optional prop
        if (!domainNote.custom) {
            domainNote.custom = {};
        }
        // set domain note settings
        // navOrder is the same order that is in dendron.yml
        domainNote.custom.nav_order = navOrder;
        domainNote.parent = null;
        // if note is hoempage, set permalink to indicate this
        if (domainNote.fname === publishingConfig.siteIndex) {
            domainNote.custom.permalink = "/";
        }
        logger.info({
            ctx: "filterByHierarchy",
            domainNote: common_all_1.NoteUtils.toNoteLoc(domainNote),
        });
        // gather all the children of this hierarchy
        const out = {};
        const processQ = [domainNote];
        while (!lodash_1.default.isEmpty(processQ)) {
            // we cast because the `_.isEmpty` check guarantees that this is not undefined
            let note = processQ.pop();
            logger.debug({
                ctx: "filterByHierarchy",
                maybeNote: common_all_1.NoteUtils.toNoteLoc(note),
            });
            // add custom metadata to note
            note = SiteUtils.cleanNote({ note, hConfig });
            const siteFM = note.custom || {};
            // TODO: legacy behavior around stubs, will need to remove
            if (publishingConfig.writeStubs && note.stub) {
                delete note.stub;
                // eslint-disable-next-line no-await-in-loop
                await engine.writeNote(note);
            }
            else {
                // eslint-disable-next-line no-await-in-loop
                await engine.writeNote(note, { metaOnly: true });
            }
            // if `skipLevels` is enabled, the children of the current note are descendants
            // further down
            // eslint-disable-next-line no-await-in-loop
            let children = await utils_1.HierarchyUtils.getChildren({
                skipLevels: siteFM.skipLevels || 0,
                note,
                engine,
            });
            if (siteFM.skipLevels && siteFM.skipLevels > 0) {
                note.children = children.map((ent) => ent.id);
                children.forEach((ent) => {
                    ent.parent = note.id;
                });
            }
            // remove any children that shouldn't be published
            children = lodash_1.default.filter(children, (note) => SiteUtils.canPublish({
                note,
                config,
                engine,
            }));
            logger.debug({
                ctx: "filterByHierarchy:post-filter-children",
                note: common_all_1.NoteUtils.toNoteLoc(note),
                children: children.map((ent) => ent.id),
            });
            // TODO: handle dups
            // add children to Q to be processed
            children.forEach((child) => {
                // update parent to be current note
                // dup merging at the top could cause children from multiple vaults
                // to be present
                child.parent = note.id;
                processQ.push(child);
            });
            // updated children
            out[note.id] = {
                ...note,
                children: children.map((ent) => ent.id),
            };
        }
        return { notes: out, domain: domainNote };
    }
    /**
     * Apply custom frontmatter and formatting to note
     */
    static cleanNote({ note, hConfig, }) {
        hConfig.customFrontmatter?.forEach((fm) => {
            const { key, value } = fm;
            lodash_1.default.set(note, `custom.${key}`, value);
        });
        return {
            ...note,
            body: (0, utils_1.stripLocalOnlyTags)(note.body),
        };
    }
    static getConfigForHierarchy(opts) {
        const { config, noteOrName } = opts;
        const fname = lodash_1.default.isString(noteOrName) ? noteOrName : noteOrName.fname;
        const domain = common_all_1.DNodeUtils.domainName(fname);
        const hierarchyConfig = common_all_1.ConfigUtils.getHierarchyConfig(config);
        const rConfig = lodash_1.default.defaults(lodash_1.default.get(hierarchyConfig, "root", {
            publishByDefault: true,
            customFrontmatter: [],
        }));
        const hConfig = lodash_1.default.defaults(lodash_1.default.get(hierarchyConfig, domain), rConfig);
        return hConfig;
    }
    static getSiteOutputPath(opts) {
        const { config, wsRoot, stage } = opts;
        let siteRootPath;
        const publishingConfig = common_all_1.ConfigUtils.getPublishing(config);
        if (stage === "dev") {
            siteRootPath = path_1.default.join(wsRoot, "build", "site");
            fs_extra_1.default.ensureDirSync(siteRootPath);
        }
        else {
            siteRootPath = (0, common_server_1.resolvePath)(publishingConfig.siteRootDir, wsRoot);
        }
        return siteRootPath;
    }
    static getSiteUrlRootForVault({ vault, config, }) {
        if (vault.seed) {
            const seeds = common_all_1.ConfigUtils.getWorkspace(config).seeds;
            if (seeds && seeds[vault.seed]) {
                const maybeSite = seeds[vault.seed]?.site;
                if (maybeSite) {
                    return { url: maybeSite.url, index: maybeSite.index };
                }
            }
        }
        if (vault.siteUrl) {
            return { url: vault.siteUrl, index: vault.siteIndex };
        }
        const { siteUrl, siteIndex } = common_all_1.ConfigUtils.getPublishing(config);
        return { url: siteUrl, index: siteIndex };
    }
    static getSitePrefixForNote(config) {
        const assetsPrefix = common_all_1.ConfigUtils.getAssetsPrefix(config);
        return assetsPrefix ? assetsPrefix + "/notes/" : "/notes/";
    }
    static getSiteUrlPathForNote({ pathValue, pathAnchor, config, addPrefix, note, }) {
        // add path prefix if valid
        let pathPrefix = "";
        if (addPrefix) {
            pathPrefix = this.getSitePrefixForNote(config);
        }
        // slug anchor if it is not a block anchor
        if (pathAnchor && !(0, common_all_1.isBlockAnchor)(pathAnchor)) {
            pathAnchor = `${(0, common_all_1.getSlugger)().slug(pathAnchor)}`;
        }
        // no prefix if we are at the index note
        const isIndex = lodash_1.default.isUndefined(note)
            ? false
            : SiteUtils.isIndexNote({
                indexNote: config.publishing?.siteIndex,
                note,
            });
        if (isIndex) {
            return `/`;
        }
        // remove extension for pretty links
        const usePrettyLinks = common_all_1.ConfigUtils.getEnablePrettlyLinks(config);
        const pathExtension = lodash_1.default.isBoolean(usePrettyLinks) && usePrettyLinks ? "" : ".html";
        // put together the url path
        return `${pathPrefix || ""}${pathValue}${pathExtension}${pathAnchor ? "#" + pathAnchor : ""}`;
    }
    static async handleDup(opts) {
        const { engine, fname, noteCandidates, config, dupBehavior, allowStubs } = lodash_1.default.defaults(opts, {
            dupBehavior: {
                action: "useVault",
                payload: [],
            },
            allowStubs: true,
        });
        const ctx = "handleDup";
        let domainNote;
        if (lodash_1.default.isArray(dupBehavior.payload)) {
            const vaultNames = dupBehavior.payload;
            await (0, common_all_1.asyncLoopOneAtATime)(vaultNames, async (vname) => {
                if (domainNote) {
                    return;
                }
                const vault = common_all_1.VaultUtils.getVaultByNameOrThrow({
                    vname,
                    vaults: engine.vaults,
                });
                const maybeNote = (await engine.findNotes({ fname, vault }))[0];
                if (maybeNote && maybeNote.stub && !allowStubs) {
                    return;
                }
                if (maybeNote &&
                    this.canPublish({
                        config,
                        note: maybeNote,
                        engine,
                    })) {
                    domainNote = maybeNote;
                    const logger = (0, common_server_1.createLogger)(LOGGER_NAME);
                    logger.info({
                        ctx,
                        status: "found",
                        note: common_all_1.NoteUtils.toLogObj(domainNote),
                    });
                }
            });
            if (!domainNote) {
                throw new common_all_1.DendronError({
                    message: `no notes found for ${fname} in vaults ${vaultNames}`,
                });
            }
        }
        else {
            const vault = dupBehavior.payload.vault;
            const maybeDomainNotes = noteCandidates.filter((n) => common_all_1.VaultUtils.isEqual(n.vault, vault, engine.wsRoot));
            const logger = (0, common_server_1.createLogger)(LOGGER_NAME);
            if (maybeDomainNotes.length < 1) {
                logger.error({
                    ctx: "filterByHierarchy",
                    msg: "dup-resolution: no note found",
                    vault,
                });
                throw new common_all_1.DendronError({
                    message: `no notes found for ${fname} in vault ${vault.fsPath}`,
                });
            }
            if (!this.canPublish({
                config,
                note: maybeDomainNotes[0],
                engine,
            })) {
                return;
            }
            domainNote = maybeDomainNotes[0];
        }
        const domainId = domainNote.id;
        // merge children
        domainNote.children = getUniqueChildrenIds(noteCandidates);
        // update children's parent field
        const children = (await engine.bulkGetNotes(domainNote.children)).data;
        children.map((note) => {
            note.parent = domainId;
        });
        await engine.bulkWriteNotes({ notes: children, opts: { metaOnly: true } });
        const logger = (0, common_server_1.createLogger)(LOGGER_NAME);
        logger.info({
            ctx: "filterByHierarchy",
            msg: "dup-resolution: resolving dup",
            parent: domainNote.id,
            children: domainNote.children,
        });
        return domainNote;
    }
    /**
     * Is the current note equivalent ot the index of the published site?
     * @returns
     */
    static isIndexNote({ indexNote, note, }) {
        return indexNote ? note.fname === indexNote : common_all_1.DNodeUtils.isRoot(note);
    }
    static validateConfig(sconfig) {
        // asset prefix needs one slash
        if (!lodash_1.default.isUndefined(sconfig.assetsPrefix)) {
            if (!sconfig.assetsPrefix.startsWith("/")) {
                return {
                    error: new common_all_1.DendronError({
                        message: "assetsPrefix requires a '/' in front of the path",
                    }),
                };
            }
        }
        return { error: undefined };
    }
}
exports.SiteUtils = SiteUtils;
function getUniqueChildrenIds(notes) {
    return lodash_1.default.uniq(notes.flatMap((ent) => ent.children));
}
//# sourceMappingURL=site.js.map