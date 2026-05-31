"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteCommand = void 0;
const common_all_1 = require("@dendronhq/common-all");
const unified_1 = require("@dendronhq/unified");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const markdown_it_1 = __importDefault(require("markdown-it"));
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const clientUtils_1 = require("../clientUtils");
const utils_1 = require("../components/lookup/utils");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const logger_1 = require("../logger");
const analytics_1 = require("../utils/analytics");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
function formatDeletedMsg({ fsPath, vault, }) {
    return `${path_1.default.basename(fsPath)} (${common_all_1.VaultUtils.getName(vault)}) deleted`;
}
class DeleteCommand extends base_1.InputArgCommand {
    key = constants_1.DENDRON_COMMANDS.DELETE.key;
    getBacklinkFrontmatterLineOffset(opts) {
        const { link, vaults, wsRoot } = opts;
        if (!link.from.fname || !link.from.vaultName) {
            throw new common_all_1.DendronError({
                message: `Link from location does not contain fname or vaultName: ${link.from}`,
                severity: common_all_1.ERROR_SEVERITY.MINOR,
            });
        }
        const vault = common_all_1.VaultUtils.getVaultByName({
            vaults,
            vname: link.from.vaultName,
        });
        const fsPath = common_all_1.DNodeUtils.getFullPath({
            wsRoot,
            vault,
            basename: link.from.fname + ".md",
        });
        const fileContent = fs_extra_1.default.readFileSync(fsPath).toString();
        const nodePosition = unified_1.RemarkUtils.getNodePositionPastFrontmatter(fileContent);
        return nodePosition?.end.line;
    }
    /**
     * When Delete Command is ran from explorer menu, it gets Uri as args
     */
    isUriArgs(opts) {
        return !lodash_1.default.isEmpty(opts) && opts.fsPath;
    }
    async deleteNote(params) {
        const { note, opts, engine, ctx } = params;
        const backlinks = note.links.filter((link) => link.type === "backlink");
        let title;
        if (backlinks.length === 0) {
            // no need to show preview a simple
            title = `Delete note ${note.fname}?`;
        }
        else {
            await this.showNoteDeletePreview(note, backlinks);
            title = `${note.fname} has backlinks. Delete note?`;
        }
        const shouldProceed = await this.promptConfirmation(title, opts?.noConfirm);
        if (!shouldProceed) {
            vscode_1.window.showInformationMessage("Cancelled");
            return;
        }
        // If Delete note preview is open, close it first
        if (backlinks.length !== 0) {
            await vsCodeUtils_1.VSCodeUtils.closeCurrentFileEditor();
        }
        const out = await engine.deleteNote(note.id);
        if (out.error) {
            logger_1.Logger.error({ ctx, msg: "error deleting node", error: out.error });
            return;
        }
        vscode_1.window.showInformationMessage(formatDeletedMsg({ fsPath: note.fname, vault: note.vault }));
        await vsCodeUtils_1.VSCodeUtils.closeCurrentFileEditor();
        return out;
    }
    async showNoteDeletePreview(note, backlinks) {
        let content = [
            "# Delete Node Preview",
            "```",
            `node type: note`,
            "",
            `# of backlinks to this note: ${backlinks.length}`,
            "```",
            "## Broken links after deletion",
            `These links will be broken after deleting **${note.fname}**`,
            "",
            `Make sure to convert the broken links listed below accordingly.`,
            "",
        ];
        const { wsRoot, engine } = ExtensionProvider_1.ExtensionProvider.getDWorkspace();
        const { vaults } = engine;
        lodash_1.default.forEach(lodash_1.default.sortBy(backlinks, ["from.vaultName"]), (backlink) => {
            const fmLineOffset = this.getBacklinkFrontmatterLineOffset({
                link: backlink,
                vaults,
                wsRoot,
            });
            const entry = [
                `- in **${backlink.from.vaultName}/${backlink.from.fname}**`,
                `  - line *${backlink.position.start.line + fmLineOffset}* column *${backlink.position?.start.column}*`,
                `  - alias: \`${backlink.alias ? backlink.alias : "None"}\``,
            ].join("\n");
            content = content.concat(entry);
        });
        const panel = vscode_1.window.createWebviewPanel("deleteNodeNoteDeletePreview", "Note Delete Preview", vscode_1.ViewColumn.One, {});
        panel.webview.html = (0, markdown_it_1.default)().render(content.join("\n"));
        return content.join("\n");
    }
    async promptConfirmation(title, noConfirm) {
        if (noConfirm)
            return true;
        const options = ["Proceed", "Cancel"];
        const resp = await vsCodeUtils_1.VSCodeUtils.showQuickPick(options, {
            title,
            placeHolder: "Proceed",
            ignoreFocusOut: true,
        });
        return resp === "Proceed";
    }
    async sanityCheck(opts) {
        if (lodash_1.default.isUndefined(vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()) && lodash_1.default.isEmpty(opts)) {
            return "No note currently open, and no note selected to open.";
        }
        return;
    }
    async execute(opts) {
        const engine = ExtensionProvider_1.ExtensionProvider.getEngine();
        const ctx = "DeleteNoteCommand";
        if (lodash_1.default.isString(opts)) {
            analytics_1.AnalyticsUtils.track(this.key, { source: "TreeView" });
            const response = await engine.getNoteMeta(opts);
            if (response.error) {
                throw new common_all_1.DendronError({
                    message: `Cannot find note with id: ${opts}`,
                    payload: response.error,
                    severity: common_all_1.ERROR_SEVERITY.MINOR,
                });
            }
            const out = await this.deleteNote({
                note: response.data,
                opts,
                engine,
                ctx,
            });
            return out;
        }
        else {
            const editor = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor();
            const fsPath = this.isUriArgs(opts)
                ? opts.fsPath
                : vsCodeUtils_1.VSCodeUtils.getFsPathFromTextEditor(editor);
            const mode = fsPath.endsWith(".md") ? "note" : "schema";
            const trimEnd = mode === "note" ? ".md" : ".schema.yml";
            const fname = path_1.default.basename(fsPath, trimEnd);
            if (mode === "note") {
                const vault = utils_1.PickerUtilsV2.getVaultForOpenEditor(fsPath);
                const note = (await engine.findNotesMeta({ fname, vault }))[0];
                const out = await this.deleteNote({ note, opts, engine, ctx });
                return out;
            }
            else {
                const smod = await clientUtils_1.DendronClientUtilsV2.getSchemaModByFname({
                    fname,
                    client: engine,
                });
                await engine.deleteSchema(common_all_1.SchemaUtils.getModuleRoot(smod).id);
                vscode_1.window.showInformationMessage(formatDeletedMsg({ fsPath, vault: smod.vault }));
                await vsCodeUtils_1.VSCodeUtils.closeCurrentFileEditor();
                return;
            }
        }
    }
}
exports.DeleteCommand = DeleteCommand;
//# sourceMappingURL=DeleteCommand.js.map