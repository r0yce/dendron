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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebExtContainer = setupWebExtContainer;
const common_all_1 = require("@dendronhq/common-all");
const inject_1 = require("../../di/inject");
const vscode = __importStar(require("vscode"));
const vscode_1 = require("vscode");
const TextDocumentService_1 = require("../../services/web/TextDocumentService");
const DummyTelemetryClient_1 = require("../../telemetry/common/DummyTelemetryClient");
const WebTelemetryClient_1 = require("../../telemetry/web/WebTelemetryClient");
const TreeViewDummyConfig_1 = require("../../views/common/treeview/TreeViewDummyConfig");
const NoteLookupProvider_1 = require("../commands/lookup/NoteLookupProvider");
const DendronEngineV3Web_1 = require("../engine/DendronEngineV3Web");
const PluginNoteRenderer_1 = require("../engine/PluginNoteRenderer");
const VSCodeFileStore_1 = require("../engine/store/VSCodeFileStore");
const ConsoleLogger_1 = require("../utils/ConsoleLogger");
const IPreviewPanelConfig_1 = require("../views/preview/IPreviewPanelConfig");
const PreviewLinkHandler_1 = require("../views/preview/PreviewLinkHandler");
const PreviewPanel_1 = require("../views/preview/PreviewPanel");
const getAssetsPrefix_1 = require("./getAssetsPrefix");
const getEnablePrettlyLinks_1 = require("./getEnablePrettlyLinks");
const getSiteIndex_1 = require("./getSiteIndex");
const getSiteUrl_1 = require("./getSiteUrl");
const getVaults_1 = require("./getVaults");
const getWorkspaceConfig_1 = require("./getWorkspaceConfig");
const getWSRoot_1 = require("./getWSRoot");
/**
 * This function prepares a TSyringe container suitable for the Web Extension
 * flavor of the Dendron Plugin.
 *
 * It uses a VSCodeFileStore and includes a reduced engine that runs in-memory.
 */
async function setupWebExtContainer(context) {
    const wsRoot = await (0, getWSRoot_1.getWSRoot)();
    if (!wsRoot) {
        throw new Error("Unable to find wsRoot!");
    }
    const vaults = await (0, getVaults_1.getVaults)(wsRoot);
    const assetsPrefix = await (0, getAssetsPrefix_1.getAssetsPrefix)(wsRoot);
    const enablePrettyLinks = await (0, getEnablePrettlyLinks_1.getEnablePrettlyLinks)(wsRoot);
    const siteUrl = await (0, getSiteUrl_1.getSiteUrl)(wsRoot);
    const siteIndex = await (0, getSiteIndex_1.getSiteIndex)(wsRoot);
    inject_1.container.register(inject_1.TOKENS.ExtensionContext, {
        useValue: context,
    });
    // The EngineEventEmitter is also DendronEngineV3Web, so reuse the same token
    // to supply any emitter consumers. This ensures the same engine singleton
    // gets used everywhere.
    inject_1.container.register(inject_1.TOKENS.EngineEventEmitter, {
        useToken: inject_1.TOKENS.ReducedDEngine,
    });
    inject_1.container.register(inject_1.TOKENS.ReducedDEngine, {
        useClass: DendronEngineV3Web_1.DendronEngineV3Web,
    }, { lifecycle: inject_1.Lifecycle.Singleton });
    inject_1.container.register(inject_1.TOKENS.IFileStore, {
        useClass: VSCodeFileStore_1.VSCodeFileStore,
    });
    inject_1.container.register(inject_1.TOKENS.IDataStore, {
        useClass: common_all_1.NoteMetadataStore,
    }, { lifecycle: inject_1.Lifecycle.Singleton });
    inject_1.container.register(inject_1.TOKENS.WsRoot, { useValue: wsRoot });
    inject_1.container.register(inject_1.TOKENS.Vaults, { useValue: vaults });
    inject_1.container.register(inject_1.TOKENS.AssetsPrefix, { useValue: assetsPrefix });
    inject_1.container.register(inject_1.TOKENS.EnablePrettyLinks, { useValue: enablePrettyLinks });
    inject_1.container.register(inject_1.TOKENS.SiteUrl, { useValue: siteUrl });
    inject_1.container.register(inject_1.TOKENS.SiteIndex, { useValue: siteIndex });
    inject_1.container.register(inject_1.TOKENS.INoteStore, {
        useFactory: (container) => {
            const fs = container.resolve(inject_1.TOKENS.IFileStore);
            const ds = container.resolve(inject_1.TOKENS.IDataStore);
            return new common_all_1.NoteStore(fs, ds, wsRoot);
        },
    });
    inject_1.container.register(inject_1.TOKENS.NoteProvider, {
        useClass: NoteLookupProvider_1.NoteLookupProvider,
    });
    inject_1.container.afterResolution(inject_1.TOKENS.ReducedDEngine, (_t, result) => {
        if ("init" in result) {
            result.init().then(() => { }, (reason) => {
                throw new Error(`Dendron Engine Failed to Initialize: ${reason}`);
            });
        }
    }, { frequency: "Once" });
    inject_1.container.register(inject_1.TOKENS.ITreeViewConfig, {
        useClass: TreeViewDummyConfig_1.TreeViewDummyConfig,
    });
    setupTelemetry();
    inject_1.container.register(inject_1.TOKENS.PreviewProxy, {
        useClass: PreviewPanel_1.PreviewPanel,
    });
    inject_1.container.register(inject_1.TOKENS.ExtensionUri, {
        useValue: context.extensionUri,
    });
    inject_1.container.register(inject_1.TOKENS.IPreviewLinkHandler, {
        useClass: PreviewLinkHandler_1.PreviewLinkHandler,
    });
    inject_1.container.register(inject_1.TOKENS.IPreviewPanelConfig, {
        useClass: IPreviewPanelConfig_1.DummyPreviewPanelConfig, // TODO: Add a real one
    });
    inject_1.container.register(inject_1.TOKENS.ITextDocumentService, {
        useClass: TextDocumentService_1.TextDocumentService,
    });
    inject_1.container.register(inject_1.TOKENS.TextDocumentEvent, {
        useValue: vscode_1.workspace.onDidSaveTextDocument,
    });
    inject_1.container.register(inject_1.TOKENS.Logger, {
        useClass: ConsoleLogger_1.ConsoleLogger,
    });
    // Just use a dummy number - this isn't actually used by the web logic, but
    // it's a dependency in some util methods.
    inject_1.container.register(inject_1.TOKENS.Port, {
        useValue: 1,
    });
    inject_1.container.register(inject_1.TOKENS.INoteRenderer, {
        useClass: PluginNoteRenderer_1.PluginNoteRenderer,
    });
    const config = await (0, getWorkspaceConfig_1.getWorkspaceConfig)(wsRoot);
    inject_1.container.register(inject_1.TOKENS.DendronConfig, {
        useValue: config,
    });
    setupTabAutoComplete(context);
}
function setupTelemetry() {
    const stage = (0, common_all_1.getStage)();
    switch (stage) {
        case "prod": {
            inject_1.container.register(inject_1.TOKENS.ITelemetryClient, {
                useClass: WebTelemetryClient_1.WebTelemetryClient,
            });
            break;
        }
        default: {
            inject_1.container.register(inject_1.TOKENS.ITelemetryClient, {
                useClass: DummyTelemetryClient_1.DummyTelemetryClient,
            });
            break;
        }
    }
}
function setupTabAutoComplete(context) {
    const emitter = new vscode.EventEmitter();
    // Add to extension disposables for auto-cleanup:
    context.subscriptions.push(emitter);
    (0, inject_1.registerInstance)(inject_1.TOKENS.AutoCompleteEventEmitter, emitter);
    (0, inject_1.registerInstance)(inject_1.TOKENS.AutoCompleteEvent, emitter.event);
}
//# sourceMappingURL=setupWebExtContainer.js.map