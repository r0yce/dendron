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
exports.ApplyTemplateCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const lodash_1 = __importDefault(require("lodash"));
const QuickPickTemplateSelector_1 = require("../components/lookup/QuickPickTemplateSelector");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const analytics_1 = require("../utils/analytics");
const vsCodeUtils_1 = require("../vsCodeUtils");
const WSUtilsV2_1 = require("../WSUtilsV2");
const base_1 = require("./base");
const vscode = __importStar(require("vscode"));
const APPLY_TEMPLATE_LOOKUP_ID = "templateApply;";
class ApplyTemplateCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.APPLY_TEMPLATE.key;
    async sanityCheck() {
        const activeDoc = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
        if (lodash_1.default.isUndefined(activeDoc)) {
            return "No document open";
        }
        // because apply tempalte writes to the note out of band (using fs.write), this will cause
        // conflicts if the document is dirty
        if (activeDoc.document.isDirty) {
            return "Please save the current document before applying a template";
        }
        return;
    }
    async gatherInputs() {
        const targetNote = await WSUtilsV2_1.WSUtilsV2.instance().getActiveNote();
        if (lodash_1.default.isUndefined(targetNote)) {
            throw new common_all_1.DendronError({ message: "No Dendron note open" });
        }
        const selector = new QuickPickTemplateSelector_1.QuickPickTemplateSelector();
        const templateNote = await selector.getTemplate({
            logger: this.L,
            providerId: APPLY_TEMPLATE_LOOKUP_ID,
        });
        if (lodash_1.default.isUndefined(templateNote)) {
            throw new common_all_1.DendronError({ message: `Template not found` });
        }
        return { templateNote, targetNote };
    }
    async execute(opts) {
        const ctx = "ApplyTemplateCommand";
        opts = lodash_1.default.defaults(opts, { closeAndOpenFile: true });
        logger_1.Logger.info({ ctx });
        const { templateNote, targetNote } = opts;
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        if (templateNote === undefined) {
            vscode.window.showInformationMessage("No template selected");
            return { updatedTargetNote: undefined };
        }
        const updatedTargetNote = common_server_1.TemplateUtils.applyTemplate({
            templateNote,
            engine,
            targetNote,
        });
        const resp = await engine.writeNote(updatedTargetNote);
        analytics_1.AnalyticsUtils.track(common_all_1.EngagementEvents.TemplateApplied, {
            source: this.key,
            ...common_server_1.TemplateUtils.genTrackPayload(templateNote),
        });
        if (resp.error) {
            throw new common_all_1.DendronError({
                message: "error applying template",
                innerError: resp.error,
            });
        }
        return { updatedTargetNote };
    }
}
exports.ApplyTemplateCommand = ApplyTemplateCommand;
//# sourceMappingURL=ApplyTemplateCommand.js.map