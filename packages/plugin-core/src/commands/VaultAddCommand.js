"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaultAddCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const utils_1 = require("../components/lookup/utils");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
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
class VaultAddCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.VAULT_ADD.key;
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
        const localVaultPathPlaceholder = "vault2";
        let sourcePath;
        let sourceName;
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
                    const path2Vault = selected.label === "custom"
                        ? common_server_1.GitUtils.getRepoNameFromURL(sourceRemotePath)
                        : selected.label;
                    const placeHolder = path2Vault;
                    const out = await vsCodeUtils_1.VSCodeUtils.showInputBox({
                        prompt: "Path to your new vault (relative to your workspace root)",
                        placeHolder: localVaultPathPlaceholder,
                        value: path2Vault,
                    });
                    if (utils_1.PickerUtilsV2.isInputEmpty(out)) {
                        resolve(undefined);
                    }
                    sourcePath = out;
                    sourceName = await vsCodeUtils_1.VSCodeUtils.showInputBox({
                        prompt: "Name of new vault (optional, press enter to skip)",
                        value: placeHolder,
                    });
                    qp.hide();
                    return resolve({
                        type: sourceType,
                        name: sourceName,
                        path: sourcePath,
                        pathRemote: sourceRemotePath,
                    });
                });
                qp.show();
            });
            return out;
        }
        else {
            const out = await vsCodeUtils_1.VSCodeUtils.showInputBox({
                prompt: "Path to your new vault (relative to your workspace root)",
                placeHolder: localVaultPathPlaceholder,
            });
            if (utils_1.PickerUtilsV2.isInputEmpty(out))
                return;
            sourcePath = out;
        }
        sourceName = await vsCodeUtils_1.VSCodeUtils.showInputBox({
            prompt: "Name of new vault (optional, press enter to skip)",
        });
        return {
            type: sourceType,
            name: sourceName,
            path: sourcePath,
        };
    }
    async gatherVaultSelfContained(sourceType) {
        // If the vault name already exists, creating a vault with the same name would break things
        if (sourceType === VaultType.LOCAL) {
            // Local vault
            // For self contained vaults, we'll have the vault name match the folder for
            // now. We can make this flexible later if that's a better UX, or give
            // instructions on the wiki on how to change the name later.
            const vaultName = await vsCodeUtils_1.VSCodeUtils.showInputBox({
                title: "Vault name",
                prompt: "Name for the new vault",
                placeHolder: "my-vault",
            });
            // If empty, then user cancelled the prompt
            if (utils_1.PickerUtilsV2.isInputEmpty(vaultName))
                return;
            return {
                type: sourceType,
                name: vaultName,
                path: path_1.default.join(common_all_1.FOLDERS.DEPENDENCIES, common_all_1.FOLDERS.LOCAL_DEPENDENCY, vaultName),
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
            // Calculate the vault name from the remote. If that fails, ask the user for a unique name to use.
            const vaultName = common_server_1.GitUtils.getRepoNameFromURL(remote);
            return {
                type: sourceType,
                name: vaultName,
                path: path_1.default.join(common_all_1.FOLDERS.DEPENDENCIES, common_server_1.GitUtils.remoteUrlToDependencyPath({
                    vaultName,
                    url: remote,
                })),
                pathRemote: remote,
                isSelfContained: true,
            };
        }
    }
    async gatherInputs() {
        vscode_1.window.showWarningMessage(`This command will be deprecated in future releases. 
      Please use Dendron: Create New Vault to create a new vault and 
      Dendron: Add Existing Vault to add an existing vault to your workspace.`);
        const sourceTypeSelected = await vsCodeUtils_1.VSCodeUtils.showQuickPick([
            { label: VaultType.LOCAL, picked: true },
            { label: VaultType.REMOTE },
        ]);
        if (!sourceTypeSelected) {
            return;
        }
        const sourceType = sourceTypeSelected.label;
        const { config } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
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
            const baseDir = ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot;
            const git = (0, common_server_1.simpleGit)({ baseDir });
            await git.clone(opts.pathRemote, opts.path);
            const { vaults, workspace } = await common_server_1.GitUtils.getVaultsFromRepo({
                repoPath: path_1.default.join(baseDir, opts.path),
                wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
                repoUrl: opts.pathRemote,
            });
            if (lodash_1.default.size(vaults) === 1 && opts.name) {
                vaults[0].name = opts.name;
            }
            // add all vaults
            progress.report({
                message: "adding vault",
            });
            const wsRoot = ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot;
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
            const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            progress.report({
                message: "cloning repo",
                increment: 0,
            });
            const { name, pathRemote: remoteUrl } = opts;
            const localUrl = path_1.default.join(wsRoot, opts.path);
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
        const wsRoot = ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot;
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
            wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
        });
    }
    /**
     * Returns all vaults added
     * @param opts
     * @returns
     */
    async execute(opts) {
        const ctx = "VaultAdd";
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
            const wsRoot = ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot;
            const fsPath = common_all_1.VaultUtils.normVaultPath({
                vault: { fsPath: opts.path },
                wsRoot,
            });
            const wsService = new engine_server_1.WorkspaceService({ wsRoot });
            const vault = {
                fsPath,
            };
            // Make sure these don't get set to undefined, or serialization breaks
            if (opts.isSelfContained) {
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
                    newVault: true,
                });
            }
            else {
                await wsService.createVault({ vault });
            }
            await this.addVaultToWorkspace(vault);
            vaults = [vault];
        }
        vscode_1.window.showInformationMessage("finished adding vault");
        await vscode_1.commands.executeCommand("workbench.action.reloadWindow");
        return { vaults };
    }
}
exports.VaultAddCommand = VaultAddCommand;
//# sourceMappingURL=VaultAddCommand.js.map