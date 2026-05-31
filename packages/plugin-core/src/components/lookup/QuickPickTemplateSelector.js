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
exports.QuickPickTemplateSelector = void 0;
const common_all_1 = require("@dendronhq/common-all");
const ExtensionProvider_1 = require("../../ExtensionProvider");
const NoteLookupProviderUtils_1 = require("./NoteLookupProviderUtils");
const logger_1 = require("../../logger");
const vscode = __importStar(require("vscode"));
const vsCodeUtils_1 = require("../../vsCodeUtils");
const constants_1 = require("../../constants");
const AutoCompletableRegistrar_1 = require("../../utils/registers/AutoCompletableRegistrar");
const autoCompleter_1 = require("../../utils/autoCompleter");
class QuickPickTemplateSelector {
    getTemplate(opts) {
        const logger = opts.logger || logger_1.Logger;
        const id = opts.providerId || "TemplateSelector";
        const extension = ExtensionProvider_1.ExtensionProvider.getExtension();
        const controller = extension.lookupControllerFactory.create({
            nodeType: "note",
            buttons: [],
        });
        const provider = extension.noteLookupProviderFactory.create(id, {
            allowNewNote: false,
            forceAsIsPickerValueUsage: true,
        });
        const config = extension.getDWorkspace().config;
        const tempPrefix = common_all_1.ConfigUtils.getCommands(config).templateHierarchy;
        const initialValue = tempPrefix ? `${tempPrefix}.` : undefined;
        let disposable;
        return new Promise((resolve) => {
            NoteLookupProviderUtils_1.NoteLookupProviderUtils.subscribe({
                id,
                controller,
                logger,
                onHide: () => {
                    resolve(undefined);
                    NoteLookupProviderUtils_1.NoteLookupProviderUtils.cleanup({
                        id,
                        controller,
                    });
                },
                onDone: (event) => {
                    const data = event.data;
                    if (data.cancel) {
                        resolve(undefined);
                    }
                    else {
                        const templateNote = event.data.selectedItems[0];
                        resolve(templateNote);
                    }
                    NoteLookupProviderUtils_1.NoteLookupProviderUtils.cleanup({
                        id,
                        controller,
                    });
                    disposable?.dispose();
                    vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, false);
                },
                onError: (event) => {
                    const error = event.data.error;
                    vscode.window.showErrorMessage(error.message);
                    resolve(undefined);
                    NoteLookupProviderUtils_1.NoteLookupProviderUtils.cleanup({
                        id,
                        controller,
                    });
                    disposable?.dispose();
                    vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, false);
                },
            });
            controller.show({
                title: "Select template to apply",
                placeholder: "template",
                provider,
                initialValue,
            });
            vsCodeUtils_1.VSCodeUtils.setContext(constants_1.DendronContext.NOTE_LOOK_UP_ACTIVE, true);
            disposable = AutoCompletableRegistrar_1.AutoCompletableRegistrar.OnAutoComplete(() => {
                if (controller.quickPick) {
                    controller.quickPick.value = autoCompleter_1.AutoCompleter.getAutoCompletedValue(controller.quickPick);
                    controller.provider.onUpdatePickerItems({
                        picker: controller.quickPick,
                    });
                }
            });
        });
    }
}
exports.QuickPickTemplateSelector = QuickPickTemplateSelector;
//# sourceMappingURL=QuickPickTemplateSelector.js.map