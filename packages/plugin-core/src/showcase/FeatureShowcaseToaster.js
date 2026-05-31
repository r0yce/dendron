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
exports.FeatureShowcaseToaster = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const vscode = __importStar(require("vscode"));
const analytics_1 = require("../utils/analytics");
const AllFeatureShowcases_1 = require("./AllFeatureShowcases");
const IFeatureShowcaseMessage_1 = require("./IFeatureShowcaseMessage");
/**
 * Class to showcase certain features of Dendron as a toast message
 */
class FeatureShowcaseToaster {
    /**
     * Show a toast containing information about a Dendron Feature. Doesn't show
     * messages more than once, and it also doesn't show to new user's in their
     * first week of Dendron.
     * @returns whether a toast was shown or not
     */
    showToast() {
        // Don't show tips for users in their first week.
        if (analytics_1.AnalyticsUtils.isFirstWeek()) {
            return false;
        }
        for (const message of AllFeatureShowcases_1.ALL_FEATURE_SHOWCASES) {
            // Keep cycling through messages until there's one that should be shown
            if (!this.hasShownMessage(message.showcaseEntry) &&
                message.shouldShow(IFeatureShowcaseMessage_1.DisplayLocation.InformationMessage)) {
                this.showInformationMessage(IFeatureShowcaseMessage_1.DisplayLocation.InformationMessage, message);
                return true;
            }
        }
        return false;
    }
    /**
     * Show a specific toast message. This will not show if the message has
     * already been shown to the user, but unlike {@link showToast}, it will show
     * even if the user is still in their first week of usage.
     * @param message
     * @returns
     */
    showSpecificToast(message) {
        if (!this.hasShownMessage(message.showcaseEntry) &&
            message.shouldShow(IFeatureShowcaseMessage_1.DisplayLocation.InformationMessage)) {
            this.showInformationMessage(IFeatureShowcaseMessage_1.DisplayLocation.InformationMessage, message);
            return true;
        }
        return false;
    }
    /**
     * Check if we've shown this particular message to the user already
     * @param type
     * @returns
     */
    hasShownMessage(type) {
        return (engine_server_1.MetadataService.instance().getFeatureShowcaseStatus(type) !== undefined);
    }
    showInformationMessage(displayLocation, message) {
        analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.FeatureShowcaseDisplayed, {
            messageType: message.showcaseEntry,
            displayLocation,
        });
        const options = lodash_1.default.without([message.confirmText, message.deferText], undefined);
        vscode.window
            .showInformationMessage(message.getDisplayMessage(IFeatureShowcaseMessage_1.DisplayLocation.InformationMessage), ...options)
            .then((resp) => {
            let userResponse;
            engine_server_1.MetadataService.instance().setFeatureShowcaseStatus(message.showcaseEntry);
            if (resp === undefined) {
                userResponse = IFeatureShowcaseMessage_1.FeatureShowcaseUserResponse.dismissed;
            }
            else if (resp === message.confirmText) {
                userResponse = IFeatureShowcaseMessage_1.FeatureShowcaseUserResponse.confirmed;
            }
            else {
                // Don't set the metadata because the user deferred let's toast the
                // user again later.
                userResponse = IFeatureShowcaseMessage_1.FeatureShowcaseUserResponse.deferred;
            }
            analytics_1.AnalyticsUtils.track(common_all_1.VSCodeEvents.FeatureShowcaseResponded, {
                messageType: message.showcaseEntry,
                displayLocation: IFeatureShowcaseMessage_1.DisplayLocation.InformationMessage,
                userResponse,
            });
            if (resp === message.confirmText && message.onConfirm) {
                message.onConfirm.bind(message)();
            }
        });
    }
}
exports.FeatureShowcaseToaster = FeatureShowcaseToaster;
//# sourceMappingURL=FeatureShowcaseToaster.js.map