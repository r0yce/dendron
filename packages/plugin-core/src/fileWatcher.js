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
exports.PluginFileWatcher = exports.FileWatcher = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const ExtensionProvider_1 = require("./ExtensionProvider");
const logger_1 = require("./logger");
const analytics_1 = require("./utils/analytics");
class FileWatcher {
    watchers;
    /**
     * Should watching be paused
     */
    pause;
    L = logger_1.Logger;
    constructor(opts) {
        const { workspaceOpts } = opts;
        const { vaults, wsRoot } = workspaceOpts;
        this.watchers = vaults.map((vault) => {
            const vpath = path_1.default.join(wsRoot, common_all_1.VaultUtils.normVaultPath({ vault, wsRoot }));
            const rootFolder = vpath;
            const pattern = new vscode.RelativePattern(rootFolder, "*.md");
            let watcher;
            // For VSCode workspaces, or if forced in the config, use the VSCode watcher
            if (FileWatcher.watcherType(workspaceOpts) === "plugin") {
                watcher = new PluginFileWatcher(pattern);
            }
            else {
                watcher = new engine_server_1.EngineFileWatcher(pattern.base, pattern.pattern);
            }
            return { vault, watcher };
        });
        this.pause = false;
    }
    static watcherType(opts) {
        const forceWatcherType = opts.dendronConfig?.dev?.forceWatcherType;
        // If a certain type of watcher has been forced, try to use that
        if (forceWatcherType !== undefined)
            return forceWatcherType;
        const wsType = ExtensionProvider_1.ExtensionProvider.getDWorkspace().type;
        // For VSCode workspaces, use the built-in VSCode watcher
        if (wsType === common_all_1.WorkspaceType.CODE)
            return "plugin";
        // Otherwise, use the engine watcher that works without VSCode
        return "engine";
    }
    activate(context) {
        this.watchers.forEach(({ watcher }) => {
            context.subscriptions.push(watcher.onDidCreate((0, analytics_1.sentryReportingCallback)(this.onDidCreate.bind(this))));
            context.subscriptions.push(watcher.onDidDelete((0, analytics_1.sentryReportingCallback)(this.onDidDelete.bind(this))));
        });
    }
    async onDidCreate(fsPath) {
        const ctx = "FileWatcher:onDidCreate";
        if (this.pause) {
            this.L.info({ ctx, fsPath, msg: "paused" });
            return;
        }
        this.L.info({ ctx, fsPath });
        const fname = path_1.default.basename(fsPath, ".md");
        // check if ignore
        const recentEvents = engine_server_1.HistoryService.instance().lookBack();
        this.L.debug({ ctx, recentEvents, fname });
        let note;
        if (lodash_1.default.find(recentEvents, (event) => {
            return lodash_1.default.every([
                event?.uri?.fsPath === fsPath,
                event.source === "engine",
                event.action === "create",
            ]);
        })) {
            this.L.debug({ ctx, fsPath, msg: "create by engine, ignoring" });
            return;
        }
        try {
            this.L.debug({ ctx, fsPath, msg: "pre-add-to-engine" });
            const { vaults, engine, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vault = common_all_1.VaultUtils.getVaultByFilePath({
                vaults,
                fsPath,
                wsRoot,
            });
            const resp = (0, common_server_1.file2Note)(fsPath, vault);
            if (common_all_1.ErrorUtils.isErrorResp(resp)) {
                throw resp.error;
            }
            note = resp.data;
            // check if note exist as
            const maybeNote = (await engine.findNotesMeta({ fname, vault }))[0];
            if (maybeNote) {
                note = common_all_1.NoteUtils.hydrate({ noteRaw: note, noteHydrated: maybeNote });
                delete note["stub"];
                delete note["schemaStub"];
                //TODO recognise vscode's create new file menu option to create a note.
            }
            await engine_server_1.EngineUtils.refreshNoteLinksAndAnchors({
                note,
                fmChangeOnly: false,
                engine,
                config: common_server_1.DConfig.readConfigSync(engine.wsRoot),
            });
            await engine.writeNote(note, { metaOnly: true });
        }
        catch (err) {
            this.L.error({ ctx, error: err });
            throw err;
        }
    }
    async onDidDelete(fsPath) {
        const ctx = "FileWatcher:onDidDelete";
        if (this.pause) {
            return;
        }
        this.L.info({ ctx, fsPath });
        const fname = path_1.default.basename(fsPath, ".md");
        // check if we should ignore
        const recentEvents = engine_server_1.HistoryService.instance().lookBack(5);
        this.L.debug({ ctx, recentEvents, fname });
        if (lodash_1.default.find(recentEvents, (event) => {
            return lodash_1.default.every([
                event?.uri?.fsPath === fsPath,
                event.source === "engine",
                lodash_1.default.includes(["delete", "rename"], event.action),
            ]);
        })) {
            this.L.debug({
                ctx,
                fsPath,
                msg: "recent action by engine, ignoring",
            });
            return;
        }
        try {
            const { vaults, engine, wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
            const vault = common_all_1.VaultUtils.getVaultByFilePath({
                vaults,
                fsPath,
                wsRoot,
            });
            this.L.debug({ ctx, fsPath, msg: "preparing to delete" });
            const nodeToDelete = (await engine.findNotesMeta({ fname, vault }))[0];
            if (lodash_1.default.isUndefined(nodeToDelete)) {
                throw new Error(`${fname} not found`);
            }
            await engine.deleteNote(nodeToDelete.id, { metaOnly: true });
            engine_server_1.HistoryService.instance().add({
                action: "delete",
                source: "watcher",
                uri: vscode.Uri.parse(fsPath),
            });
            analytics_1.AnalyticsUtils.track(common_all_1.ContextualUIEvents.ContextualUIDelete);
        }
        catch (err) {
            this.L.info({ ctx, fsPath, err });
            // NOTE: ignore, many legitimate reasons why this might happen
            // this.L.error({ ctx, err: JSON.stringify(err) });
        }
    }
}
exports.FileWatcher = FileWatcher;
class PluginFileWatcher {
    watcher;
    constructor(pattern) {
        this.watcher = vscode.workspace.createFileSystemWatcher(pattern, false, false, false);
    }
    onDidCreate(callback) {
        return this.watcher.onDidCreate((uri) => callback(uri.fsPath));
    }
    onDidDelete(callback) {
        return this.watcher.onDidDelete((uri) => callback(uri.fsPath));
    }
    onDidChange(callback) {
        return this.watcher.onDidChange((uri) => callback(uri.fsPath));
    }
}
exports.PluginFileWatcher = PluginFileWatcher;
//# sourceMappingURL=fileWatcher.js.map