"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureShowcaseUserResponse = exports.DisplayLocation = void 0;
/**
 * Where the message is being displayed.
 */
var DisplayLocation;
(function (DisplayLocation) {
    DisplayLocation["InformationMessage"] = "InformationMessage";
    DisplayLocation["TipOfTheDayView"] = "TipOfTheDayView";
})(DisplayLocation || (exports.DisplayLocation = DisplayLocation = {}));
/**
 * How did the user respond to the Showcase message. Used in Telemetry
 */
var FeatureShowcaseUserResponse;
(function (FeatureShowcaseUserResponse) {
    /**
     *  User actively closed the UI without selecting an option
     */
    FeatureShowcaseUserResponse["dismissed"] = "dismissed";
    /**
     * User actively selected the positive option
     */
    FeatureShowcaseUserResponse["confirmed"] = "confirmed";
    /**
     * User actively selected the negative option
     */
    FeatureShowcaseUserResponse["deferred"] = "deferred";
})(FeatureShowcaseUserResponse || (exports.FeatureShowcaseUserResponse = FeatureShowcaseUserResponse = {}));
//# sourceMappingURL=IFeatureShowcaseMessage.js.map