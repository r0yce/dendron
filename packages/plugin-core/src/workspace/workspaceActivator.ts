import "reflect-metadata";
import * as Sentry from "@sentry/node";
import {
  DWorkspaceV2,
  ErrorFactory,
  getStage,
  RespV3,
  WorkspaceType,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import {
  HistoryService,
  MetadataService,
  WorkspaceService,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { Logger } from "../logger";
import { EngineAPIService } from "../services/EngineAPIService";
import { StateService } from "../services/stateService";
import { TextDocumentServiceFactory } from "../services/TextDocumentServiceFactory";
import { ExtensionUtils } from "../utils/ExtensionUtils";
import { StartupUtils } from "../utils/StartupUtils";
import { VSCodeUtils } from "../vsCodeUtils";
import { DendronExtension } from "../workspace";
import { WSUtils } from "../WSUtils";
import {
  checkNoDuplicateVaultNames,
  getOrPromptWSRoot,
} from "./activatorHelpers";
import {
  reloadWorkspace,
  togglePluginActiveContext,
  updateEngineAPI,
} from "./activatorReload";
import { initTreeView } from "./activatorTreeView";
import {
  analyzeWorkspace,
  getAndCleanPreviousWSVersion,
} from "./activatorLifecycle";
import { verifyOrStartServerProcess } from "./activatorServer";
import { DendronCodeWorkspace } from "./codeWorkspace";
import { DendronNativeWorkspace } from "./nativeWorkspace";
import { WorkspaceInitFactory } from "./WorkspaceInitFactory";
import { WorkspaceInitializer } from "./workspaceInitializer";

/**
 * Get version of Dendron when workspace was last activated
 */

type WorkspaceActivatorValidateOpts = {
  ext: IDendronExtension;
  context: vscode.ExtensionContext;
};

type WorkspaceActivatorOpts = {
  ext: IDendronExtension;
  context: vscode.ExtensionContext;
  wsRoot: string;
  workspaceInitializer?: WorkspaceInitializer | undefined;
};

type WorkspaceActivatorSkipOpts = {
  opts?:
    | Partial<{
        /**
         * Skip setting up language features (eg. code action providesr)
         */
        skipLanguageFeatures: boolean | undefined;
        /**
         * Skip automatic migrations on start
         */
        skipMigrations: boolean | undefined;
        /**
         * Skip surfacing dialogues on startup
         */
        skipInteractiveElements: boolean | undefined;

        /**
         * Skip showing tree view
         */
        skipTreeView: boolean | undefined;
      }>
    | undefined;
};
export class WorkspaceActivator {
  /**
   * Initialize workspace. All logic that happens before the engine is initialized happens here
   * - create workspace class
   * - register traits
   * - run migrations if necessary
   */
  async init({
    ext,
    context,
    wsRoot,
    opts,
  }: WorkspaceActivatorOpts & WorkspaceActivatorSkipOpts): Promise<
    RespV3<{
      workspace: DWorkspaceV2;
      engine: EngineAPIService;
      wsService: WorkspaceService;
    }>
  > {
    const ctx = "WorkspaceActivator.init";
    // --- Setup workspace
    let workspace: DWorkspaceV2;
    if (ext.type === WorkspaceType.NATIVE) {
      workspace = await this.initNativeWorkspace({ ext, context, wsRoot });
      if (!workspace) {
        return {
          error: ErrorFactory.createInvalidStateError({
            message: "could not find native workspace",
          }),
        };
      }
    } else {
      workspace = await this.initCodeWorkspace({ ext, context, wsRoot });
    }

    ext.workspaceImpl = workspace;
    // HACK: Only set up note traits after workspaceImpl has been set, so that
    // the wsRoot path is known for locating the note trait definition location.
    if (vscode.workspace.isTrusted) {
      ext.traitRegistrar.initialize();
    } else {
      Logger.info({
        msg: "User specified note traits not initialized because workspace is not trusted.",
      });
    }

    // --- Initialization
    Logger.info({ ctx: `${ctx}:postSetupTraits`, wsRoot });
    const currentVersion = DendronExtension.version();
    const wsService = new WorkspaceService({ wsRoot });
    const dendronConfig = workspace.config;
    const stateService = new StateService({
      globalState: context.globalState,
      workspaceState: context.workspaceState,
    });
    ext.workspaceService = wsService;

    // get previous workspace version and fixup
    const previousWorkspaceVersion = await getAndCleanPreviousWSVersion({
      wsService,
      stateService,
      ext,
    });

    // run migrations
    const maybeWsSettings =
      ext.type === WorkspaceType.CODE
        ? wsService.getCodeWorkspaceSettingsSync()
        : undefined;
    if (!opts?.skipMigrations) {
      await StartupUtils.showManualUpgradeMessageIfNecessary({
        previousWorkspaceVersion,
        currentVersion,
      });

      await StartupUtils.runMigrationsIfNecessary({
        wsService,
        currentVersion,
        previousWorkspaceVersion,
        maybeWsSettings: maybeWsSettings ?? undefined,
        dendronConfig,
      });
    }
    Logger.info({ ctx: `${ctx}:postMigration`, wsRoot });

    // show interactive elements,
    if (!opts?.skipInteractiveElements) {
      // check for duplicate config keys and prompt for a fix.
      StartupUtils.showDuplicateConfigEntryMessageIfNecessary({
        ext,
      });
    }

    // initialize vaults, clone remote vaults if needed
    const didClone = await wsService.initialize({
      onSyncVaultsProgress: () => {
        vscode.window.showInformationMessage(
          "found empty remote vaults that need initializing",
        );
      },
      onSyncVaultsEnd: () => {
        vscode.window.showInformationMessage(
          "finish initializing remote vaults. reloading workspace",
        );
        // TODO: remove
        setTimeout(VSCodeUtils.reloadWindow, 200);
      },
    });
    if (didClone) {
      return {
        error: ErrorFactory.createInvalidStateError({
          message: "could not initialize workspace",
        }),
      };
    }
    Logger.info({ ctx: `${ctx}:postWsServiceInitialize`, wsRoot });

    // check for vaults with duplicates
    const respNoDupVault = await checkNoDuplicateVaultNames(wsService.vaults);
    if (!respNoDupVault) {
      return {
        error: ErrorFactory.createInvalidStateError({
          message: "found duplicate vaults",
        }),
      };
    }

    // write new workspace version
    wsService.writeMeta({ version: DendronExtension.version() });

    // setup engine
    const port = await verifyOrStartServerProcess({ ext, wsService });
    Logger.info({ ctx: `${ctx}:verifyOrStartServerProcess`, port });
    const engine = updateEngineAPI(port, ext);
    Logger.info({ ctx: `${ctx}:exit` });

    return { data: { workspace, engine, wsService } };
  }

  /**
   * Initialize engine and activate workspace watchers
   */
  async activate({
    ext,
    context,
    wsService,
    wsRoot,
    opts,
    workspaceInitializer,
  }: WorkspaceActivatorOpts &
    WorkspaceActivatorSkipOpts & {
      engine: EngineAPIService;
      wsService: WorkspaceService;
    }): Promise<RespV3<boolean>> {
    const ctx = "WorkspaceActivator:activate";
    // setup services
    context.subscriptions.push(TextDocumentServiceFactory.create(ext));

    // Reload
    WSUtils.showActivateProgress();
    const start = process.hrtime();
    const reloadSuccess = await reloadWorkspace({ ext, wsService });
    const durationReloadWorkspace = getDurationMilliseconds(start);

    // NOTE: tracking is not awaited, don't block on this
    ExtensionUtils.trackWorkspaceInit({
      durationReloadWorkspace,
      activatedSuccess: !!reloadSuccess,
      ext,
    }).catch((error) => {
      Sentry.captureException(error);
    });

    analyzeWorkspace({ wsService });

    if (!reloadSuccess) {
      HistoryService.instance().add({
        source: "extension",
        action: "not_initialized",
      });
      return {
        error: ErrorFactory.createInvalidStateError({
          message: `issue with init`,
        }),
      };
    }

    ExtensionUtils.setWorkspaceContextOnActivate(wsService.config);
    MetadataService.instance().setDendronWorkspaceActivated();
    Logger.info({ ctx, msg: "fin startClient", durationReloadWorkspace });

    const stage = getStage();
    if (stage !== "test") {
      ext.activateWatchers();
      togglePluginActiveContext(true);
    }

    // Setup tree view (needs engine). Do not block activation return — schedule
    // immediately so UI can report active first (Sprint 1 lazy activation).
    if (!opts?.skipTreeView) {
      void initTreeView({ context }).catch((err) => {
        Logger.error({
          ctx,
          msg: "initTreeView failed",
          error: err as Error,
        });
      });
    }

    // Add the current workspace to the recent workspace list. The current
    // workspace is either the workspace file (Code Workspace) or the current
    // folder (Native Workspace)
    const workspace = DendronExtension.tryWorkspaceFile()?.fsPath || wsRoot;
    MetadataService.instance().addToRecentWorkspaces(workspace);

    // Workspace initializer (tutorial surveys etc.) — defer slightly so
    // first paint/keystroke isn't competing with toast work.
    const runInitializer = () => {
      if (workspaceInitializer?.onWorkspaceActivate) {
        workspaceInitializer.onWorkspaceActivate({
          skipOpts: opts,
        });
      } else {
        const initializer = WorkspaceInitFactory.create();
        if (initializer && initializer.onWorkspaceActivate) {
          initializer.onWorkspaceActivate({
            skipOpts: opts,
          });
        }
      }
    };
    if (getStage() === "test") {
      runInitializer();
    } else {
      setTimeout(runInitializer, 0);
    }
    return { data: true };
  }

  async initCodeWorkspace({ context, wsRoot }: WorkspaceActivatorOpts) {
    const assetUri = VSCodeUtils.getAssetUri(context);
    const ws = new DendronCodeWorkspace({
      wsRoot,
      logUri: context.logUri,
      assetUri,
    });
    return ws;
  }

  async initNativeWorkspace({ context, wsRoot }: WorkspaceActivatorOpts) {
    const assetUri = VSCodeUtils.getAssetUri(context);
    const ws = new DendronNativeWorkspace({
      wsRoot,
      logUri: context.logUri,
      assetUri,
    });
    return ws;
  }

  async getOrPromptWsRoot({
    ext,
  }: WorkspaceActivatorValidateOpts): Promise<string | undefined> {
    if (ext.type === WorkspaceType.NATIVE) {
      const workspaceFolders =
        await WorkspaceUtils.findWSRootsInWorkspaceFolders(
          DendronExtension.workspaceFolders()!,
        );
      if (!workspaceFolders) {
        return;
      }
      const resp = await getOrPromptWSRoot(workspaceFolders);
      if (!_.isString(resp)) {
        return;
      }
      return resp;
    } else {
      return path.dirname(DendronExtension.workspaceFile().fsPath);
    }
  }
}
