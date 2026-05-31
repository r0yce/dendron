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
exports.DendronClientUtilsV2 = void 0;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const constants_1 = require("./constants");
const ExtensionProvider_1 = require("./ExtensionProvider");
class DendronClientUtilsV2 {
    static genNotePrefix(fname, addBehavior) {
        let out;
        switch (addBehavior) {
            case "childOfDomain": {
                out = common_all_1.DNodeUtils.domainName(fname);
                break;
            }
            case "childOfDomainNamespace": {
                out = common_all_1.NoteUtils.getPathUpTo(fname, 2);
                break;
            }
            case "childOfCurrent": {
                out = fname;
                break;
            }
            case "asOwnDomain": {
                out = "";
                break;
            }
            default: {
                throw Error(`unknown add Behavior: ${addBehavior}`);
            }
        }
        return out;
    }
    /**
     * Generates a file name for a meeting note. The date format is not
     * configurable, because it needs to match a pre-defined generated schema
     * pattern for meeting notes.
     * @returns
     */
    static getMeetingNoteName() {
        const noteDate = common_all_1.Time.now().toFormat("y.MM.dd");
        return ["meet", noteDate].filter((ent) => !lodash_1.default.isEmpty(ent)).join(".");
    }
    /**
     * Generates a file name for a journal or scratch note. Must be derived by an
     * open note, or passed as an option.
     * @param type 'JOURNAL' | 'SCRATCH'
     * @param opts Options to control how the note will be named
     * @returns The file name of the new note
     */
    static genNoteName(type, opts) {
        // gather inputs
        const config = ExtensionProvider_1.ExtensionProvider.getDWorkspace().config;
        let dateFormat;
        let addBehavior;
        let name;
        switch (type) {
            case common_all_1.LookupNoteTypeEnum.scratch: {
                dateFormat =
                    ExtensionProvider_1.ExtensionProvider.getExtension().getWorkspaceSettingOrDefault({
                        wsConfigKey: "dendron.defaultScratchDateFormat",
                        dendronConfigKey: "workspace.scratch.dateFormat",
                    });
                addBehavior =
                    ExtensionProvider_1.ExtensionProvider.getExtension().getWorkspaceSettingOrDefault({
                        wsConfigKey: "dendron.defaultScratchAddBehavior",
                        dendronConfigKey: "workspace.scratch.addBehavior",
                    });
                name = ExtensionProvider_1.ExtensionProvider.getExtension().getWorkspaceSettingOrDefault({
                    wsConfigKey: "dendron.defaultScratchName",
                    dendronConfigKey: "workspace.scratch.name",
                });
                break;
            }
            case common_all_1.LookupNoteTypeEnum.journal: {
                const journalConfig = common_all_1.ConfigUtils.getJournal(config);
                dateFormat = journalConfig.dateFormat;
                addBehavior = journalConfig.addBehavior;
                name = journalConfig.name;
                break;
            }
            case common_all_1.LookupNoteTypeEnum.task: {
                const taskConfig = common_all_1.ConfigUtils.getTask(config);
                dateFormat = taskConfig.dateFormat;
                addBehavior = taskConfig.addBehavior;
                name = taskConfig.name;
                break;
            }
            default:
                (0, common_all_1.assertUnreachable)(type);
        }
        if (!lodash_1.default.includes(constants_1._noteAddBehaviorEnum, addBehavior)) {
            const actual = addBehavior;
            const choices = Object.keys(common_all_1.NoteAddBehaviorEnum).join(", ");
            throw Error(`${actual} must be one of: ${choices}`);
        }
        const editorPath = vscode.window.activeTextEditor?.document.uri.fsPath;
        const currentNoteFname = opts?.overrides?.domain ||
            (editorPath ? path_1.default.basename(editorPath, ".md") : undefined);
        if (!currentNoteFname) {
            throw Error("Must be run from within a note");
        }
        const prefix = DendronClientUtilsV2.genNotePrefix(currentNoteFname, addBehavior);
        const noteDate = common_all_1.Time.now().toFormat(dateFormat);
        const noteName = [prefix, name, noteDate]
            .filter((ent) => !lodash_1.default.isEmpty(ent))
            .join(".");
        return { noteName, prefix };
    }
    static getSchemaModByFname = async ({ fname, client, }) => {
        const smod = (await client.getSchema(fname)).data;
        if (!smod) {
            throw new common_all_1.DendronError({ message: "no note found" });
        }
        return smod;
    };
    static shouldUseVaultPrefix(engine) {
        const config = ExtensionProvider_1.ExtensionProvider.getDWorkspace().config;
        const enableXVaultWikiLink = common_all_1.ConfigUtils.getWorkspace(config).enableXVaultWikiLink;
        const useVaultPrefix = lodash_1.default.size(engine.vaults) > 1 &&
            lodash_1.default.isBoolean(enableXVaultWikiLink) &&
            enableXVaultWikiLink;
        return useVaultPrefix;
    }
}
exports.DendronClientUtilsV2 = DendronClientUtilsV2;
//# sourceMappingURL=clientUtils.js.map