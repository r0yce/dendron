"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GotoCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const common_server_1 = require("@dendronhq/common-server");
const fs_1 = __importDefault(require("fs"));
const lodash_1 = __importDefault(require("lodash"));
const open_1 = __importDefault(require("open"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const utils_1 = require("../components/lookup/utils");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const EditorUtils_1 = require("../utils/EditorUtils");
const md_1 = require("../utils/md");
const vsCodeUtils_1 = require("../vsCodeUtils");
const workspace_1 = require("../workspace");
const base_1 = require("./base");
const GotoNote_1 = require("./GotoNote");
const GoToNoteInterface_1 = require("./GoToNoteInterface");
const OpenLink_1 = require("./OpenLink");
const GOTO_KEY = "uri";
/**
 * Go to the current link under cursor. This command will exhibit different behavior depending on the type of the link.
 * See [[dendron.ref.commands.goto]] for more details
 */
class GotoCommand extends base_1.BasicCommand {
    _ext;
    key = constants_1.DENDRON_COMMANDS.GOTO.key;
    constructor(_ext) {
        super();
        this._ext = _ext;
    }
    addAnalyticsPayload(_opts, out) {
        if (!out?.data) {
            return {};
        }
        const kind = out.data.kind;
        // non-note file has file type
        if (out.data.kind === GoToNoteInterface_1.TargetKind.NON_NOTE) {
            return {
                kind,
                type: out.data.type,
            };
        }
        return { kind };
    }
    async execute() {
        const externalLink = (0, md_1.getURLAt)(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor());
        const noteLink = await EditorUtils_1.EditorUtils.getLinkFromSelectionWithWorkspace();
        /* If the link read is not a valid link, exit from the command with a message */
        if (!externalLink && !noteLink) {
            const error = common_all_1.DendronError.createFromStatus({
                status: common_all_1.ERROR_STATUS.INVALID_STATE,
                message: `no valid path or URL selected`,
            });
            this.L.error({ error });
            return { error };
        }
        /* Depending on the link type selected, execute different command logic */
        if (noteLink) {
            return this.goToNoteLink(noteLink);
        }
        else {
            return this.goToExternalLink(externalLink);
        }
    }
    async goToNoteLink(noteLink) {
        const { vaults, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        // get vault
        let vault;
        const { anchorHeader, value: fname, vaultName } = noteLink;
        if (vaultName) {
            vault = common_all_1.VaultUtils.getVaultByNameOrThrow({
                vaults,
                vname: vaultName,
            });
        }
        // get note
        const notes = await engine.findNotesMeta({ fname, vault });
        if (notes.length === 0) {
            return {
                error: new common_all_1.DendronError({ message: "selection is not a note" }),
            };
        }
        // TODO: for now, get first note, in the future, show prompt
        const note = notes[0];
        // if note doesn't have url, run goto note command
        if (lodash_1.default.isUndefined(note.custom?.[GOTO_KEY])) {
            const resp = await new GotoNote_1.GotoNoteCommand(this._ext).execute({
                qs: note.fname,
                vault: note.vault,
                anchor: anchorHeader,
            });
            return { data: resp };
        }
        await this.openLink(note.custom[GOTO_KEY]);
        // we found a link
        return {
            data: {
                kind: GoToNoteInterface_1.TargetKind.LINK,
                fullPath: note.custom[GOTO_KEY],
                fromProxy: true,
            },
        };
    }
    async goToExternalLink(externalLink) {
        let assetPath;
        if (externalLink.indexOf(":/") !== -1 ||
            externalLink.indexOf("/") === 0 ||
            externalLink.indexOf(":\\") !== -1) {
            vscode_1.env.openExternal(vscode_1.Uri.parse(externalLink.replace("\\", "/"))); // make sure vscode doesn't choke on "\"s
            assetPath = externalLink;
        }
        else {
            const { wsRoot } = this._ext.getDWorkspace();
            if (externalLink.startsWith("asset")) {
                const vault = utils_1.PickerUtilsV2.getOrPromptVaultForOpenEditor();
                assetPath = path_1.default.join((0, common_server_1.vault2Path)({ vault, wsRoot }), externalLink);
            }
            else {
                assetPath = (0, common_server_1.resolvePath)(externalLink, (0, workspace_1.getExtension)().rootWorkspace.uri.fsPath);
            }
            if (!fs_1.default.existsSync(assetPath)) {
                const error = common_all_1.DendronError.createFromStatus({
                    status: common_all_1.ERROR_STATUS.INVALID_STATE,
                    message: `no valid path or URL selected`,
                });
                this.L.error({ error });
                return { error };
            }
            await (0, open_1.default)(assetPath).catch((err) => {
                const error = common_all_1.DendronError.createFromStatus({
                    status: common_all_1.ERROR_STATUS.UNKNOWN,
                    innerError: err,
                });
                this.L.error({ error });
                return { error };
            });
        }
        return {
            data: { kind: GoToNoteInterface_1.TargetKind.LINK, fullPath: assetPath, fromProxy: false },
        };
    }
    openLink(uri) {
        return new OpenLink_1.OpenLinkCommand().execute({ uri });
    }
}
exports.GotoCommand = GotoCommand;
//# sourceMappingURL=Goto.js.map