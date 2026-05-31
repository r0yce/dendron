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
exports.CreateDailyJournalCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const engine_server_1 = require("@dendronhq/engine-server");
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const utils_1 = require("../components/lookup/utils");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const journal_1 = require("../traits/journal");
const vsCodeUtils_1 = require("../vsCodeUtils");
const CreateNoteWithTraitCommand_1 = require("./CreateNoteWithTraitCommand");
class CreateDailyJournalCommand extends CreateNoteWithTraitCommand_1.CreateNoteWithTraitCommand {
    static requireActiveWorkspace = true;
    static DENDRON_TEMPLATES_FNAME = "templates";
    constructor(ext) {
        const initTrait = () => {
            const config = ExtensionProvider_1.ExtensionProvider.getDWorkspace().config;
            return new journal_1.JournalNote(config);
        };
        super(ext, "dendron.journal", initTrait);
        // override the key to maintain compatibility
        this.key = constants_1.DENDRON_COMMANDS.CREATE_DAILY_JOURNAL_NOTE.key;
    }
    async execute(opts) {
        const config = this._extension.getDWorkspace().config;
        const journalConfig = common_all_1.ConfigUtils.getJournal(config);
        const maybeDailyVault = journalConfig.dailyVault;
        const vault = maybeDailyVault
            ? common_all_1.VaultUtils.getVaultByName({
                vaults: this._extension.getEngine().vaults,
                vname: maybeDailyVault,
            })
            : undefined;
        let isFirstTime = false;
        let isSchemaCreated = false;
        let isTemplateCreated = false;
        const metaData = engine_server_1.MetadataService.instance().getMeta();
        // Only create default schema/template if running Daily Journal for first time after 5/31/22
        if (lodash_1.default.isUndefined(metaData.firstDailyJournalTime)) {
            isFirstTime = true;
            engine_server_1.MetadataService.instance().setFirstDailyJournalTime();
            if (!lodash_1.default.isUndefined(metaData.firstInstall) &&
                metaData.firstInstall > common_all_1.Time.DateTime.fromISO("2022-06-06").toSeconds()) {
                // Check if a schema file exists, and if it doesn't, then create it first.
                isSchemaCreated = await this.makeSchemaFileIfNotExisting(journalConfig);
                // same with template file:
                isTemplateCreated = await this.createTemplateFileIfNotExisting(journalConfig);
            }
        }
        await super.execute({ ...opts, vaultOverride: vault });
        return { isFirstTime, isSchemaCreated, isTemplateCreated };
    }
    /**
     * Track whether new schema or template files were created
     */
    addAnalyticsPayload(_opts, resp) {
        return { resp };
    }
    /**
     * Create the pre-canned schema so that we can apply a template to the user's
     * daily journal notes if the schema with the daily journal domain doesn't exist yet.
     *
     * @returns whether a new schema file was made
     */
    async makeSchemaFileIfNotExisting(journalConfig) {
        const dailyDomain = journalConfig.dailyDomain;
        if (await common_all_1.SchemaUtils.doesSchemaExist({
            id: dailyDomain,
            engine: this._extension.getEngine(),
        })) {
            return false;
        }
        const maybeVault = journalConfig.dailyVault
            ? common_all_1.VaultUtils.getVaultByName({
                vaults: this._extension.getEngine().vaults,
                vname: journalConfig.dailyVault,
            })
            : undefined;
        const vaultPath = (0, common_server_1.vault2Path)({
            vault: maybeVault || utils_1.PickerUtilsV2.getVaultForOpenEditor(),
            wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
        });
        const uri = vscode.Uri.file(common_all_1.SchemaUtils.getPath({ root: vaultPath, fname: `dendron.${dailyDomain}` }));
        const topLevel = {
            id: dailyDomain,
            title: dailyDomain,
            parent: "root",
            desc: "Identifier that will be used when using 'Lookup (Schema)' command.",
        };
        const tokenizedMatrix = [
            [
                { pattern: dailyDomain },
                {
                    pattern: journalConfig.name,
                    desc: "This pattern matches the 'journal' child hierarchy",
                },
                {
                    pattern: "[0-2][0-9][0-9][0-9]",
                    desc: "This pattern matches the YYYY (year) child hierarchy",
                },
                {
                    pattern: "[0-1][0-9]",
                    desc: "This pattern matches the MM (month) child hierarchy",
                },
                {
                    pattern: "[0-3][0-9]",
                    desc: "This pattern matches the DD (day) child hierarchy",
                    template: {
                        id: CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME +
                            `.${dailyDomain}`,
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
     * Create the pre-canned daily journal template file in the user's workspace if it
     * doesn't exist yet.
     *
     * @returns whether a new template file was made
     */
    async createTemplateFileIfNotExisting(journalConfig) {
        const fname = CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME +
            `.${journalConfig.dailyDomain}`;
        const fileName = fname + `.md`;
        const existingTemplates = await this._extension
            .getEngine()
            .findNotesMeta({ fname });
        const maybeVault = journalConfig.dailyVault
            ? common_all_1.VaultUtils.getVaultByName({
                vaults: this._extension.getEngine().vaults,
                vname: journalConfig.dailyVault,
            })
            : undefined;
        const vault = maybeVault || utils_1.PickerUtilsV2.getVaultForOpenEditor();
        const vaultPath = (0, common_server_1.vault2Path)({
            vault: utils_1.PickerUtilsV2.getVaultForOpenEditor(),
            wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
        });
        if (existingTemplates.length > 0) {
            return false;
        }
        const destfPath = path_1.default.join(vaultPath, fileName);
        // In addition to checking the engine on whether a note already exists,
        // check the file system path for the template file to ensure copying
        // succeeds
        if (await fs.pathExists(destfPath)) {
            return false;
        }
        const assetUri = vsCodeUtils_1.VSCodeUtils.getAssetUri(this._extension.context);
        const dendronWSTemplate = vsCodeUtils_1.VSCodeUtils.joinPath(assetUri, "dendron-ws");
        const src = path_1.default.join(dendronWSTemplate.fsPath, "templates", fileName);
        const body = (await fs.readFile(src)).toString();
        // Ensure that engine state is aware of the template before returning so
        // that the template can be found when creating the daily journal note.
        const templateNoteProps = common_all_1.NoteUtils.create({
            fname,
            vault,
            id: (0, common_all_1.genUUID)(),
            title: "Daily Journal Template",
            body,
        });
        await this._extension.getEngine().writeNote(templateNoteProps);
        vscode.window.showInformationMessage(`Created template for your daily journal notes at ${fname}`);
        return true;
    }
}
exports.CreateDailyJournalCommand = CreateDailyJournalCommand;
//# sourceMappingURL=CreateDailyJournal.js.map