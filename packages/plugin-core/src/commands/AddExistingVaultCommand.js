"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddExistingVaultCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const utils_1 = require("../components/lookup/utils");
const constants_1 = require("../constants");
const logger_1 = require("../logger");
const analytics_1 = require("../utils/analytics");
const files_1 = require("../utils/files");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
var VaultType;
(function (VaultType) {
    VaultType["LOCAL"] = "local";
    VaultType["REMOTE"] = "remote";
})(VaultType || (VaultType = {}));
class AddExistingVaultCommand extends base_1.BasicCommand {
    _ext;
    key = constants_1.DENDRON_COMMANDS.ADD_EXISTING_VAULT.key;
    constructor(_ext) {
        super();
        this._ext = _ext;
    }
    generateRemoteEntries = () => {
        return constants_1.DENDRON_REMOTE_VAULTS.map(({ name: label, description, data: src }) => {
            return { label, description, src };
        }).concat([
            {
                label: "custom",
                description: "custom endpoint",
                alwaysShow: true,
                src: "",
            },
        ]);
    };
    /** A regular, non-self contained vault. */
    async gatherVaultStandard(sourceType) {
        let sourceName;
        let vaultDestination;
        if (sourceType === VaultType.REMOTE) {
            // eslint-disable-next-line  no-async-promise-executor
            const out = new Promise(async (resolve) => {
                const qp = vsCodeUtils_1.VSCodeUtils.createQuickPick();
                qp.ignoreFocusOut = true;
                qp.placeholder = "choose a preset or enter a custom git endpoint";
                qp.items = this.generateRemoteEntries();
                qp.onDidAccept(async () => {
                    const value = qp.value;
                    const selected = qp.selectedItems[0];
                    if (!selected) {
                        qp.hide();
                        return resolve(undefined);
                    }
                    if (selected.label === "custom") {
                        if (utils_1.PickerUtilsV2.isInputEmpty(value)) {
                            return vscode_1.window.showInformationMessage("please enter an endpoint");
                        }
                        selected.src = qp.value;
                    }
                    const sourceRemotePath = selected.src;
                    const placeHolder = selected.label === "custom"
                        ? common_server_1.GitUtils.getRepoNameFromURL(sourceRemotePath)
                        : selected.label;
                    const out = await vsCodeUtils_1.VSCodeUtils.showInputBox({
                        prompt: "Path to your new vault (relative to your workspace root)",
                        placeHolder: path_1.default.basename(placeHolder),
                        value: placeHolder,
                    });
                    if (utils_1.PickerUtilsV2.isInputEmpty(out)) {
                        return resolve(undefined);
                    }
                    vaultDestination = path_1.default.join(this._ext.getDWorkspace().wsRoot, out);
                    sourceName = await vsCodeUtils_1.VSCodeUtils.showInputBox({
                        prompt: "Name of new vault (optional, press enter to skip)",
                        value: placeHolder,
                    });
                    qp.hide();
                    return resolve({
                        type: sourceType,
                        name: sourceName,
                        path: vaultDestination,
                        pathRemote: sourceRemotePath,
                    });
                });
                qp.show();
            });
            return out;
        }
        vaultDestination = await this.gatherDestinationFolder();
        if (!vaultDestination)
            return;
        const placeHolder = path_1.default.basename(vaultDestination);
        sourceName = await vsCodeUtils_1.VSCodeUtils.showInputBox({
            prompt: "Name of new vault (optional, press enter to skip)",
            placeHolder,
        });
        return {
            type: sourceType,
            name: sourceName,
            path: vaultDestination,
        };
    }
    async gatherDestinationFolder() {
        const defaultUri = vscode_1.Uri.file(this._ext.getDWorkspace().wsRoot);
        // opens the workspace root by default and prompts user to select vault
        const options = {
            canSelectMany: false,
            openLabel: "Select vault to add",
            canSelectFiles: false,
            canSelectFolders: true,
            defaultUri,
        };
        const folder = await vsCodeUtils_1.VSCodeUtils.openFilePicker(options);
        if (lodash_1.default.isUndefined(folder)) {
            return;
        }
        return folder;
    }
    async gatherVaultSelfContained(sourceType) {
        if (sourceType === VaultType.LOCAL) {
            const sourcePath = await this.gatherDestinationFolder();
            if (!sourcePath)
                return;
            const placeHolder = path_1.default.basename(sourcePath);
            const sourceName = (await vsCodeUtils_1.VSCodeUtils.showInputBox({
                prompt: "Name of new vault (optional, press enter to skip)",
                placeHolder,
            })) || placeHolder;
            const vaultDestination = path_1.default.join(this._ext.getDWorkspace().wsRoot, common_all_1.FOLDERS.DEPENDENCIES, common_all_1.FOLDERS.LOCAL_DEPENDENCY, sourceName);
            await fs_extra_1.default.copy(sourcePath, vaultDestination);
            return {
                type: sourceType,
                name: sourceName,
                path: vaultDestination,
                isSelfContained: true,
            };
        }
        else {
            // Remote vault
            const remote = await vsCodeUtils_1.VSCodeUtils.showInputBox({
                title: "Remote URL",
                prompt: "Enter the URL for the git remote",
                placeHolder: "git@github.com:dendronhq/dendron.git",
                ignoreFocusOut: true,
            });
            // Cancelled
            if (utils_1.PickerUtilsV2.isInputEmpty(remote))
                return;
            // Calculate the vault name from the remote.
            const vaultName = common_server_1.GitUtils.getRepoNameFromURL(remote);
            const sourceName = await vsCodeUtils_1.VSCodeUtils.showInputBox({
                prompt: "Name of new vault (optional, press enter to skip)",
                value: vaultName,
            });
            return {
                type: sourceType,
                name: sourceName,
                path: path_1.default.join(this._ext.getDWorkspace().wsRoot, common_all_1.FOLDERS.DEPENDENCIES, common_server_1.GitUtils.remoteUrlToDependencyPath({
                    vaultName,
                    url: remote,
                })),
                pathRemote: remote,
                isSelfContained: true,
            };
        }
    }
    async gatherInputs() {
        const sourceTypeSelected = await vsCodeUtils_1.VSCodeUtils.showQuickPick([
            {
                label: VaultType.LOCAL,
                picked: true,
                detail: "eg. /home/dendron/hello-vault",
                description: "A local vault is a Dendron vault that is present in your computer",
            },
            {
                label: VaultType.REMOTE,
                detail: "eg. git@github.com:dendronhq/dendron-site.git",
                description: "A remote vault is a Dendron vault that is available at a git endpoint",
            },
        ]);
        if (!sourceTypeSelected) {
            return;
        }
        const sourceType = sourceTypeSelected.label;
        const { config } = this._ext.getDWorkspace();
        if (config.dev?.enableSelfContainedVaults) {
            return this.gatherVaultSelfContained(sourceType);
        }
        else {
            // A "standard", non self contained vault
            return this.gatherVaultStandard(sourceType);
        }
    }
    async handleRemoteRepo(opts) {
        const { vaults, workspace } = await vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Notification,
            title: "Adding remote vault",
            cancellable: false,
        }, async (progress) => {
            progress.report({
                message: "cloning repo",
            });
            const baseDir = this._ext.getDWorkspace().wsRoot;
            const git = (0, common_server_1.simpleGit)({ baseDir });
            await git.clone(opts.pathRemote, opts.path);
            const { vaults, workspace } = await common_server_1.GitUtils.getVaultsFromRepo({
                repoPath: opts.path,
                wsRoot: this._ext.getDWorkspace().wsRoot,
                repoUrl: opts.pathRemote,
            });
            if (lodash_1.default.size(vaults) === 1 && opts.name) {
                vaults[0].name = opts.name;
            }
            // add all vaults
            progress.report({
                message: "adding vault",
            });
            const wsRoot = this._ext.getDWorkspace().wsRoot;
            const wsService = new engine_server_1.WorkspaceService({ wsRoot });
            if (workspace) {
                await wsService.addWorkspace({ workspace });
                await this.addWorkspaceToWorkspace(workspace);
            }
            else {
                // Some things, like updating config, can't be parallelized so needs to be done one at a time
                for (const vault of vaults) {
                    // eslint-disable-next-line no-await-in-loop
                    await wsService.createVault({ vault });
                    // eslint-disable-next-line no-await-in-loop
                    await this.addVaultToWorkspace(vault);
                }
            }
            return { vaults, workspace };
        });
        return { vaults, workspace };
    }
    async handleRemoteRepoSelfContained(opts) {
        return vscode_1.window.withProgress({
            location: vscode_1.ProgressLocation.Notification,
            title: "Adding remote vault",
            cancellable: false,
        }, async (progress) => {
            const { wsRoot } = this._ext.getDWorkspace();
            progress.report({
                message: "cloning repo",
                increment: 0,
            });
            const { name, pathRemote: remoteUrl } = opts;
            const localUrl = opts.path;
            if (!remoteUrl) {
                throw new common_all_1.DendronError({
                    message: "Remote vault has no remote set. This should never happen, please send a bug report if you encounter this.",
                });
            }
            await fs_extra_1.default.ensureDir(localUrl);
            const git = new engine_server_1.Git({ localUrl, remoteUrl });
            // `.` so it clones into the `localUrl` directory, not into a subdirectory of that
            await git.clone(".");
            const { vaults, workspace } = await common_server_1.GitUtils.getVaultsFromRepo({
                repoPath: localUrl,
                wsRoot,
                repoUrl: remoteUrl,
            });
            if (lodash_1.default.size(vaults) === 1 && name) {
                vaults[0].name = name;
            }
            // add all vaults
            const increment = 100 / (vaults.length + 1);
            progress.report({
                message: vaults.length === 1
                    ? "adding vault"
                    : `adding ${vaults.length} vaults`,
                increment,
            });
            const wsService = new engine_server_1.WorkspaceService({ wsRoot });
            if (workspace) {
                // This is a backwards-compatibility fix until workspace vaults are
                // deprecated. If what we cloned was a workspace, then move it where
                // Dendron expects it, because we can't override the path.
                const clonedWSPath = path_1.default.join(wsRoot, workspace.name);
                await fs_extra_1.default.move(localUrl, clonedWSPath);
                // Because we moved the workspace, we also have to recompute the vaults config.
                workspace.vaults = (await common_server_1.GitUtils.getVaultsFromRepo({
                    repoPath: clonedWSPath,
                    repoUrl: remoteUrl,
                    wsRoot,
                })).vaults;
                // Then handle the workspace vault as usual, without self contained vault stuff
                await wsService.addWorkspace({ workspace });
                await this.addWorkspaceToWorkspace(workspace);
            }
            else {
                // Some things, like updating config, can't be parallelized so needs
                // to be done one at a time
                await (0, common_all_1.asyncLoopOneAtATime)(vaults, async (vault) => {
                    if (common_all_1.VaultUtils.isSelfContained(vault)) {
                        await this.checkAndWarnTransitiveDeps({ vault, wsRoot });
                        await wsService.createSelfContainedVault({
                            vault,
                            addToConfig: true,
                            newVault: false,
                        });
                    }
                    else {
                        await wsService.createVault({ vault });
                    }
                    await this.addVaultToWorkspace(vault);
                    progress.report({ increment });
                });
            }
            wsService.dispose();
            return { vaults, workspace };
        });
    }
    /** If a self contained vault contains transitive dependencies, warn the user
     * that they won't be accessible.
     *
     * Adding transitive deps is not supported yet, this check can be removed once
     * support is added.
     */
    async checkAndWarnTransitiveDeps(opts) {
        const vaultRootPath = (0, common_server_1.pathForVaultRoot)(opts);
        try {
            if (await fs_extra_1.default.pathExists(path_1.default.join(vaultRootPath, common_all_1.CONSTANTS.DENDRON_CONFIG_FILE))) {
                const vaultConfig = common_server_1.DConfig.getRaw(vaultRootPath);
                if (common_all_1.ConfigUtils.getVaults(vaultConfig)?.length > 1) {
                    await analytics_1.AnalyticsUtils.trackForNextRun(common_all_1.WorkspaceEvents.TransitiveDepsWarningShow);
                    // Wait for the user to accept the prompt, otherwise window will
                    // reload before they see the warning
                    const openDocsOption = "Open documentation & continue";
                    const select = await vsCodeUtils_1.VSCodeUtils.showMessage(vsCodeUtils_1.MessageSeverity.WARN, "The vault you added depends on other vaults, which is not supported.", {
                        modal: true,
                        detail: "You may be unable to access these transitive vaults. The vault itself should continue to work. Please see for [details]()",
                    }, {
                        title: "Continue",
                        isCloseAffordance: true,
                    }, { title: openDocsOption });
                    if (select?.title === openDocsOption) {
                        // Open a page in the default browser that describes what transitive
                        // dependencies are, and how to add them.
                        await files_1.PluginFileUtils.openWithDefaultApp("https://wiki.dendron.so/notes/q9yo0y7czv8mxlkbnw1ugj1");
                    }
                }
            }
        }
        catch (err) {
            // If anything does fail, ignore the error. This check is not crucial to
            // adding a vault, it's better if we let the user keep adding.
            logger_1.Logger.warn({
                ctx: "VaultAddCommand.handleRemoteRepoSelfContained",
                err,
            });
        }
    }
    async addWorkspaceToWorkspace(workspace) {
        const wsRoot = this._ext.getDWorkspace().wsRoot;
        const vaults = workspace.vaults;
        // Some things, like updating workspace file, can't be parallelized so needs to be done one at a time
        for (const vault of vaults) {
            // eslint-disable-next-line no-await-in-loop
            await this.addVaultToWorkspace(vault);
        }
        // add to gitignore
        await common_server_1.GitUtils.addToGitignore({
            addPath: workspace.name,
            root: wsRoot,
            noCreateIfMissing: true,
        });
        const workspaceDir = path_1.default.join(wsRoot, workspace.name);
        await fs_extra_1.default.ensureDir(workspaceDir);
        await common_server_1.GitUtils.addToGitignore({
            addPath: ".dendron.cache.*",
            root: workspaceDir,
        });
    }
    async addVaultToWorkspace(vault) {
        return engine_server_1.WorkspaceUtils.addVaultToWorkspace({
            vault,
            wsRoot: this._ext.getDWorkspace().wsRoot,
        });
    }
    /**
     * Returns all vaults added
     * @param opts
     * @returns
     */
    async execute(opts) {
        const ctx = "AddExistingVaultCommand";
        let vaults = [];
        logger_1.Logger.info({ ctx, msg: "enter", opts });
        if (opts.type === VaultType.REMOTE) {
            if (opts.isSelfContained) {
                ({ vaults } = await this.handleRemoteRepoSelfContained(opts));
            }
            else {
                ({ vaults } = await this.handleRemoteRepo(opts));
            }
        }
        else {
            const wsRoot = this._ext.getDWorkspace().wsRoot;
            const fsPath = common_all_1.VaultUtils.normVaultPath({
                vault: { fsPath: opts.path },
                wsRoot,
            });
            const wsService = new engine_server_1.WorkspaceService({ wsRoot });
            const vault = {
                fsPath,
            };
            // Make sure these don't get set to undefined, or serialization breaks
            if (await fs_extra_1.default.pathExists(path_1.default.join(opts.path, common_all_1.FOLDERS.NOTES))) {
                vault.selfContained = true;
            }
            if (opts.name) {
                vault.name = opts.name;
            }
            if (common_all_1.VaultUtils.isSelfContained(vault)) {
                await wsService.createSelfContainedVault({
                    vault,
                    addToConfig: true,
                    addToCodeWorkspace: false,
                    newVault: false,
                });
            }
            else {
                await wsService.createVault({ vault });
            }
            await this.addVaultToWorkspace(vault);
            vaults = [vault];
        }
        await vscode_1.commands.executeCommand("workbench.action.reloadWindow");
        vscode_1.window.showInformationMessage("finished adding vault");
        return { vaults };
    }
}
exports.AddExistingVaultCommand = AddExistingVaultCommand;
//# sourceMappingURL=AddExistingVaultCommand.js.map