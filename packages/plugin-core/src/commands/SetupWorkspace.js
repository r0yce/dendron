"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupWorkspaceCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = __importStar(require("vscode"));
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const vsCodeUtils_1 = require("../vsCodeUtils");
const blankInitializer_1 = require("../workspace/blankInitializer");
const workspaceActivator_1 = require("../workspace/workspaceActivator");
const base_1 = require("./base");
const CODE_WS_LABEL = "Code Workspace";
const CODE_WS_DETAIL = undefined;
var EXISTING_ROOT_ACTIONS;
(function (EXISTING_ROOT_ACTIONS) {
    EXISTING_ROOT_ACTIONS["CONTINUE"] = "Continue";
    EXISTING_ROOT_ACTIONS["DELETE"] = "Delete";
    EXISTING_ROOT_ACTIONS["ABORT"] = "Abort";
})(EXISTING_ROOT_ACTIONS || (EXISTING_ROOT_ACTIONS = {}));
class SetupWorkspaceCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.INIT_WS.key;
    async gatherInputs() {
        let workspaceType = common_all_1.WorkspaceType.CODE;
        const defaultUri = vscode_1.Uri.file((0, common_server_1.resolveTilde)("~"));
        let rootDirRaw;
        const workspaceFolders = vscode_1.default.workspace.workspaceFolders;
        if (workspaceFolders !== undefined &&
            workspaceFolders.length > 0 &&
            (await engine_server_1.WorkspaceUtils.getWorkspaceType({
                workspaceFolders,
            })) === common_all_1.WorkspaceType.NONE) {
            // If there's a non-Dendron workspace already open, offer to convert that to a Dendron workspace first
            const initNative = await vsCodeUtils_1.VSCodeUtils.showQuickPick([
                {
                    picked: true,
                    label: CODE_WS_LABEL,
                    description: CODE_WS_DETAIL,
                    detail: "A dedicated IDE workspace for just your notes",
                },
                ...workspaceFolders.map((folder) => {
                    const folderName = folder.name || folder.uri.fsPath;
                    return {
                        label: "Native Workspace",
                        description: folder.uri.fsPath,
                        detail: `Take notes in "${folderName}" alongside your existing project`,
                    };
                }),
            ], {
                ignoreFocusOut: true,
                title: "Workspace type to initialize",
            });
            if (initNative === undefined)
                return;
            if (initNative.label !== CODE_WS_LABEL ||
                initNative.description !== CODE_WS_DETAIL) {
                // Not sure if there's a better way to check for this, but this is if a native workspace option was selected
                workspaceType = common_all_1.WorkspaceType.NATIVE;
                rootDirRaw = await vsCodeUtils_1.VSCodeUtils.gatherFolderPath({
                    default: "docs",
                    relativeTo: initNative.description,
                    override: {
                        title: "Path for Dendron Native Workspace",
                        prompt: `Path to folder, relative to ${initNative.label}`,
                    },
                });
            }
            // If the code workspace option is selected, then we continue with `rootDirRaw` unset and type still set to `CODE`
        }
        if (!rootDirRaw) {
            // Prompt user where to create workspace
            const options = {
                canSelectMany: false,
                openLabel: "Create Workspace",
                canSelectFiles: false,
                canSelectFolders: true,
                defaultUri,
            };
            rootDirRaw = await vsCodeUtils_1.VSCodeUtils.openFilePicker(options);
            if (lodash_1.default.isUndefined(rootDirRaw)) {
                return;
            }
        }
        return {
            rootDirRaw,
            workspaceType,
            workspaceInitializer: new blankInitializer_1.BlankInitializer(),
        };
    }
    handleExistingRoot = async ({ rootDir, skipConfirmation, }) => {
        if (!this.isEmptyDirectory(rootDir) && !skipConfirmation) {
            const resp = await vsCodeUtils_1.VSCodeUtils.showQuickPick([
                {
                    label: EXISTING_ROOT_ACTIONS.CONTINUE,
                    detail: `Continue creating a workspace, putting Dendron files into the existing folder.`,
                },
                {
                    label: EXISTING_ROOT_ACTIONS.DELETE,
                    detail: "Delete this folder and continue creating a workspace.",
                },
                {
                    label: EXISTING_ROOT_ACTIONS.ABORT,
                    detail: "Abort creating a workspace.",
                },
            ], {
                title: `${rootDir} already exists, how do you want to continue?`,
                ignoreFocusOut: true,
                canPickMany: false,
            });
            if (resp === undefined || resp.label === EXISTING_ROOT_ACTIONS.ABORT) {
                vscode_1.default.window.showInformationMessage("did not initialize dendron workspace");
                return false;
            }
            if (resp.label === EXISTING_ROOT_ACTIONS.DELETE) {
                try {
                    fs_extra_1.default.removeSync(rootDir);
                    return true;
                }
                catch (err) {
                    this.L.error(JSON.stringify(err));
                    vscode_1.default.window.showErrorMessage(`error removing ${rootDir}. please check that it's not currently open`);
                    return false;
                }
            }
            return true;
        }
        return true;
    };
    addAnalyticsPayload(opts) {
        return {
            workspaceType: opts?.workspaceType,
        };
    }
    async execute(opts) {
        const ctx = "SetupWorkspaceCommand";
        // This command can run before the extension is registered, especially during testing
        const defaultSelfContained = vsCodeUtils_1.VSCodeUtils.getWorkspaceConfig().get(common_all_1.DENDRON_VSCODE_CONFIG_KEYS.ENABLE_SELF_CONTAINED_VAULTS_WORKSPACE) ?? false;
        const { rootDirRaw: rootDir, skipOpenWs, workspaceType, selfContained, } = lodash_1.default.defaults(opts, {
            selfContained: defaultSelfContained,
        });
        logger_1.Logger.info({ ctx, rootDir, skipOpenWs, workspaceType });
        if (!(await this.handleExistingRoot({
            rootDir,
            skipConfirmation: opts.skipConfirmation ?? undefined,
        }))) {
            return {};
        }
        let wsVault;
        let additionalVaults;
        if (opts?.workspaceInitializer?.createVaults) {
            ({ wsVault, additionalVaults } = opts.workspaceInitializer.createVaults(opts.vault));
        }
        // Default to CODE workspace, otherwise create a NATIVE one
        const createCodeWorkspace = workspaceType === common_all_1.WorkspaceType.CODE || workspaceType === undefined;
        const svc = await engine_server_1.WorkspaceService.createWorkspace({
            wsVault,
            additionalVaults,
            wsRoot: rootDir,
            createCodeWorkspace,
            useSelfContainedVault: selfContained ?? undefined,
        }); // TODO: align WorkspaceServiceCreateOpts with |undefined per Monorepo 4-axis framework + di-container ergonomics
        logger_1.Logger.info({
            ctx: `${ctx}:postCreateWorkspace`,
            wsRoot: rootDir,
            wsVault,
        });
        if (opts?.workspaceInitializer?.onWorkspaceCreation) {
            await opts.workspaceInitializer.onWorkspaceCreation({
                wsVault,
                additionalVaults,
                wsRoot: rootDir,
                svc,
            }); // TODO: tighten after engine-server WorkspaceServiceCreateOpts updated with |undefined per Monorepo framework
        }
        if (!skipOpenWs) {
            vscode_1.default.window.showInformationMessage("opening dendron workspace");
            if (workspaceType === common_all_1.WorkspaceType.CODE) {
                vsCodeUtils_1.VSCodeUtils.openWS(vscode_1.default.Uri.file(path_1.default.join(rootDir, common_all_1.CONSTANTS.DENDRON_WS_NAME)).fsPath);
            }
            else if (workspaceType === common_all_1.WorkspaceType.NATIVE) {
                if (opts.EXPERIMENTAL_openNativeWorkspaceNoReload) {
                    const ext = ExtensionProvider_1.ExtensionProvider.getExtension();
                    const { context } = ext;
                    ext.type = common_all_1.WorkspaceType.NATIVE;
                    const wsa = new workspaceActivator_1.WorkspaceActivator();
                    const resp = await wsa.init({
                        context,
                        ext,
                        wsRoot: rootDir,
                    });
                    if (resp.error) {
                        throw common_all_1.ErrorFactory.createInvalidStateError({
                            message: "issure init workspace",
                        });
                    }
                    await wsa.activate({
                        context,
                        ext,
                        wsRoot: rootDir,
                        engine: resp.data.engine,
                        wsService: resp.data.wsService,
                        workspaceInitializer: opts.workspaceInitializer,
                    });
                }
                else {
                    // For native workspaces, we just need to reload the existing workspace because we want to keep the same workspace.
                    vsCodeUtils_1.VSCodeUtils.reloadWindow();
                }
            }
        }
        return { wsVault, additionalVaults };
    }
    /**
     * Tests whether or not the given directory is empty.
     */
    isEmptyDirectory(path) {
        if (!fs_extra_1.default.existsSync(path))
            return true;
        const files = fs_extra_1.default.readdirSync(path);
        return !files || !files.length;
    }
}
exports.SetupWorkspaceCommand = SetupWorkspaceCommand;
//# sourceMappingURL=SetupWorkspace.js.map