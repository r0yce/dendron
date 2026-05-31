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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stubWorkspace = exports.stubWorkspaceFolders = exports.stubWorkspaceFile = exports.LocationTestUtils = exports.getNoteFromTextEditor = void 0;
exports.genEmptyWSFiles = genEmptyWSFiles;
exports.genDefaultSettings = genDefaultSettings;
exports.setupCodeConfiguration = setupCodeConfiguration;
exports.resetCodeWorkspace = resetCodeWorkspace;
exports.cleanupVSCodeContextSubscriptions = cleanupVSCodeContextSubscriptions;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const workspace_1 = require("../workspace");
const testUtils_1 = require("./testUtils");
const ExtensionProvider_1 = require("../ExtensionProvider");
function genEmptyWSFiles() {
    return [".vscode", "root.md", "root.schema.yml"];
}
function genDefaultSettings() {
    return {
        extensions: {
            recommendations: [
                "dendron.dendron",
                "dendron.dendron-paste-image",
                "dendron.dendron-markdown-shortcuts",
                "redhat.vscode-yaml",
            ],
            unwantedRecommendations: [
                "dendron.dendron-markdown-links",
                "dendron.dendron-markdown-notes",
                "dendron.dendron-markdown-preview-enhanced",
                "shd101wyy.markdown-preview-enhanced",
                "kortina.vscode-markdown-notes",
                "mushan.vscode-paste-image",
            ],
        },
        folders: [
            {
                path: "vault",
            },
        ],
        settings: {
            "dendron.rootDir": ".",
            "editor.snippetSuggestions": "inline",
            "editor.suggest.showSnippets": true,
            "editor.suggest.snippetsPreventQuickSuggestions": false,
            "editor.tabCompletion": "on",
            "files.autoSave": "onFocusChange",
            "markdown-preview-enhanced.enableWikiLinkSyntax": true,
            "markdown-preview-enhanced.wikiLinkFileExtension": ".md",
            "pasteImage.path": "${currentFileDir}/assets/images", // eslint-disable-line no-template-curly-in-string
            "pasteImage.prefix": "/",
        },
    };
}
/**
 * Setup DendronExtension config options
 * @param opts
 */
function setupCodeConfiguration(opts) {
    const copts = lodash_1.default.defaults(opts, {
        configOverride: {},
    });
    workspace_1.DendronExtension.configuration = () => {
        const config = {
            dendron: {
                rootDir: ".",
            },
        };
        lodash_1.default.forEach(constants_1.CONFIG, (ent) => {
            if (ent.default) {
                lodash_1.default.set(config, ent.key, ent.default);
            }
        });
        lodash_1.default.forEach(copts.configOverride, (v, k) => {
            lodash_1.default.set(config, k, v);
        });
        return (0, testUtils_1.createMockConfig)(config);
    };
}
async function resetCodeWorkspace() {
    // @ts-ignore
    workspace_1.DendronExtension.workspaceFile = () => {
        return undefined;
    };
    // @ts-ignore
    workspace_1.DendronExtension.workspaceFolders = () => {
        return undefined;
    };
    if (fs_extra_1.default.pathExistsSync(engine_server_1.MetadataService.metaFilePath())) {
        fs_extra_1.default.removeSync(engine_server_1.MetadataService.metaFilePath());
    }
}
const getNoteFromTextEditor = () => {
    const txtPath = vscode_1.window.activeTextEditor?.document.uri.fsPath;
    const vault = { fsPath: path_1.default.dirname(txtPath) };
    const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
    const fullPath = common_all_1.DNodeUtils.getFullPath({
        wsRoot,
        vault,
        basename: path_1.default.basename(txtPath),
    });
    const resp = (0, common_server_1.file2Note)(fullPath, vault);
    if (common_all_1.ErrorUtils.isErrorResp(resp)) {
        throw resp.error;
    }
    return resp.data;
};
exports.getNoteFromTextEditor = getNoteFromTextEditor;
class LocationTestUtils {
    /**
     * get default wiki link position
     */
    static getPresetWikiLinkPosition = (opts) => new vscode_1.Position(opts?.line || 7, opts?.char || 2);
    static getPresetWikiLinkSelection = (opts) => new vscode_1.Selection(LocationTestUtils.getPresetWikiLinkPosition(opts), LocationTestUtils.getPresetWikiLinkPosition(opts));
    static getBasenameFromLocation = (loc) => path_1.default.basename(loc.uri.fsPath);
}
exports.LocationTestUtils = LocationTestUtils;
const stubWorkspaceFile = (wsRoot) => {
    const wsPath = path_1.default.join(wsRoot, "dendron.code-workspace");
    fs_extra_1.default.writeJSONSync(wsPath, {});
    sinon_1.default.stub(vscode_1.workspace, "workspaceFile").value(vscode_1.Uri.file(wsPath));
    workspace_1.DendronExtension.workspaceFile = () => {
        return vscode_1.Uri.file(wsPath);
    };
};
exports.stubWorkspaceFile = stubWorkspaceFile;
const stubWorkspaceFolders = (wsRoot, vaults) => {
    const folders = vaults
        .map((v) => ({
        name: common_all_1.VaultUtils.getName(v),
        index: 1,
        uri: vscode_1.Uri.file(path_1.default.join(wsRoot, common_all_1.VaultUtils.getRelPath(v))),
    }))
        .concat([
        {
            name: "root",
            index: 0,
            uri: vscode_1.Uri.parse(wsRoot),
        },
    ]);
    sinon_1.default.stub(vscode_1.workspace, "workspaceFolders").value(folders);
    workspace_1.DendronExtension.workspaceFolders = () => folders;
};
exports.stubWorkspaceFolders = stubWorkspaceFolders;
const stubWorkspace = ({ wsRoot, vaults }) => {
    (0, exports.stubWorkspaceFile)(wsRoot);
    (0, exports.stubWorkspaceFolders)(wsRoot, vaults);
};
exports.stubWorkspace = stubWorkspace;
/**
 *  Releases all registered VS Code Extension resouces such as commands and
 *  providers
 * @param ctx
 */
function cleanupVSCodeContextSubscriptions(ctx) {
    ctx.subscriptions.forEach((disposable) => {
        disposable?.dispose();
    });
}
__exportStar(require("./expect"), exports);
//# sourceMappingURL=testUtilsv2.js.map