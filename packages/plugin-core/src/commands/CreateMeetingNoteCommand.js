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
exports.CreateMeetingNoteCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const fs = __importStar(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const utils_1 = require("../components/lookup/utils");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const MeetingNote_1 = require("../traits/MeetingNote");
const vsCodeUtils_1 = require("../vsCodeUtils");
const CreateNoteWithTraitCommand_1 = require("./CreateNoteWithTraitCommand");
class CreateMeetingNoteCommand extends CreateNoteWithTraitCommand_1.CreateNoteWithTraitCommand {
    _ext;
    static requireActiveWorkspace = true;
    static MEETING_TEMPLATE_FNAME = "templates.meet";
    /**
     *
     * @param ext
     * @param noConfirm - for testing purposes only; don't set in production code
     */
    constructor(ext, noConfirm) {
        const initTrait = () => {
            const config = ExtensionProvider_1.ExtensionProvider.getDWorkspace().config;
            return new MeetingNote_1.MeetingNote(config, ext, noConfirm ?? false);
        };
        super(ext, "dendron.meeting", initTrait);
        this.key = constants_1.DENDRON_COMMANDS.CREATE_MEETING_NOTE.key;
        this._ext = ext;
    }
    async execute(opts) {
        // Check if a schema file exists, and if it doesn't, then create it first.
        const schemaCreated = await this.makeSchemaFileIfNotExisting();
        // same with template file:
        const templateCreated = await this.createTemplateFileIfNotExisting();
        await super.execute(opts);
        return { schemaCreated, templateCreated };
    }
    /**
     * Track whether new schema or template files were created
     */
    addAnalyticsPayload(_opts, resp) {
        return { resp };
    }
    /**
     * Create the pre-canned schema so that we can apply a template to the user's
     * meeting notes if the schema doesn't exist yet.
     * @returns whether a new schema file was made
     */
    async makeSchemaFileIfNotExisting() {
        const vaultPath = (0, common_server_1.vault2Path)({
            vault: utils_1.PickerUtilsV2.getVaultForOpenEditor(),
            wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
        });
        const uri = vscode.Uri.file(common_all_1.SchemaUtils.getPath({ root: vaultPath, fname: "dendron.meet" }));
        if (await fs.pathExists(uri.fsPath)) {
            return false;
        }
        const topLevel = {
            id: "meet",
            title: "meet",
            parent: "root",
            pattern: "meet",
        };
        const tokenizedMatrix = [
            [
                { pattern: "meet" },
                { pattern: "[0-9][0-9][0-9][0-9]" },
                { pattern: "[0-9][0-9]" },
                {
                    pattern: "[0-9][0-9]",
                    template: {
                        id: CreateMeetingNoteCommand.MEETING_TEMPLATE_FNAME,
                        type: "note",
                    },
                },
                {
                    pattern: "*",
                    template: {
                        id: CreateMeetingNoteCommand.MEETING_TEMPLATE_FNAME,
                        type: "note",
                    },
                },
            ],
        ];
        const schemaJson = common_all_1.SchemaCreationUtils.getBodyForTokenizedMatrix({
            topLevel,
            tokenizedMatrix,
        });
        await fs.writeFile(uri.fsPath, schemaJson);
        await ExtensionProvider_1.ExtensionProvider.getExtension().schemaSyncService.saveSchema({
            uri: uri,
            isBrandNewFile: true,
        });
        return true;
    }
    /**
     * Create the pre-canned meeting template file in the user's workspace if it
     * doesn't exist yet.
     * @returns whether a new template file was made
     */
    async createTemplateFileIfNotExisting() {
        const fname = CreateMeetingNoteCommand.MEETING_TEMPLATE_FNAME + ".md";
        const existingMeetingTemplates = await this._extension
            .getEngine()
            .findNotesMeta({
            fname: CreateMeetingNoteCommand.MEETING_TEMPLATE_FNAME,
        });
        const vault = utils_1.PickerUtilsV2.getVaultForOpenEditor();
        const vaultPath = (0, common_server_1.vault2Path)({
            vault,
            wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
        });
        if (existingMeetingTemplates.length > 0) {
            return false;
        }
        const destfPath = path_1.default.join(vaultPath, fname);
        // In addition to checking the engine on whether a note already exists,
        // check the file system path for the template file to ensure copying
        // succeeds
        if (await fs.pathExists(destfPath)) {
            return false;
        }
        const assetUri = vsCodeUtils_1.VSCodeUtils.getAssetUri(this._ext.context);
        const dendronWSTemplate = vsCodeUtils_1.VSCodeUtils.joinPath(assetUri, "dendron-ws");
        const src = path_1.default.join(dendronWSTemplate.fsPath, "templates", fname);
        const body = (await fs.readFile(src)).toString();
        // Ensure that engine state is aware of the template before returning so
        // that the template can be found when creating the meeting note. TODO: This
        // is a bit fragile - make sure this ID matches what's in our built in
        // template
        const templateNoteProps = common_all_1.NoteUtils.create({
            fname: CreateMeetingNoteCommand.MEETING_TEMPLATE_FNAME,
            vault,
            id: (0, common_all_1.genUUID)(),
            title: "Meeting Notes Template",
            body,
        });
        await this._ext.getEngine().writeNote(templateNoteProps);
        vscode.window.showInformationMessage(`Created template for your meeting notes at ${CreateMeetingNoteCommand.MEETING_TEMPLATE_FNAME}`);
        return true;
    }
}
exports.CreateMeetingNoteCommand = CreateMeetingNoteCommand;
//# sourceMappingURL=CreateMeetingNoteCommand.js.map