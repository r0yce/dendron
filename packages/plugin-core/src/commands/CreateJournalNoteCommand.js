"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateJournalNoteCommand = void 0;
const logger_1 = require("../logger");
const constants_1 = require("../constants");
const base_1 = require("./base");
const buttons_1 = require("../components/lookup/buttons");
const NoteLookupCommand_1 = require("./NoteLookupCommand");
const common_all_1 = require("@dendronhq/common-all");
const vaultSelectionModeConfigUtils_1 = require("../components/lookup/vaultSelectionModeConfigUtils");
class CreateJournalNoteCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.CREATE_JOURNAL.key;
    extension;
    constructor(ext) {
        super();
        this.extension = ext;
    }
    createLookupController() {
        const commandConfig = common_all_1.ConfigUtils.getCommands(this.extension.getDWorkspace().config);
        const confirmVaultOnCreate = commandConfig.lookup.note.confirmVaultOnCreate;
        const vaultButtonPressed = vaultSelectionModeConfigUtils_1.VaultSelectionModeConfigUtils.shouldAlwaysPromptVaultSelection();
        const opts = {
            nodeType: "note",
            disableVaultSelection: !confirmVaultOnCreate,
            vaultButtonPressed,
            extraButtons: [
                buttons_1.JournalBtn.create({ pressed: true, canToggle: false }),
                buttons_1.CopyNoteLinkBtn.create(false),
                buttons_1.HorizontalSplitBtn.create(false),
            ],
            title: "Create Journal Note",
        };
        const controller = this.extension.lookupControllerFactory.create(opts);
        return controller;
    }
    async execute(opts) {
        const ctx = "CreateJournalNote";
        logger_1.Logger.info({ ctx, msg: "enter" });
        const lookupCmd = new NoteLookupCommand_1.NoteLookupCommand();
        lookupCmd.controller = this.createLookupController();
        await lookupCmd.run(opts);
    }
}
exports.CreateJournalNoteCommand = CreateJournalNoteCommand;
//# sourceMappingURL=CreateJournalNoteCommand.js.map