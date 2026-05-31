"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextJSPublishUtils = exports.getSiteRootDirPath = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const pods_core_1 = require("@dendronhq/pods-core");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const ExportPod_1 = require("../commands/ExportPod");
const ExtensionProvider_1 = require("../ExtensionProvider");
const vsCodeUtils_1 = require("../vsCodeUtils");
const getSiteRootDirPath = () => {
    const ws = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
    const wsRoot = ws.wsRoot;
    const config = ws.config;
    const siteRootDir = common_all_1.ConfigUtils.getPublishing(config).siteRootDir;
    const sitePath = path_1.default.join(wsRoot, siteRootDir);
    return sitePath;
};
exports.getSiteRootDirPath = getSiteRootDirPath;
class NextJSPublishUtils {
    static async prepareNextJSExportPod() {
        const ws = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const wsRoot = ws.wsRoot;
        const cmd = new ExportPod_1.ExportPodCommand(ExtensionProvider_1.ExtensionProvider.getExtension());
        let nextPath = pods_core_1.NextjsExportPodUtils.getNextRoot(wsRoot);
        const podConfig = {
            dest: nextPath,
        };
        const podChoice = (0, pods_core_1.podClassEntryToPodItemV4)(pods_core_1.NextjsExportPod);
        // ask if they want to use default config or fill out themselves.
        const configPromptOut = await vsCodeUtils_1.VSCodeUtils.showQuickPick(["Use default", "Use config"], {
            title: "Would you like to configure the export behavior or use the default behavior?",
            ignoreFocusOut: true,
        });
        let enrichedOpts;
        if (configPromptOut === "Use config") {
            enrichedOpts = await cmd.enrichInputs({ podChoice });
            if (enrichedOpts?.config.dest) {
                nextPath = enrichedOpts.config.dest;
            }
        }
        else {
            enrichedOpts = { podChoice, config: podConfig };
        }
        if ((0, common_all_1.getStage)() !== "prod") {
            const config = common_server_1.DConfig.readConfigSync(wsRoot);
            const publishingConfig = common_all_1.ConfigUtils.getPublishing(config);
            if (enrichedOpts?.config && !publishingConfig.siteUrl) {
                lodash_1.default.set(enrichedOpts.config.overrides, "siteUrl", "localhost:3000");
            }
        }
        return { enrichedOpts, wsRoot, cmd, nextPath };
    }
    static async isInitialized(wsRoot) {
        const out = await vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Notification,
            title: "Checking if NextJS template is initialized",
            cancellable: false,
        }, async () => {
            const out = await pods_core_1.NextjsExportPodUtils.isInitialized({
                wsRoot,
            });
            return out;
        });
        return out;
    }
    static async removeNextPath(nextPath) {
        await vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Notification,
            title: "removing NextJS template directory...",
            cancellable: false,
        }, async () => {
            const out = await pods_core_1.NextjsExportPodUtils.removeNextPath({
                nextPath,
            });
            return out;
        });
    }
    static async install(nextPath) {
        await vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Notification,
            title: "Installing dependencies... This may take a while.",
            cancellable: false,
        }, async () => {
            const out = await pods_core_1.NextjsExportPodUtils.installDependencies({
                nextPath,
            });
            return out;
        });
    }
    static async clone(nextPath) {
        await vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Notification,
            title: "Cloning NextJS template...",
            cancellable: false,
        }, async () => {
            const out = await pods_core_1.NextjsExportPodUtils.cloneTemplate({
                nextPath,
            });
            return out;
        });
    }
    static async initialize(nextPath) {
        await NextJSPublishUtils.clone(nextPath);
        await NextJSPublishUtils.install(nextPath);
    }
    static async build(cmd, podChoice, podConfig) {
        // todo: handle override.
        await vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Notification,
            title: "Building...",
            cancellable: false,
        }, async () => {
            const out = cmd.execute({ podChoice, config: podConfig, quiet: true });
            return out;
        });
    }
    static async promptSkipBuild() {
        const skipBuildPromptOut = await vsCodeUtils_1.VSCodeUtils.showQuickPick(["Skip", "Don't skip"], {
            title: "Would you like to skip the build process?",
            ignoreFocusOut: true,
        });
        return skipBuildPromptOut === "Skip";
    }
    static async export(nextPath) {
        await vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Notification,
            title: "Exporting... this may take a while.",
            cancellable: false,
        }, async () => {
            const out = await pods_core_1.NextjsExportPodUtils.startNextExport({
                nextPath,
                quiet: true,
            });
            return out;
        });
    }
    static async dev(nextPath) {
        const out = await vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Notification,
            title: "starting server.",
            cancellable: true,
        }, async () => {
            const out = await pods_core_1.NextjsExportPodUtils.startNextDev({
                nextPath,
                quiet: true,
            });
            return out;
        });
        return out;
    }
    static async handlePublishTarget(target, nextPath, wsRoot) {
        switch (target) {
            case pods_core_1.PublishTarget.GITHUB: {
                const docsPath = path_1.default.join(wsRoot, "docs");
                const outPath = path_1.default.join(nextPath, "out");
                await vscode_1.window.withProgress({
                    location: vscode_1.ProgressLocation.Notification,
                    title: "Building Github target...",
                    cancellable: false,
                }, async () => {
                    const docsExist = fs_extra_1.default.pathExistsSync(docsPath);
                    if (docsExist) {
                        const docsRemovePromptOut = await vsCodeUtils_1.VSCodeUtils.showQuickPick(["Don't remove.", "Remove"], {
                            title: "Docs folder already exists. Remove and continue??",
                            ignoreFocusOut: true,
                        });
                        if (docsRemovePromptOut === "Don't remove") {
                            vscode_1.window.showInformationMessage("Exiting.");
                            return;
                        }
                        vscode_1.window.showInformationMessage("Removing /docs");
                        fs_extra_1.default.removeSync(docsPath);
                    }
                    fs_extra_1.default.moveSync(outPath, docsPath);
                    fs_extra_1.default.ensureFileSync(path_1.default.join(docsPath, ".nojekyll"));
                });
                vscode_1.window.showInformationMessage(`Done exporting. files available at ${docsPath}`);
                return;
            }
            default:
                (0, common_all_1.assertUnreachable)(target);
        }
    }
}
exports.NextJSPublishUtils = NextJSPublishUtils;
//# sourceMappingURL=site.js.map