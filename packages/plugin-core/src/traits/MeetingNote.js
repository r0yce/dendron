"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingNote = void 0;
const clientUtils_1 = require("../clientUtils");
class MeetingNote {
    id = "meetingNote";
    getTemplateType;
    _config;
    _ext;
    _noConfirm = false;
    constructor(config, ext, noConfirm) {
        this._config = config;
        this._ext = ext;
        this._noConfirm = noConfirm ?? this._noConfirm;
    }
    get OnWillCreate() {
        const promptUserForModification = !this._noConfirm;
        return {
            setNameModifier(_opts) {
                const name = clientUtils_1.DendronClientUtilsV2.getMeetingNoteName();
                return { name, promptUserForModification };
            },
        };
    }
}
exports.MeetingNote = MeetingNote;
//# sourceMappingURL=MeetingNote.js.map