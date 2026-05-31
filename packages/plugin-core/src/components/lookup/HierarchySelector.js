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
exports.QuickPickHierarchySelector = void 0;
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const logger_1 = require("../../logger");
const vsCodeUtils_1 = require("../../vsCodeUtils");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const NoteLookupProviderUtils_1 = require("./NoteLookupProviderUtils");
const constants_1 = require("../../constants");
const autoCompleter_1 = require("../../utils/autoCompleter");
const AutoCompletableRegistrar_1 = require("../../utils/registers/AutoCompletableRegistrar");
/**
 * Implementation of HierarchySelector that prompts user to with a lookup
 * controller V3.
 */
class QuickPickHierarchySelector {
    getHierarchy() {
        return new Promise((resolve) => {
            const lookupCreateOpts = {
                nodeType: "note",
                disableVaultSelection: true,
            };
            const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
            const lc = extension.lookupControllerFactory.create(lookupCreateOpts);
            const PROVIDER_ID = "HierarchySelector";
            const provider = extension.noteLookupProviderFactory.create(PROVIDER_ID, {
                allowNewNote: false,
                forceAsIsPickerValueUsage: true,
            });
            const defaultNoteName = path_1.default.basename(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "", ".md");
            let disposable;
            NoteLookupProviderUtils_1.NoteLookupProviderUtils.subscribe({
                id: PROVIDER_ID,
                controller: lc,
                logger: logger_1.Logger,
                onHide: () => {
                    resolve(undefined);
                    NoteLookupProviderUtils_1.NoteLookupProviderUtils.cleanup({
                        id: PROVIDER_ID,
                        controller: lc,
                    });
                },
                onDone: async (event) => {
                    const data = event.data;
                    if (data.cancel) {
                        resolve(undefined);
                    }
                    else {
                        const hierarchy = data.selectedItems[0].fname;
                        const vault = data.selectedItems[0].vault;
                        resolve({ hierarchy, vault });
                    }
                    NoteLookupProviderUtils_1.NoteLookupProviderUtils.cleanup({
                        id: PROVIDER_ID,
                        controller: lc,
                    });
                    disposable?.dispose();
                    vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, false);
                },
                onError: (event) => {
                    const error = event.data.error;
                    vscode.window.showErrorMessage(error.message);
                    resolve(undefined);
                    NoteLookupProviderUtils_1.NoteLookupProviderUtils.cleanup({
                        id: PROVIDER_ID,
                        controller: lc,
                    });
                    disposable?.dispose();
                    vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, false);
                },
            });
            lc.show({
                placeholder: "Enter Hierarchy Name",
                provider,
                initialValue: defaultNoteName,
                title: `Select Hierarchy for Export`,
            });
            vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, true);
            disposable = AutoCompletableRegistrar_1.AutoCompletableRegistrar.OnAutoComplete(() => {
                if (lc.quickPick) {
                    lc.quickPick.value = autoCompleter_1.AutoCompleter.getAutoCompletedValue(lc.quickPick);
                    lc.provider.onUpdatePickerItems({
                        picker: lc.quickPick,
                    });
                }
            });
        });
    }
}
exports.QuickPickHierarchySelector = QuickPickHierarchySelector;
//# sourceMappingURL=HierarchySelector.js.map