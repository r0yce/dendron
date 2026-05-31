import {
  DLogger,
  EngineEventEmitter,
  getStage,
  IDataStore,
  IFileStore,
  INoteStore,
  DendronConfig,
  NoteMetadataStore,
  NotePropsMeta,
  NoteStore,
  type ReducedDEngine,
} from "@dendronhq/common-all";
import { container, Lifecycle, TOKENS, registerInstance } from "../../di/inject";
import * as vscode from "vscode";
import { Event, EventEmitter, TextDocument, workspace } from "vscode";
import { URI } from "vscode-uri";
import { IPreviewLinkHandler } from "../../components/views/IPreviewLinkHandler";
import { PreviewProxy } from "../../components/views/PreviewProxy";
import { ITextDocumentService } from "../../services/ITextDocumentService";
import { TextDocumentService } from "../../services/web/TextDocumentService";
import { DummyTelemetryClient } from "../../telemetry/common/DummyTelemetryClient";
import { ITelemetryClient } from "../../telemetry/common/ITelemetryClient";
import { WebTelemetryClient } from "../../telemetry/web/WebTelemetryClient";
import { ITreeViewConfig } from "../../views/common/treeview/ITreeViewConfig";
import { TreeViewDummyConfig } from "../../views/common/treeview/TreeViewDummyConfig";
import { ILookupProvider } from "../commands/lookup/ILookupProvider";
import { NoteLookupProvider } from "../commands/lookup/NoteLookupProvider";
import { DendronEngineV3Web } from "../engine/DendronEngineV3Web";
import { INoteRenderer } from "../engine/INoteRenderer";
import { PluginNoteRenderer } from "../engine/PluginNoteRenderer";
import { VSCodeFileStore } from "../engine/store/VSCodeFileStore";
import { ConsoleLogger } from "../utils/ConsoleLogger";
import {
  DummyPreviewPanelConfig,
  IPreviewPanelConfig,
} from "../views/preview/IPreviewPanelConfig";
import { PreviewLinkHandler } from "../views/preview/PreviewLinkHandler";
import { PreviewPanel } from "../views/preview/PreviewPanel";
import { getAssetsPrefix } from "./getAssetsPrefix";
import { getEnablePrettlyLinks } from "./getEnablePrettlyLinks";
import { getSiteIndex } from "./getSiteIndex";
import { getSiteUrl } from "./getSiteUrl";
import { getVaults } from "./getVaults";
import { getWorkspaceConfig } from "./getWorkspaceConfig";
import { getWSRoot } from "./getWSRoot";

/**
 * This function prepares a TSyringe container suitable for the Web Extension
 * flavor of the Dendron Plugin.
 *
 * It uses a VSCodeFileStore and includes a reduced engine that runs in-memory.
 */
export async function setupWebExtContainer(context: vscode.ExtensionContext) {
  const wsRoot = await getWSRoot();

  if (!wsRoot) {
    throw new Error("Unable to find wsRoot!");
  }
  const vaults = await getVaults(wsRoot);
  const assetsPrefix = await getAssetsPrefix(wsRoot);
  const enablePrettyLinks = await getEnablePrettlyLinks(wsRoot);
  const siteUrl = await getSiteUrl(wsRoot);
  const siteIndex = await getSiteIndex(wsRoot);

  container.register<vscode.ExtensionContext>(TOKENS.ExtensionContext, {
    useValue: context,
  });

  // The EngineEventEmitter is also DendronEngineV3Web, so reuse the same token
  // to supply any emitter consumers. This ensures the same engine singleton
  // gets used everywhere.
  container.register<EngineEventEmitter>(TOKENS.EngineEventEmitter, {
    useToken: TOKENS.ReducedDEngine,
  });

  container.register<ReducedDEngine>(
    TOKENS.ReducedDEngine,
    {
      useClass: DendronEngineV3Web,
    },
    { lifecycle: Lifecycle.Singleton }
  );

  container.register<IFileStore>(TOKENS.IFileStore, {
    useClass: VSCodeFileStore,
  });

  container.register<IDataStore<string, NotePropsMeta>>(
    TOKENS.IDataStore,
    {
      useClass: NoteMetadataStore,
    },
    { lifecycle: Lifecycle.Singleton }
  );

  container.register(TOKENS.WsRoot, { useValue: wsRoot });
  container.register(TOKENS.Vaults, { useValue: vaults });
  container.register(TOKENS.AssetsPrefix, { useValue: assetsPrefix });
  container.register(TOKENS.EnablePrettyLinks, { useValue: enablePrettyLinks });
  container.register(TOKENS.SiteUrl, { useValue: siteUrl });
  container.register(TOKENS.SiteIndex, { useValue: siteIndex });

  container.register<INoteStore<string>>(TOKENS.INoteStore, {
    useFactory: (container) => {
      const fs = container.resolve<IFileStore>(TOKENS.IFileStore);
      const ds =
        container.resolve<IDataStore<string, NotePropsMeta>>(TOKENS.IDataStore);

      return new NoteStore(fs, ds, wsRoot);
    },
  });

  container.register<ILookupProvider>(TOKENS.NoteProvider, {
    useClass: NoteLookupProvider,
  });

  container.afterResolution<DendronEngineV3Web>(
    TOKENS.ReducedDEngine,
    (_t, result) => {
      if ("init" in result) {
        result.init().then(
          () => {},
          (reason) => {
            throw new Error(`Dendron Engine Failed to Initialize: ${reason}`);
          }
        );
      }
    },
    { frequency: "Once" }
  );

  container.register<ITreeViewConfig>(TOKENS.ITreeViewConfig, {
    useClass: TreeViewDummyConfig,
  });

  setupTelemetry();

  container.register<PreviewProxy>(TOKENS.PreviewProxy, {
    useClass: PreviewPanel,
  });

  container.register<URI>(TOKENS.ExtensionUri, {
    useValue: context.extensionUri,
  });

  container.register<IPreviewLinkHandler>(TOKENS.IPreviewLinkHandler, {
    useClass: PreviewLinkHandler,
  });

  container.register<IPreviewPanelConfig>(TOKENS.IPreviewPanelConfig, {
    useClass: DummyPreviewPanelConfig, // TODO: Add a real one
  });

  container.register<ITextDocumentService>(TOKENS.ITextDocumentService, {
    useClass: TextDocumentService,
  });

  container.register<Event<TextDocument>>(TOKENS.TextDocumentEvent, {
    useValue: workspace.onDidSaveTextDocument,
  });

  container.register<DLogger>(TOKENS.Logger, {
    useClass: ConsoleLogger,
  });

  // Just use a dummy number - this isn't actually used by the web logic, but
  // it's a dependency in some util methods.
  container.register<number>(TOKENS.Port, {
    useValue: 1,
  });

  container.register<INoteRenderer>(TOKENS.INoteRenderer, {
    useClass: PluginNoteRenderer,
  });

  const config = await getWorkspaceConfig(wsRoot);
  container.register<DendronConfig>(TOKENS.DendronConfig, {
    useValue: config as DendronConfig,
  });

  setupTabAutoComplete(context);
}

function setupTelemetry() {
  const stage = getStage();

  switch (stage) {
    case "prod": {
      container.register<ITelemetryClient>(TOKENS.ITelemetryClient, {
        useClass: WebTelemetryClient,
      });
      break;
    }
    default: {
      container.register<ITelemetryClient>(TOKENS.ITelemetryClient, {
        useClass: DummyTelemetryClient,
      });
      break;
    }
  }
}

function setupTabAutoComplete(context: vscode.ExtensionContext) {
  const emitter = new vscode.EventEmitter<void>();

  // Add to extension disposables for auto-cleanup:
  context.subscriptions.push(emitter);

  registerInstance<EventEmitter<void>>(
    TOKENS.AutoCompleteEventEmitter,
    emitter
  );

  registerInstance<Event<void>>(TOKENS.AutoCompleteEvent, emitter.event);
}
