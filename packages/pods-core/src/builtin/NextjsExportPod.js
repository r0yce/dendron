"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextjsExportPod = exports.NextjsExportPodUtils = exports.removeBodyFromNotesDict = exports.removeBodyFromNote = exports.mapObject = exports.PublishTarget = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const unified_1 = require("@dendronhq/unified");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const basev3_1 = require("../basev3");
const utils_1 = require("../utils");
const ID = "dendron.nextjs";
const TEMPLATE_REMOTE = "origin";
const TEMPLATE_REMOTE_URL = "https://github.com/dendronhq/nextjs-template.git";
const TEMPLATE_BRANCH = "main";
const $$ = engine_server_1.execa.command;
var PublishTarget;
(function (PublishTarget) {
    PublishTarget["GITHUB"] = "github";
})(PublishTarget || (exports.PublishTarget = PublishTarget = {}));
const mapObject = (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(k, v)]));
exports.mapObject = mapObject;
const removeBodyFromNote = ({ body, ...note }) => note;
exports.removeBodyFromNote = removeBodyFromNote;
const removeBodyFromNotesDict = (notes) => (0, exports.mapObject)(notes, (_k, note) => (0, exports.removeBodyFromNote)(note));
exports.removeBodyFromNotesDict = removeBodyFromNotesDict;
function getSiteConfig({ config, overrides, }) {
    const publishingConfig = common_all_1.ConfigUtils.getPublishing(config);
    return {
        ...publishingConfig,
        ...overrides,
        enablePrettyLinks: true,
    };
}
async function validateSiteConfig({ config, wsRoot, }) {
    if (common_all_1.ConfigUtils.isDendronPublishingConfig(config)) {
        if (config.theme === common_all_1.Theme.CUSTOM) {
            if (!(await fs_extra_1.default.pathExists(path_1.default.join(wsRoot, common_all_1.CONSTANTS.CUSTOM_THEME_CSS)))) {
                return {
                    error: new common_all_1.DendronError({
                        message: `A custom theme is set in the publishing config, but ${common_all_1.CONSTANTS.CUSTOM_THEME_CSS} does not exist in ${wsRoot}`,
                        severity: common_all_1.ERROR_SEVERITY.FATAL,
                    }),
                };
            }
        }
    }
    return { data: undefined };
}
class NextjsExportPodUtils {
    static async buildSiteMap(opts) {
        const { nextPath } = opts;
        const cmdDev = "npm run build:sitemap";
        const out = $$(cmdDev, { cwd: nextPath });
        out.stdout?.pipe(process.stdout);
        return out.pid;
    }
    static getDendronConfigPath = (dest) => {
        const podDstDir = path_1.default.join(dest.fsPath, "data");
        const podConfigDstPath = path_1.default.join(podDstDir, "dendron.json");
        return podConfigDstPath;
    };
    static getNextRoot = (wsRoot) => {
        return path_1.default.join(wsRoot, ".next");
    };
    static async nextPathExists(opts) {
        const { nextPath } = opts;
        const exists = await fs_extra_1.default.pathExists(nextPath);
        return exists;
    }
    static async removeNextPath(opts) {
        const { nextPath } = opts;
        await fs_extra_1.default.rm(nextPath, { recursive: true });
    }
    static async installDependencies(opts) {
        const { nextPath } = opts;
        await $$("npm install", { cwd: nextPath });
    }
    static async cloneTemplate(opts) {
        const { nextPath } = opts;
        await fs_extra_1.default.ensureDir(nextPath);
        const git = (0, common_server_1.simpleGit)({ baseDir: nextPath });
        await git.clone(TEMPLATE_REMOTE_URL, nextPath);
        return { error: null };
    }
    static async updateTemplate(opts) {
        const { nextPath } = opts;
        const git = (0, common_server_1.simpleGit)({ baseDir: nextPath });
        const remotes = await git.getRemotes(true);
        if (remotes.length !== 1 ||
            remotes[0].name !== TEMPLATE_REMOTE ||
            remotes[0].refs.fetch !== TEMPLATE_REMOTE_URL ||
            remotes[0].refs.push !== TEMPLATE_REMOTE_URL) {
            throw new Error("remotes not set up correctly");
        }
        let status = await git.status();
        if (status.current !== TEMPLATE_BRANCH) {
            await git.checkout(TEMPLATE_REMOTE_URL);
            status = await git.status();
        }
        const remoteBranch = `${TEMPLATE_REMOTE}/${TEMPLATE_BRANCH}`;
        if (status.tracking !== remoteBranch) {
            throw new Error(`${status.tracking} is not expected remote branch`);
        }
        await git.fetch();
        await git.reset(common_server_1.SimpleGitResetMode.HARD, [remoteBranch]);
    }
    static async isInitialized(opts) {
        const { wsRoot } = opts;
        const nextPath = path_1.default.join(wsRoot, ".next");
        const nextPathExists = await NextjsExportPodUtils.nextPathExists({
            ...opts,
            nextPath,
        });
        if (nextPathExists) {
            const pkgJsonExists = await fs_extra_1.default.pathExists(path_1.default.join(nextPath, "package.json"));
            if (pkgJsonExists) {
                return true;
            }
        }
        return false;
    }
    static async startNextExport(opts) {
        const { nextPath, quiet } = opts;
        const cmd = quiet ? "npm run --silent export" : "npm run export";
        let out;
        if (quiet) {
            out = await $$(cmd, { cwd: nextPath });
        }
        else {
            out = $$(cmd, { cwd: nextPath });
            out.stdout?.pipe(process.stdout);
        }
        return out;
    }
    static async startNextDev(opts) {
        const { nextPath, quiet, windowsHide } = opts;
        const cmdDev = quiet ? "npm run --silent dev" : "npm run dev";
        const out = $$(cmdDev, { cwd: nextPath, windowsHide });
        out.stdout?.pipe(process.stdout);
        return out.pid;
    }
    static async loadSidebarsFile(sidebarFilePath) {
        if (sidebarFilePath === false) {
            return common_all_1.DisabledSidebar;
        }
        if (lodash_1.default.isNil(sidebarFilePath)) {
            return common_all_1.DefaultSidebar;
        }
        // Non-existent sidebars file: no sidebars
        if (!(await fs_extra_1.default.pathExists(sidebarFilePath))) {
            throw new Error(`no sidebar file found at ${sidebarFilePath}`);
        }
        /* eslint-disable-next-line import/no-dynamic-require, global-require */
        return require(path_1.default.resolve(sidebarFilePath));
    }
}
exports.NextjsExportPodUtils = NextjsExportPodUtils;
class NextjsExportPod extends basev3_1.ExportPod {
    static id = ID;
    static description = "export notes to Nextjs";
    get config() {
        return utils_1.PodUtils.createExportConfig({
            required: [],
            properties: {
                overrides: {
                    type: "object",
                    description: "options from site config you want to override",
                },
            },
        });
    }
    async _renderNote({ engine, note, engineConfig, noteCacheForRenderDict, }) {
        const proc = unified_1.MDUtilsV5.procRehypeFull({
            noteToRender: note,
            noteCacheForRenderDict,
            fname: note.fname,
            vault: note.vault,
            config: engineConfig,
            vaults: engine.vaults,
            wsRoot: engine.wsRoot,
        }, { flavor: unified_1.ProcFlavor.PUBLISHING });
        const payload = await proc.process(common_all_1.NoteUtils.serialize(note));
        return payload.toString();
    }
    async _writeEnvFile({ siteConfig, dest, }) {
        // add .env.production, next will use this to replace `process.env` vars when building
        const vars = [];
        if (siteConfig.assetsPrefix) {
            vars.push(`NEXT_PUBLIC_ASSET_PREFIX=${siteConfig.assetsPrefix}`);
        }
        vars.push(`NEXT_PUBLIC_STAGE=${(0, common_all_1.getStage)()}`);
        const envFile = path_1.default.join(dest.fsPath, ".env.production");
        this.L.debug(`Added env variables to export: ${vars}`);
        await fs_extra_1.default.writeFile(envFile, vars.join("\n"));
    }
    async copyAssets({ wsRoot, config, dest, }) {
        const ctx = "copyAssets";
        const vaults = common_all_1.ConfigUtils.getVaults(config);
        const destPublicPath = path_1.default.join(dest, "public");
        fs_extra_1.default.ensureDirSync(destPublicPath);
        const siteAssetsDir = path_1.default.join(destPublicPath, "assets");
        const publishingConfig = common_all_1.ConfigUtils.getPublishing(config);
        // if copyAssets not set, skip it
        if (!publishingConfig.copyAssets) {
            this.L.info({ ctx, msg: "skip copying" });
            return;
        }
        // if we are copying assets, delete existing assets folder if it exists
        if (fs_extra_1.default.existsSync(siteAssetsDir)) {
            fs_extra_1.default.removeSync(siteAssetsDir);
        }
        this.L.info({ ctx, msg: "copying", vaults });
        await vaults.reduce(async (resp, vault) => {
            await resp;
            if (vault.visibility === "private") {
                // eslint-disable-next-line no-console
                console.log(`skipping copy assets from private vault ${vault.fsPath}`);
                return Promise.resolve({});
            }
            // copy assets from each vauulut to assets folder of destination
            await engine_server_1.SiteUtils.copyAssets({
                wsRoot,
                vault,
                siteAssetsDir,
                deleteSiteAssetsDir: false,
            });
            return Promise.resolve({});
        }, Promise.resolve({}));
        this.L.info({ ctx, msg: "finish copying assets" });
        // custom headers
        const customHeaderPath = publishingConfig.customHeaderPath;
        if (customHeaderPath) {
            const headerPath = path_1.default.join(wsRoot, customHeaderPath);
            if (fs_extra_1.default.existsSync(headerPath)) {
                fs_extra_1.default.copySync(headerPath, path_1.default.join(destPublicPath, "header.html"));
            }
        }
        // custom components
        if (common_all_1.PublishUtils.hasCustomSiteBanner(config)) {
            const bannerPath = common_all_1.PublishUtils.getCustomSiteBannerPathFromWorkspace(wsRoot);
            if (!fs_extra_1.default.existsSync(bannerPath)) {
                throw Error(`no banner found at ${bannerPath}`);
            }
            fs_extra_1.default.copySync(bannerPath, common_all_1.PublishUtils.getCustomSiteBannerPathToPublish(dest));
        }
        // get favicon
        const siteFaviconPath = publishingConfig.siteFaviconPath;
        if (siteFaviconPath) {
            const faviconPath = path_1.default.join(wsRoot, siteFaviconPath);
            if (fs_extra_1.default.existsSync(faviconPath)) {
                fs_extra_1.default.copySync(faviconPath, path_1.default.join(destPublicPath, "favicon.ico"));
            }
        }
        // get logo
        const logo = common_all_1.ConfigUtils.getLogo(config);
        if (logo && !(0, common_all_1.isWebUri)(logo)) {
            const logoPath = path_1.default.join(wsRoot, logo);
            try {
                const targetPath = path_1.default.join(siteAssetsDir, path_1.default.basename(logoPath));
                await fs_extra_1.default.copy(logoPath, targetPath);
            }
            catch (err) {
                // If the logo file was missing, that shouldn't crash the
                // initialization. Warn the user and move on.
                if (err?.code === "ENOENT") {
                    this.L.error({
                        ctx,
                        msg: "Failed to copy the logo",
                        logoPath,
                        siteAssetsDir,
                        err,
                    });
                }
                else {
                    throw err;
                }
            }
        }
        // get cname
        const githubConfig = common_all_1.ConfigUtils.getGithubConfig(config);
        const githubCname = githubConfig?.cname;
        if (githubCname) {
            fs_extra_1.default.writeFileSync(path_1.default.join(destPublicPath, "CNAME"), githubCname, {
                encoding: "utf8",
            });
        }
        // copy over the custom theme if it exists
        const customThemePath = path_1.default.join(wsRoot, common_all_1.CONSTANTS.CUSTOM_THEME_CSS);
        if (await fs_extra_1.default.pathExists(customThemePath)) {
            const publishedThemeRoot = path_1.default.join(destPublicPath, "themes");
            fs_extra_1.default.ensureDirSync(publishedThemeRoot);
            fs_extra_1.default.copySync(customThemePath, path_1.default.join(publishedThemeRoot, common_all_1.CONSTANTS.CUSTOM_THEME_CSS));
        }
    }
    async renderBodyAsMD({ note, notesDir, }) {
        const ctx = `${ID}:renderBodyToHTML`;
        this.L.debug({ ctx, msg: "renderNote:pre", note: note.id });
        const out = note.body;
        const dst = path_1.default.join(notesDir, note.id + ".md");
        this.L.debug({ ctx, dst, msg: "writeNote" });
        return fs_extra_1.default.writeFile(dst, out);
    }
    async renderBodyToHTML({ engine, note, notesDir, engineConfig, noteCacheForRenderDict, }) {
        const ctx = `${ID}:renderBodyToHTML`;
        this.L.debug({ ctx, msg: "renderNote:pre", note: note.id });
        const out = await this._renderNote({
            engine,
            note,
            engineConfig,
            noteCacheForRenderDict,
        });
        const dst = path_1.default.join(notesDir, note.id + ".html");
        this.L.debug({ ctx, dst, msg: "writeNote" });
        return fs_extra_1.default.writeFile(dst, out);
    }
    async renderMetaToJSON({ note, notesDir, }) {
        const ctx = `${ID}:renderMetaToJSON`;
        this.L.debug({ ctx, msg: "renderNote:pre", note: note.id });
        const out = lodash_1.default.omit(note, "body");
        const dst = path_1.default.join(notesDir, note.id + ".json");
        this.L.debug({ ctx, dst, msg: "writeNote" });
        return fs_extra_1.default.writeJSON(dst, out);
    }
    async plant(opts) {
        unified_1.MDUtilsV5.clearRefCache();
        const ctx = `${ID}:plant`;
        const { dest, engine, wsRoot, config: podConfig } = opts;
        const podDstDir = path_1.default.join(dest.fsPath, "data");
        fs_extra_1.default.ensureDirSync(podDstDir);
        const config = common_server_1.DConfig.readConfigSync(wsRoot);
        const siteConfig = getSiteConfig({
            config,
            overrides: podConfig.overrides,
        });
        const { error } = await validateSiteConfig({ config: siteConfig, wsRoot });
        if (error) {
            throw error;
        }
        const sidebarPath = "sidebarPath" in siteConfig ? siteConfig.sidebarPath : undefined;
        const sidebarConfigInput = await NextjsExportPodUtils.loadSidebarsFile(sidebarPath);
        const sidebarConfig = (0, common_all_1.parseSidebarConfig)(sidebarConfigInput);
        // fail early, before computing `SiteUtils.filterByConfig`.
        if (sidebarConfig.isErr()) {
            throw sidebarConfig.error;
        }
        await this.copyAssets({ wsRoot, config, dest: dest.fsPath });
        this.L.info({ ctx, msg: "filtering notes..." });
        const engineConfig = common_all_1.ConfigUtils.overridePublishingConfig(config, siteConfig);
        const { notes: publishedNotes, domains } = await engine_server_1.SiteUtils.filterByConfig({
            engine,
            config: engineConfig,
            noExpandSingleDomain: true,
        });
        const duplicateNoteBehavior = "duplicateNoteBehavior" in siteConfig
            ? siteConfig.duplicateNoteBehavior
            : undefined;
        const sidebarResp = (0, common_all_1.processSidebar)(sidebarConfig, {
            notes: publishedNotes,
            duplicateNoteBehavior,
        });
        // fail if sidebar could not be created
        if (sidebarResp.isErr()) {
            throw sidebarResp.error;
        }
        const siteNotes = engine_server_1.SiteUtils.createSiteOnlyNotes({
            engine,
        });
        lodash_1.default.forEach(siteNotes, (ent) => {
            publishedNotes[ent.id] = ent;
        });
        const noteIndex = lodash_1.default.find(domains, (ent) => ent.custom.permalink === "/");
        const payload = {
            notes: publishedNotes,
            domains,
            noteIndex,
            vaults: engine.vaults,
        };
        // The reason to use all engine notes instead of just the published notes
        // here is because a published note may link to a private note, in which
        // case we still "need" the private note in the cache to do the rendering,
        // since the title of the note is used in the (Private) placeholder for the
        // link.
        const noteDeps = await engine.findNotes({ excludeStub: true });
        const fullDict = common_all_1.NoteDictsUtils.createNoteDicts(noteDeps);
        // render notes
        const notesBodyDir = path_1.default.join(podDstDir, "notes");
        const notesMetaDir = path_1.default.join(podDstDir, "meta");
        const notesRefsDir = path_1.default.join(podDstDir, "refs");
        this.L.info({ ctx, msg: "ensuring notesDir...", notesDir: notesBodyDir });
        fs_extra_1.default.ensureDirSync(notesBodyDir);
        fs_extra_1.default.ensureDirSync(notesMetaDir);
        this.L.info({ ctx, msg: "writing notes..." });
        await Promise.all(lodash_1.default.map(lodash_1.default.values(publishedNotes), async (note) => {
            return Promise.all([
                this.renderBodyToHTML({
                    engine,
                    note,
                    notesDir: notesBodyDir,
                    engineConfig,
                    noteCacheForRenderDict: fullDict,
                }),
                this.renderMetaToJSON({ note, notesDir: notesMetaDir }),
                this.renderBodyAsMD({ note, notesDir: notesBodyDir }),
            ]);
        }));
        let refIds = [];
        if (config.dev?.enableExperimentalIFrameNoteRef) {
            const noteRefs = unified_1.MDUtilsV5.getRefCache();
            refIds = await Promise.all(Object.keys(noteRefs).map(async (ent) => {
                const { refId, prettyHAST } = noteRefs[ent];
                const noteId = refId.id;
                const noteForRef = (await engine.getNote(noteId)).data;
                // shouldn't happen
                if (!noteForRef) {
                    throw Error(`no note found for ${JSON.stringify(refId)}`);
                }
                const noteCacheForRenderDict = await (0, unified_1.getParsingDependencyDicts)(noteForRef, engine, config, engine.vaults);
                const proc = unified_1.MDUtilsV5.procRehypeFull({
                    // engine,
                    noteCacheForRenderDict,
                    noteToRender: noteForRef,
                    fname: noteForRef.fname,
                    vault: noteForRef.vault,
                    vaults: engine.vaults,
                    wsRoot: engine.wsRoot,
                    config,
                    insideNoteRef: true,
                }, { flavor: unified_1.ProcFlavor.PUBLISHING });
                const out = proc.stringify(proc.runSync(prettyHAST));
                const refIdString = (0, unified_1.getRefId)(refId);
                const dst = path_1.default.join(notesRefsDir, refIdString + ".html");
                this.L.debug({ ctx, dst, msg: "writeNote" });
                fs_extra_1.default.ensureFileSync(dst);
                fs_extra_1.default.writeFileSync(dst, out);
                return refIdString;
            }));
        }
        const podDstPath = path_1.default.join(podDstDir, "notes.json");
        const podConfigDstPath = path_1.default.join(podDstDir, "dendron.json");
        const refDstPath = path_1.default.join(podDstDir, "refs.json");
        const treeDstPath = path_1.default.join(podDstDir, "tree.json");
        const sidebar = sidebarResp.value;
        const tree = common_all_1.TreeUtils.generateTreeData(payload.notes, sidebar);
        // Generate full text search data
        const fuseDstPath = path_1.default.join(podDstDir, "fuse.json");
        const fuseIndex = (0, common_all_1.createSerializedFuseNoteIndex)(publishedNotes);
        // Concurrently write out data
        await Promise.all([
            fs_extra_1.default.writeJson(podDstPath, {
                ...payload,
                notes: (0, exports.removeBodyFromNotesDict)(payload.notes),
            }, { encoding: "utf8", spaces: 2 }),
            fs_extra_1.default.writeJSONSync(refDstPath, refIds, {
                encoding: "utf8",
                spaces: 2,
            }),
            fs_extra_1.default.writeJSON(podConfigDstPath, engineConfig, {
                encoding: "utf8",
                spaces: 2,
            }),
            fs_extra_1.default.writeJSON(treeDstPath, tree, {
                encoding: "utf8",
                spaces: 2,
            }),
            fs_extra_1.default.writeJson(fuseDstPath, fuseIndex),
            this._writeEnvFile({ siteConfig, dest }),
        ]);
        const publicPath = path_1.default.join(podDstDir, "..", "public");
        const publicDataPath = path_1.default.join(publicPath, "data");
        if (fs_extra_1.default.existsSync(publicDataPath)) {
            this.L.info("removing existing 'public/data");
            fs_extra_1.default.removeSync(publicDataPath);
        }
        this.L.info("moving data");
        fs_extra_1.default.copySync(podDstDir, publicDataPath);
        return { notes: lodash_1.default.values(publishedNotes) };
    }
}
exports.NextjsExportPod = NextjsExportPod;
//# sourceMappingURL=NextjsExportPod.js.map