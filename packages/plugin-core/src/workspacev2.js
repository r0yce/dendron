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
exports.DWorkspace = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode_1 = __importStar(require("vscode"));
class DWorkspace {
    wsRoot;
    vaults;
    _engine;
    port;
    onReady;
    serverPortWatcher;
    static _WS;
    static getOrCreate(opts) {
        let justInitialized = false;
        if (!this._WS || opts?.force) {
            this._WS = new DWorkspace();
            justInitialized = true;
        }
        return { justInitialized, ws: this._WS };
    }
    static workspaceFile = vscode_1.default.workspace.workspaceFile;
    static workspaceFolders = vscode_1.default.workspace.workspaceFolders;
    constructor() {
        const wsFile = DWorkspace.workspaceFile?.fsPath;
        if (lodash_1.default.isUndefined(wsFile)) {
            throw Error("wsFile is undefined");
        }
        const vaults = DWorkspace.workspaceFolders;
        if (lodash_1.default.isUndefined(vaults)) {
            throw Error("vaults is undefined");
        }
        this.wsRoot = path_1.default.dirname(wsFile);
        this.vaults = vaults.map((ent) => ({
            fsPath: ent.uri.fsPath,
        }));
    }
    async init(opts) {
        // init engine
        this.onReady = opts?.onReady ?? undefined /* TODO: exactOptional for optional method field assignment; final strict batch pattern */;
        return this.createServerWatcher({ numRetries: opts?.numRetries ?? undefined });
    }
    async initEngine({ port }) {
        const { wsRoot, vaults } = this;
        const dendronEngine = engine_server_1.DendronEngineClient.create({
            port,
            ws: wsRoot,
            vaults,
        });
        await dendronEngine.sync();
        this._engine = dendronEngine;
        return dendronEngine;
    }
    get engine() {
        if (!this._engine) {
            throw Error("engine not set");
        }
        return this._engine;
    }
    async createServerWatcher(opts) {
        const { wsRoot } = this;
        const fpath = engine_server_1.EngineUtils.getPortFilePathForWorkspace({ wsRoot });
        const { watcher } = await (0, common_server_1.createFileWatcher)({
            fpath,
            numTries: opts?.numRetries ?? undefined /* TODO: exactOptional boundary to common-server CreateFileWatcherOpts (strict green in common-*); Batch 5+ widen target first not possible across pkg boundary; see Monorepo 4-axis + di-container ergonomics */,
            onChange: async ({ fpath }) => {
                const port = (0, engine_server_1.openPortFile)({ fpath });
                this.onChangePort({ port });
            },
            onCreate: async ({ fpath }) => {
                const port = (0, engine_server_1.openPortFile)({ fpath });
                this.onChangePort({ port });
            },
        });
        const now = common_all_1.Time.now();
        setTimeout(async () => {
            // in case file was created before watcher was put on
            if (fs_extra_1.default.existsSync(fpath) &&
                now.toMillis() -
                    common_all_1.Time.DateTime.fromJSDate(fs_extra_1.default.statSync(fpath).ctime).toMillis() <
                    10e3) {
                const fpath = engine_server_1.EngineUtils.getPortFilePathForWorkspace({ wsRoot });
                const port = (0, engine_server_1.openPortFile)({ fpath });
                this.onChangePort({ port });
            }
        }, 1000);
        this.serverPortWatcher = watcher;
    }
    async onChangePort({ port }) {
        const portPrev = this.port;
        if (this.port !== port) {
            vscode_1.window.showInformationMessage(`port updated: ${port}`);
            this.port = port;
            await this.initEngine({ port });
        }
        if (lodash_1.default.isUndefined(portPrev) && this.onReady) {
            this.onReady({ ws: this });
        }
    }
}
exports.DWorkspace = DWorkspace;
//# sourceMappingURL=workspacev2.js.map