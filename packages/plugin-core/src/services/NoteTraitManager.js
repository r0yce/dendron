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
exports.NoteTraitManager = void 0;
const common_all_1 = require("@dendronhq/common-all");
const path_1 = __importDefault(require("path"));
const ExtensionProvider_1 = require("../ExtensionProvider");
const UserDefinedTraitV1_1 = require("../traits/UserDefinedTraitV1");
const fs_extra_1 = __importDefault(require("fs-extra"));
const logger_1 = require("../logger");
const vscode = __importStar(require("vscode"));
const analytics_1 = require("../utils/analytics");
const lodash_1 = __importDefault(require("lodash"));
class NoteTraitManager {
    _wsRoot;
    cmdRegistar;
    L = logger_1.Logger;
    _watcher;
    constructor(_wsRoot, registrar) {
        this._wsRoot = _wsRoot;
        this.cmdRegistar = registrar;
        this.registeredTraits = new Map();
    }
    /**
     * Loads up saved note traits and sets up a filewatcher on trait .js files
     */
    async initialize() {
        await this.setupSavedTraitsFromFS();
        await this.setupFileWatcherForTraitFileChanges();
    }
    registeredTraits;
    registerTrait(trait) {
        if (this.registeredTraits.has(trait.id)) {
            return common_all_1.ResponseUtil.createUnhappyResponse({
                error: new common_all_1.DendronError({
                    message: `Type with ID ${trait.id} has already been registered`,
                    severity: common_all_1.ERROR_SEVERITY.MINOR,
                }),
            });
        }
        // During registration, do a test execution of each function to make sure
        // it's valid TS/JS and doesn't throw.
        const testContext = {
            currentNoteName: "foo.bar",
            selectedText: "text",
            clipboard: "clipboard",
        };
        if (trait.OnCreate?.setTitle) {
            try {
                trait.OnCreate.setTitle(testContext);
            }
            catch (error) {
                return common_all_1.ResponseUtil.createUnhappyResponse({
                    error: new common_all_1.DendronError({
                        message: `Error in OnCreate.setTitle function.`,
                        innerError: error,
                    }),
                });
            }
        }
        if (trait.OnCreate?.setTemplate) {
            try {
                trait.OnCreate.setTemplate();
            }
            catch (error) {
                return common_all_1.ResponseUtil.createUnhappyResponse({
                    error: new common_all_1.DendronError({
                        message: `Error in OnCreate.setTemplate function.`,
                        innerError: error,
                    }),
                });
            }
        }
        if (trait.OnWillCreate?.setNameModifier) {
            try {
                trait.OnWillCreate.setNameModifier(testContext);
            }
            catch (error) {
                return common_all_1.ResponseUtil.createUnhappyResponse({
                    error: new common_all_1.DendronError({
                        message: `Error in OnWillCreate.setNameModifier function.`,
                        innerError: error,
                    }),
                });
            }
        }
        this.registeredTraits.set(trait.id, trait);
        this.cmdRegistar.registerCommandForTrait(trait);
        return { error: null };
    }
    unregisterTrait(trait) {
        this.cmdRegistar.unregisterTrait(trait);
        this.registeredTraits.delete(trait.id);
        return { error: null };
    }
    getTypesWithRegisteredCallback(_callbackType) {
        throw new Error("Method not implemented.");
    }
    getRegisteredCommandForTrait(trait) {
        if (trait.id in this.cmdRegistar.registeredCommands) {
            return this.cmdRegistar.registeredCommands[trait.id];
        }
        return undefined;
    }
    dispose() {
        if (this._watcher) {
            this._watcher.dispose();
        }
    }
    // ^6fjseznl6au4
    async setupSavedTraitsFromFS() {
        const { wsRoot } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const userTraitsPath = wsRoot
            ? path_1.default.join(wsRoot, common_all_1.CONSTANTS.DENDRON_USER_NOTE_TRAITS_BASE)
            : undefined;
        if (userTraitsPath && fs_extra_1.default.pathExistsSync(userTraitsPath)) {
            const files = fs_extra_1.default.readdirSync(userTraitsPath);
            // Track some info about how many and what kind of traits users have
            let traitJSFileCount = 0;
            let traitInitializedCount = 0;
            let traitHasSetTitleImplCount = 0;
            let traitHasSetNameModifierImplCount = 0;
            let traitHasSetTemplateImplCount = 0;
            (0, common_all_1.asyncLoopOneAtATime)(files, async (file) => {
                if (file.endsWith(".js")) {
                    traitJSFileCount += 1;
                    const resp = await this.setupTraitFromJSFile(path_1.default.join(userTraitsPath, file));
                    // Don't log an error at this point since we're just initializing - if
                    // a user has some old trait files with errors in their workspace,
                    // don't warn about trait errors until they try to actually use it.
                    if (!common_all_1.ResponseUtil.hasError(resp)) {
                        traitInitializedCount += 1;
                        const newNoteTrait = resp.data;
                        if (newNoteTrait?.OnCreate?.setTitle) {
                            traitHasSetTitleImplCount += 1;
                        }
                        if (newNoteTrait?.OnCreate?.setTemplate) {
                            traitHasSetTemplateImplCount += 1;
                        }
                        if (newNoteTrait?.OnWillCreate?.setNameModifier) {
                            traitHasSetNameModifierImplCount += 1;
                        }
                    }
                }
            });
            if (traitJSFileCount > 0) {
                analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.NoteTraitsInitialized, {
                    traitJSFileCount,
                    traitInitializedCount,
                    traitHasSetTitleImplCount,
                    traitHasSetNameModifierImplCount,
                    traitHasSetTemplateImplCount,
                });
            }
        }
    }
    async setupTraitFromJSFile(fsPath) {
        const traitId = path_1.default.basename(fsPath, ".js");
        this.L.info("Registering User Defined Note Trait with ID " + traitId);
        const newNoteTrait = new UserDefinedTraitV1_1.UserDefinedTraitV1(traitId, fsPath);
        try {
            await newNoteTrait.initialize();
        }
        catch (error) {
            return {
                error: new common_all_1.DendronError({
                    message: `Error in ${path_1.default.basename(fsPath)} file.`,
                    innerError: error,
                }),
            };
        }
        const resp = this.registerTrait(newNoteTrait);
        return {
            data: newNoteTrait,
            error: resp.error,
        };
    }
    async setupFileWatcherForTraitFileChanges() {
        const userTraitsPath = this._wsRoot
            ? path_1.default.join(this._wsRoot, common_all_1.CONSTANTS.DENDRON_USER_NOTE_TRAITS_BASE)
            : undefined;
        if (!userTraitsPath) {
            return;
        }
        const pattern = new vscode.RelativePattern(userTraitsPath, "*.js");
        this._watcher = vscode.workspace.createFileSystemWatcher(pattern, false, false, false);
        this._watcher.onDidCreate((uri) => {
            this.setupTraitFromJSFile(uri.fsPath);
        });
        this._watcher.onDidChange(
        // Need to debounce this, for some reason it fires 4 times each save
        lodash_1.default.debounce(async (uri) => {
            const traitId = path_1.default.basename(uri.fsPath, ".js");
            // First unregister if it exists already (and then re-register)
            if (this.registeredTraits.has(traitId)) {
                this.unregisterTrait(this.registeredTraits.get(traitId));
            }
            const resp = await this.setupTraitFromJSFile(uri.fsPath);
            if (common_all_1.ResponseUtil.hasError(resp)) {
                const errMessage = `${resp.error?.message}\n${resp.error?.innerError?.stack}`;
                vscode.window.showErrorMessage(errMessage);
            }
            else {
                vscode.window.showInformationMessage(`Note trait ${traitId} successfully registered.`);
            }
        }, 500, // 500 ms debounce interval
        {
            trailing: true,
            leading: false,
        }));
        this._watcher.onDidDelete((uri) => {
            const traitId = path_1.default.basename(uri.fsPath, ".js");
            if (this.registeredTraits.has(traitId)) {
                this.unregisterTrait(this.registeredTraits.get(traitId));
            }
        });
    }
}
exports.NoteTraitManager = NoteTraitManager;
/**
 * Not used yet
 */
var callbackType;
(function (callbackType) {
    callbackType[callbackType["onDescendantLifecycleEvent"] = 0] = "onDescendantLifecycleEvent";
    callbackType[callbackType["onSiblingLifecycleEvent"] = 1] = "onSiblingLifecycleEvent";
})(callbackType || (callbackType = {}));
//# sourceMappingURL=NoteTraitManager.js.map