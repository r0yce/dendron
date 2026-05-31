"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.maybeSendMeetingNoteTelemetry = maybeSendMeetingNoteTelemetry;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const ExtensionProvider_1 = require("../ExtensionProvider");
const vsCodeUtils_1 = require("../vsCodeUtils");
const analytics_1 = require("./analytics");
/**
 * Send a special telemetry marker if a note is being created from a Meeting
 * Note. If the current active editor isn't a meeting note, nothing is sent.
 *
 * This functionality can be removed after enough data is collected.
 *
 * @param type - will be attached to the telemetry data payload
 * @returns
 */
async function maybeSendMeetingNoteTelemetry(type) {
    const maybeEditor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
    if (lodash_1.default.isUndefined(maybeEditor)) {
        return;
    }
    const activeNote = (await ExtensionProvider_1.ExtensionProvider.getWSUtils().getNoteFromDocument(maybeEditor.document));
    if (lodash_1.default.isUndefined(activeNote)) {
        return;
    }
    if (activeNote &&
        activeNote.traitIds &&
        activeNote.traitIds.includes("meetingNote")) {
        analytics_1.AnalyticsUtils.track(common_all_1.EngagementEvents.AdditionalNoteFromMeetingNoteCreated, {
            type,
        });
    }
}
//# sourceMappingURL=MeetingTelemHelper.js.map