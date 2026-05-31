"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalNote = void 0;
const common_all_1 = require("@dendronhq/common-all");
const clientUtils_1 = require("../clientUtils");
class JournalNote {
    id = "journalNote";
    getTemplateType;
    _config;
    constructor(config) {
        this._config = config;
    }
    get OnWillCreate() {
        const config = this._config;
        return {
            setNameModifier(_opts) {
                const journalConfig = common_all_1.ConfigUtils.getJournal(config);
                const dailyJournalDomain = journalConfig.dailyDomain;
                const { noteName: fname } = clientUtils_1.DendronClientUtilsV2.genNoteName(common_all_1.LookupNoteTypeEnum.journal, {
                    overrides: { domain: dailyJournalDomain },
                });
                return { name: fname, promptUserForModification: false };
            },
        };
    }
    get OnCreate() {
        const config = this._config;
        return {
            setTitle(opts) {
                const journalConfig = common_all_1.ConfigUtils.getJournal(config);
                const journalName = journalConfig.name;
                const title = common_all_1.NoteUtils.genJournalNoteTitle({
                    fname: opts.currentNoteName,
                    journalName,
                });
                return title;
            },
        };
    }
}
exports.JournalNote = JournalNote;
//# sourceMappingURL=journal.js.map