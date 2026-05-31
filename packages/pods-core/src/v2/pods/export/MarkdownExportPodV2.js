"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownExportPodV2 = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const unified_1 = require("@dendronhq/unified");
const async_1 = require("async");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const __1 = require("../..");
const __2 = require("../../..");
class MarkdownExportPodV2 {
    _config;
    _engine;
    _dendronConfig;
    constructor({ podConfig, engine, dendronConfig, }) {
        this._config = podConfig;
        this._engine = engine;
        this._dendronConfig = dendronConfig;
    }
    async exportNotes(notes, progress) {
        const { logger, dispose } = (0, common_server_1.createDisposableLogger)("MarkdownExportV2");
        const { destination, exportScope } = this._config;
        const ctx = "exportNotes";
        const config = { ...common_server_1.DConfig.readConfigSync(this._engine.wsRoot) };
        if (destination === "clipboard") {
            const exportedNotes = await this.renderNote({ note: notes[0], config });
            return common_all_1.ResponseUtil.createHappyResponse({
                data: {
                    exportedNotes,
                },
            });
        }
        try {
            fs_extra_1.default.ensureDirSync(path_1.default.dirname(destination));
        }
        catch (err) {
            return {
                data: {},
                error: err,
            };
        }
        logger.debug({ msg: "pre:iterate_notes" });
        const errors = [];
        const total = notes.length;
        progress?.report({ message: `Exporting ${total} notes...` });
        let acc = 0;
        const minStep = Math.max(100, total / 20.0);
        // looks like one is ideal, doing this in parallel slows down this process
        // eg. with limit of 1, latency is 30ms, with limit of 2, latency is 600ms
        const result = await (0, async_1.mapLimit)(notes, 1, async (note) => {
            try {
                const startActivate = process.hrtime();
                const body = await this.renderNote({ note, config });
                const hpath = this.dot2Slash(note.fname) + ".md";
                const vname = common_all_1.VaultUtils.getName(note.vault);
                const fpath = path_1.default.join(destination, vname, hpath);
                logger.debug({ fpath, msg: "pre:write" });
                await fs_extra_1.default.ensureDir(path_1.default.dirname(fpath));
                await fs_extra_1.default.writeFile(fpath, body);
                if (progress) {
                    acc += 1;
                    if (acc / minStep === 0) {
                        progress.report({ increment: acc / total });
                    }
                }
                const duration = (0, common_server_1.getDurationMilliseconds)(startActivate);
                logger.info({ ctx, duration, id: fpath });
                return note;
            }
            catch (err) {
                errors.push(err);
                return;
            }
            // 100
            // 10 = 1s
            // 100 = 10s
            // 1k = 100s
            // 10k = 1ks, 16min
        });
        // const result = await parallelLimit(
        //   notes.map(async (note) => {
        //     try {
        //       const body = await this.renderNote(note);
        //       const hpath = this.dot2Slash(note.fname) + ".md";
        //       const vname = VaultUtils.getName(note.vault);
        //       const fpath = path.join(destination, vname, hpath);
        //       logger.debug({ fpath, msg: "pre:write" });
        //       await fs.ensureDir(path.dirname(fpath));
        //       await fs.writeFile(fpath, body);
        //       if (progress) {
        //         progress.report({ increment: 1 });
        //       }
        //       return note;
        //     } catch (err) {
        //       errors.push(err as DendronError);
        //       return;
        //     }
        //   }),
        //   50
        // );
        // Export Assets for vault and workspace exportScope
        const vaultsArray = [];
        switch (exportScope) {
            case __1.PodExportScope.Vault: {
                vaultsArray.push(notes[0].vault);
                break;
            }
            case __1.PodExportScope.Workspace: {
                vaultsArray.push(...this._engine.vaults);
                break;
            }
            // no default
        }
        await Promise.all(vaultsArray.map(async (vault) => {
            const destPath = path_1.default.join(destination, common_all_1.VaultUtils.getRelPath(vault), common_all_1.FOLDERS.ASSETS);
            const srcPath = path_1.default.join(this._engine.wsRoot, common_all_1.VaultUtils.getRelPath(vault), common_all_1.FOLDERS.ASSETS);
            if (fs_extra_1.default.pathExistsSync(srcPath)) {
                await fs_extra_1.default.copy(srcPath, destPath);
            }
        })).catch((err) => {
            errors.push(err);
        });
        dispose();
        const exportedNotes = result.filter((ent) => !lodash_1.default.isUndefined(ent));
        if (errors.length > 0) {
            return {
                data: {
                    exportedNotes,
                },
                error: new common_all_1.DendronCompositeError(errors),
            };
        }
        else {
            return common_all_1.ResponseUtil.createHappyResponse({
                data: {
                    exportedNotes,
                },
            });
        }
    }
    /**
     * TODO: OPTIMIZE
     * Currently, this can take anywhere between 30ms to 1300ms to execute on one document.
     * Also does not work well in parallel. Need to do some profiling work
     */
    async renderNote({ note, config, }) {
        const { convertTagNotesToLinks = false, convertUserNotesToLinks = false, addFrontmatterTitle, } = this._config;
        const engine = this._engine;
        const workspaceConfig = common_all_1.ConfigUtils.getWorkspace(config);
        workspaceConfig.enableUserTags = convertUserNotesToLinks;
        workspaceConfig.enableHashTags = convertTagNotesToLinks;
        if (!lodash_1.default.isUndefined(addFrontmatterTitle)) {
            const previewConfig = common_all_1.ConfigUtils.getPreview(config);
            previewConfig.enableFMTitle = addFrontmatterTitle;
        }
        const noteCacheForRenderDict = await (0, unified_1.getParsingDependencyDicts)(note, engine, config, engine.vaults);
        let remark = unified_1.MDUtilsV5.procRemarkFull({
            noteToRender: note,
            noteCacheForRenderDict,
            dest: unified_1.DendronASTDest.MD_REGULAR,
            config: {
                ...config,
                preview: {
                    ...config.preview,
                    enablePrettyRefs: false,
                },
                publishing: {
                    ...config.publishing,
                    enablePrettyRefs: false,
                },
            },
            fname: note.fname,
            vault: note.vault,
            vaults: engine.vaults,
            wsRoot: engine.wsRoot,
        });
        if (this._config.wikiLinkToURL && !lodash_1.default.isUndefined(this._dendronConfig)) {
            remark = remark.use(unified_1.RemarkUtils.convertWikiLinkToNoteUrl(note, [], this._engine, this._dendronConfig));
        }
        else {
            remark = remark.use(unified_1.RemarkUtils.convertLinksFromDotNotation(note, []));
        }
        const out = (await remark.process(note.body)).toString();
        return lodash_1.default.trim(out);
    }
    dot2Slash(fname) {
        const hierarchy = fname.split(".");
        return path_1.default.join(...hierarchy);
    }
    static config() {
        return __2.ConfigFileUtils.createExportConfig({
            required: ["destination"],
            properties: {
                wikiLinkToURL: {
                    description: "How to convert the wikilinks",
                    type: "boolean",
                    default: false,
                    nullable: true,
                },
                destination: {
                    description: "export destination. Specify either a file path or 'clipboard' to export to your clipboard",
                    type: "string",
                },
                convertTagNotesToLinks: {
                    type: "boolean",
                    default: false,
                    nullable: true,
                },
                convertUserNotesToLinks: {
                    type: "boolean",
                    default: false,
                    nullable: true,
                },
                addFrontmatterTitle: {
                    type: "boolean",
                    nullable: true,
                },
            },
        });
    }
}
exports.MarkdownExportPodV2 = MarkdownExportPodV2;
//# sourceMappingURL=MarkdownExportPodV2.js.map