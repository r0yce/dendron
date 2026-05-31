"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateScratchNoteCommand = void 0;
const logger_1 = require("../logger");
const constants_1 = require("../constants");
const base_1 = require("./base");
const buttons_1 = require("../components/lookup/buttons");
const NoteLookupCommand_1 = require("./NoteLookupCommand");
const common_all_1 = require("@dendronhq/common-all");
const vaultSelectionModeConfigUtils_1 = require("../components/lookup/vaultSelectionModeConfigUtils");
const FeatureShowcaseToaster_1 = require("../showcase/FeatureShowcaseToaster");
const CreateScratchNoteKeybindingTip_1 = require("../showcase/CreateScratchNoteKeybindingTip");
const engine_server_1 = require("@dendronhq/engine-server");
const semver_1 = __importDefault(require("semver"));
class CreateScratchNoteCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.CREATE_SCRATCH.key;
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
                buttons_1.ScratchBtn.create({ pressed: true, canToggle: false }),
                buttons_1.Selection2LinkBtn.create(true),
                buttons_1.CopyNoteLinkBtn.create(false),
                buttons_1.HorizontalSplitBtn.create(false),
            ],
            title: "Create Scratch Note",
        };
        const controller = this.extension.lookupControllerFactory.create(opts);
        return controller;
    }
    async execute(opts) {
        const ctx = "CreateScratchNote";
        logger_1.Logger.info({ ctx, msg: "enter" });
        const lookupCmd = new NoteLookupCommand_1.NoteLookupCommand();
        lookupCmd.controller = this.createLookupController();
        await lookupCmd.run(opts);
        // TODO: remove after 1-2 weeks.
        const firstInstallVersion = engine_server_1.MetadataService.instance().firstInstallVersion;
        if (firstInstallVersion === undefined ||
            semver_1.default.lt(firstInstallVersion, "0.113.0")) {
            const showcase = new FeatureShowcaseToaster_1.FeatureShowcaseToaster();
            showcase.showSpecificToast(new CreateScratchNoteKeybindingTip_1.CreateScratchNoteKeybindingTip());
        }
    }
}
exports.CreateScratchNoteCommand = CreateScratchNoteCommand;
//# sourceMappingURL=CreateScratchNoteCommand.js.map