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
exports.handleConflict = exports.withProgressOpts = exports.getSelectionFromQuickpick = exports.openFileInEditor = exports.getGlobalState = exports.updateGlobalState = exports.showInputBox = exports.showDocumentQuickPick = exports.launchGoogleOAuthFlow = exports.showPodQuickPickItemsV4 = void 0;
const common_all_1 = require("@dendronhq/common-all");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const open_1 = __importDefault(require("open"));
const path_1 = __importDefault(require("path"));
const queryString = __importStar(require("query-string"));
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const stateService_1 = require("../services/stateService");
const global_1 = require("../types/global");
const utils_1 = require("../utils");
const vsCodeUtils_1 = require("../vsCodeUtils");
const showPodQuickPickItemsV4 = (podItem) => {
    const pickItems = podItem.map((podItem) => {
        return {
            label: podItem.id,
            ...podItem,
        };
    });
    return vscode_1.window.showQuickPick(pickItems, {
        placeHolder: "Choose a Pod",
        ignoreFocusOut: false,
        matchOnDescription: true,
        canPickMany: false,
    });
};
exports.showPodQuickPickItemsV4 = showPodQuickPickItemsV4;
const launchGoogleOAuthFlow = async (id) => {
    const port = fs_extra_1.default.readFileSync(path_1.default.join(ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot, ".dendron.port"), {
        encoding: "utf8",
    });
    const stringifiedParams = queryString.stringify({
        client_id: global_1.GOOGLE_OAUTH_ID,
        redirect_uri: `http://localhost:${port}/api/oauth/getToken?service=google&connectionId=${id}`,
        scope: constants_1.gdocRequiredScopes.join(" "), // space seperated string
        response_type: "code",
        access_type: "offline",
        prompt: "consent",
    });
    const link = `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`;
    await (0, open_1.default)(link);
    utils_1.clipboard.writeText(link);
};
exports.launchGoogleOAuthFlow = launchGoogleOAuthFlow;
const showDocumentQuickPick = async (docs) => {
    /** Least Recently Used Documents */
    let MRUDocs = await stateService_1.StateService.instance().getMRUGoogleDocs();
    MRUDocs = lodash_1.default.isUndefined(MRUDocs) ? [] : MRUDocs;
    docs = docs.filter((doc) => !MRUDocs?.includes(doc));
    const pickItems = MRUDocs.concat(docs).map((doc) => {
        return {
            label: doc,
        };
    });
    return vscode_1.window.showQuickPick(pickItems, {
        placeHolder: "Choose a document",
        ignoreFocusOut: false,
        matchOnDescription: true,
        canPickMany: false,
    });
};
exports.showDocumentQuickPick = showDocumentQuickPick;
const showInputBox = async (options, title) => {
    const value = await vscode_1.window.showInputBox({
        ...options,
        value: title,
    });
    return value;
};
exports.showInputBox = showInputBox;
const updateGlobalState = async (opts) => {
    const { key, value } = opts;
    stateService_1.StateService.instance().updateGlobalState(key, value);
    /** to update the Most Recently Used Doc list with most recent doc at first */
    let MRUDocs = await stateService_1.StateService.instance().getMRUGoogleDocs();
    MRUDocs = lodash_1.default.isUndefined(MRUDocs)
        ? []
        : [key, ...MRUDocs.filter((doc) => doc !== key)];
    stateService_1.StateService.instance().updateMRUGoogleDocs(MRUDocs);
};
exports.updateGlobalState = updateGlobalState;
const getGlobalState = async (key) => {
    return stateService_1.StateService.instance().getGlobalState(key);
};
exports.getGlobalState = getGlobalState;
const openFileInEditor = async (note) => {
    const npath = common_all_1.NoteUtils.getFullPath({
        note,
        wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
    });
    const uri = vscode_1.Uri.file(npath);
    await vsCodeUtils_1.VSCodeUtils.openFileInEditor(uri);
};
exports.openFileInEditor = openFileInEditor;
const getSelectionFromQuickpick = async (pagesMap) => {
    const pickItems = pagesMap.map((page) => {
        return {
            label: page,
        };
    });
    const selected = await vscode_1.window.showQuickPick(pickItems, {
        placeHolder: "Choose the Parent Page",
        ignoreFocusOut: false,
        matchOnDescription: true,
        canPickMany: false,
    });
    if (!selected) {
        return;
    }
    return selected.label;
};
exports.getSelectionFromQuickpick = getSelectionFromQuickpick;
exports.withProgressOpts = {
    withProgress: vscode_1.window.withProgress,
    location: vscode_1.ProgressLocation.Notification,
    showMessage: vscode_1.window.showInformationMessage,
};
const handleConflict = async (conflict, conflictResolveOpts) => {
    const choices = conflictResolveOpts.options();
    return vscode_1.window.showQuickPick(choices, {
        title: conflictResolveOpts.message(conflict),
        placeHolder: "What would you like to do?",
        ignoreFocusOut: false,
        matchOnDescription: true,
        canPickMany: false,
    });
};
exports.handleConflict = handleConflict;
//# sourceMappingURL=pods.js.map