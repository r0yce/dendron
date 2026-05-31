"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorCommand = exports.PluginDoctorActionsEnum = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const lodash_1 = __importDefault(require("lodash"));
const markdown_it_1 = __importDefault(require("markdown-it"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const vscode_1 = require("vscode");
const buttons_1 = require("../components/doctor/buttons");
const constants_1 = require("../constants");
const windowDecorations_1 = require("../features/windowDecorations");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
const ReloadIndex_1 = require("./ReloadIndex");
const analytics_1 = require("../utils/analytics");
const KeybindingUtils_1 = require("../KeybindingUtils");
const HierarchySelector_1 = require("../components/lookup/HierarchySelector");
const PodControls_1 = require("../components/pods/PodControls");
const unified_1 = require("@dendronhq/unified");
const common_server_1 = require("@dendronhq/common-server");
const md = (0, markdown_it_1.default)();
var PluginDoctorActionsEnum;
(function (PluginDoctorActionsEnum) {
    PluginDoctorActionsEnum["FIND_INCOMPATIBLE_EXTENSIONS"] = "findIncompatibleExtensions";
    PluginDoctorActionsEnum["FIX_KEYBINDING_CONFLICTS"] = "fixKeybindingConflicts";
})(PluginDoctorActionsEnum || (exports.PluginDoctorActionsEnum = PluginDoctorActionsEnum = {}));
// Only reload the workspace for these commands
//  ^2z4m76v2e2xo
const RELOAD_BEFORE_ACTIONS = [
    engine_server_1.DoctorActionsEnum.FIX_FRONTMATTER,
    engine_server_1.DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES,
];
const RELOAD_AFTER_ACTIONS = [
    engine_server_1.DoctorActionsEnum.FIX_FRONTMATTER,
    engine_server_1.DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES,
];
function shouldDoctorReloadWorkspaceBeforeDoctorAction(action) {
    return RELOAD_BEFORE_ACTIONS.includes(action);
}
function shouldDoctorReloadWorkspaceAfterDoctorAction(action) {
    return RELOAD_AFTER_ACTIONS.includes(action);
}
class DoctorCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.DOCTOR.key;
    extension;
    constructor(ext) {
        super();
        this.extension = ext;
    }
    getHierarchy() {
        return new HierarchySelector_1.QuickPickHierarchySelector().getHierarchy();
    }
    createQuickPick(opts) {
        const { title, placeholder, ignoreFocusOut, items } = lodash_1.default.defaults(opts, {
            ignoreFocusOut: true,
        });
        const quickPick = vsCodeUtils_1.VSCodeUtils.createQuickPick();
        quickPick.title = title;
        quickPick.placeholder = placeholder;
        quickPick.ignoreFocusOut = ignoreFocusOut;
        quickPick.items = items;
        quickPick.buttons = opts.buttons;
        return quickPick;
    }
    onTriggerButton = async (quickpick) => {
        if (!quickpick) {
            return;
        }
        const button = quickpick.buttons[0];
        button.pressed = !button.pressed;
        button.type = button.type === "workspace" ? "file" : "workspace";
        quickpick.buttons = [button];
        quickpick.title = `Doctor (${button.type})`;
    };
    async gatherInputs(inputs) {
        // If inputs are already provided, don't ask the user.
        if (inputs && inputs.action && inputs.scope)
            return inputs;
        // eslint-disable-next-line no-async-promise-executor
        const out = new Promise(async (resolve) => {
            const doctorActionQuickPickItems = lodash_1.default.map(engine_server_1.DoctorActionsEnum, (ent) => {
                return { label: ent };
            });
            const pluginDoctorActionQuickPickItems = lodash_1.default.map(PluginDoctorActionsEnum, (ent) => {
                return { label: ent };
            });
            const allDoctorActionQuickPickItems = doctorActionQuickPickItems.concat(pluginDoctorActionQuickPickItems);
            const changeScopeButton = buttons_1.ChangeScopeBtn.create(false);
            const quickPick = this.createQuickPick({
                title: "Doctor",
                placeholder: "Select a Doctor Action.",
                items: allDoctorActionQuickPickItems,
                buttons: [changeScopeButton],
            });
            const scope = quickPick.buttons[0].type;
            quickPick.title = `Doctor (${scope})`;
            quickPick.onDidAccept(async () => {
                quickPick.hide();
                const doctorAction = quickPick.selectedItems[0].label;
                const doctorScope = quickPick.buttons[0]
                    .type;
                return resolve({
                    action: doctorAction,
                    scope: doctorScope,
                });
            });
            quickPick.onDidTriggerButton(() => this.onTriggerButton(quickPick));
            quickPick.show();
        });
        return out;
    }
    async showMissingNotePreview(candidates) {
        let content = [
            "# Create Missing Linked Notes Preview",
            "",
            `## The following files will be created`,
        ];
        lodash_1.default.forEach(lodash_1.default.sortBy(candidates, ["vault.fsPath"]), (candidate) => {
            content = content.concat(`- ${candidate.vault.fsPath}/${candidate.fname}\n`);
        });
        const panel = vscode_1.window.createWebviewPanel("doctorCreateMissingLinkedNotesPreview", "Create MissingLinked Notes Preview", vscode_1.ViewColumn.One, {});
        panel.webview.html = md.render(content.join("\n"));
    }
    async showBrokenLinkPreview(brokenLinks, engine) {
        let content = [
            "# Broken Links Preview",
            "",
            `## The following files have broken links`,
        ];
        const { vaults, wsRoot } = engine;
        lodash_1.default.forEach(lodash_1.default.sortBy(brokenLinks, ["file"]), (ent) => {
            content = content.concat(`${ent.file}\n`);
            const vault = common_all_1.VaultUtils.getVaultByName({
                vaults,
                vname: ent.vault,
            });
            const fsPath = common_all_1.DNodeUtils.getFullPath({
                wsRoot,
                vault,
                basename: ent.file + ".md",
            });
            const fileContent = fs_extra_1.default.readFileSync(fsPath).toString();
            const nodePosition = unified_1.RemarkUtils.getNodePositionPastFrontmatter(fileContent);
            ent.links.forEach((link) => {
                content = content.concat(`- ${link.value} at line ${link.line + nodePosition.end.line} column ${link.column}\n`);
            });
        });
        const panel = vscode_1.window.createWebviewPanel("doctorBrokenLinksPreview", "Create Broken Links Preview", vscode_1.ViewColumn.One, {});
        panel.webview.html = md.render(content.join("\n"));
    }
    async showIncompatibleExtensionPreview(opts) {
        const { installStatus } = opts;
        const contents = [
            "# Extensions that are incompatible with Dendron.",
            "",
            "The extensions listed below are known to be incompatible with Dendron.",
            "",
            "Neither Dendron nor the extension may function properly when installed concurrently.",
            "",
            "Consider disabling the incompatible extensions when in a Dendron Workspace.",
            "  - [How to disable extensions for a specific workspace without uninstalling](https://code.visualstudio.com/docs/editor/extension-marketplace#_disable-an-extension)",
            "",
            "See [Incompatible Extensions](https://wiki.dendron.so/notes/9Id5LUZFfM1m9djl6KgpP) for more details.",
            "",
            "## Incompatible Extensions: ",
            "",
            "||||",
            "|-|-|-|",
            installStatus
                .map((status) => {
                const commandArgs = `"@id:${status.id}"`;
                const commandUri = vscode_1.Uri.parse(`command:workbench.extensions.search?${JSON.stringify(commandArgs)}`);
                const message = status.installed
                    ? `[View Extension](${commandUri})`
                    : "Not Installed";
                return `| ${status.id} | | ${message} | `;
            })
                .join("\n"),
            "",
        ].join("\n");
        const panel = vscode_1.window.createWebviewPanel("incompatibleExtensionsPreview", "Incompatible Extensions", vscode_1.ViewColumn.One, {
            enableCommandUris: true,
        });
        panel.webview.html = md.render(contents);
        analytics_1.AnalyticsUtils.track(common_all_1.ExtensionEvents.IncompatibleExtensionsPreviewDisplayed);
        return { installStatus, contents };
    }
    async showFixInvalidFileNamePreview(opts) {
        const { canRename, cantRename } = opts;
        const canRenameContent = canRename.length > 0
            ? [
                "These notes have invalid filenames and can be automatically fixed:",
                "",
                "| file name || change to | reason |",
                "|-|-|-|-|",
                canRename
                    .map((item) => {
                    const { note, resp, cleanedFname } = item;
                    return `| \`${note.fname}\` || __${cleanedFname}__ | ${resp.reason} |`;
                })
                    .join("\n"),
            ].join("\n")
            : "";
        const cantRenameContent = cantRename.length > 0
            ? [
                "These notes have invalid filenames but cannot be automatically fixed because it will create duplicate notes with same file names.",
                "",
                "Please review them and rename manually:",
                "",
                "| file name || change to | reason |",
                "|-|-|-|-|",
                cantRename
                    .map((item) => {
                    const { note, resp, cleanedFname } = item;
                    return `| \`${note.fname}\`|| __${cleanedFname}__ | ${resp.reason} |`;
                })
                    .join("\n"),
                "",
            ].join("\n")
            : "";
        const contents = [
            "# Fix Invalid Filenames",
            "",
            "The notes listed below are invalid.",
            "",
            "Please see [Restrictions](https://wiki.dendron.so/notes/v21pacjod0eqgdhb7zo7fvw) to learn more about file name restrictions.",
            "",
            "***",
            canRenameContent,
            "",
            cantRenameContent,
            "",
        ].join("\n");
        const panel = vscode_1.window.createWebviewPanel("invalidFileNamesPreview", "Invalid Filenames", vscode_1.ViewColumn.One, {
            enableCommandUris: true,
        });
        panel.webview.html = md.render(contents);
    }
    async reload() {
        const engine = await new ReloadIndex_1.ReloadIndexCommand().execute();
        if (lodash_1.default.isUndefined(engine)) {
            throw new common_all_1.DendronError({ message: "no engine found." });
        }
        return engine;
    }
    addAnalyticsPayload(opts, out) {
        let payload = {
            action: opts.action,
            scope: opts.scope,
        };
        if (out.extra) {
            switch (opts.action) {
                case engine_server_1.DoctorActionsEnum.FIX_INVALID_FILENAMES: {
                    payload = {
                        ...payload,
                        ...out.extra,
                    };
                    break;
                }
                default: {
                    break;
                }
            }
        }
        return payload;
    }
    async execute(opts) {
        const ctx = "DoctorCommand:execute";
        vscode_1.window.showInformationMessage("Calling the doctor.");
        const { wsRoot, config } = this.extension.getDWorkspace();
        const findings = [];
        let extra;
        if (lodash_1.default.isUndefined(wsRoot)) {
            throw new common_all_1.DendronError({ message: "rootDir undefined" });
        }
        if (lodash_1.default.isUndefined(config)) {
            throw new common_all_1.DendronError({ message: "no config found" });
        }
        if (this.extension.fileWatcher) {
            this.extension.fileWatcher.pause = true;
        }
        // Make sure to save any changes in the file because Doctor reads them from
        // disk, and won't see changes that haven't been saved.
        let note;
        if (opts.data?.note) {
            note = opts.data.note;
        }
        else {
            const document = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document;
            if ((0, common_all_1.isNotUndefined)(document) &&
                (0, common_all_1.isNotUndefined)(await this.extension.wsUtils.getNoteFromDocument(document))) {
                await document.save();
            }
            this.L.info({ ctx, msg: "pre:Reload" });
            if (shouldDoctorReloadWorkspaceBeforeDoctorAction(opts.action)) {
                await this.reload();
            }
            if (opts.scope === "file") {
                const document = vsCodeUtils_1.VSCodeUtils.getActiveTextEditor()?.document;
                if (lodash_1.default.isUndefined(document)) {
                    throw new common_all_1.DendronError({ message: "No note open." });
                }
                note = await this.extension.wsUtils.getNoteFromDocument(document);
            }
        }
        const engine = this.extension.getEngine();
        switch (opts.action) {
            case PluginDoctorActionsEnum.FIND_INCOMPATIBLE_EXTENSIONS: {
                const installStatus = opts.data?.installStatus ||
                    constants_1.INCOMPATIBLE_EXTENSIONS.map((ext) => {
                        return {
                            id: ext,
                            installed: vsCodeUtils_1.VSCodeUtils.isExtensionInstalled(ext),
                        };
                    });
                await this.showIncompatibleExtensionPreview({ installStatus });
                break;
            }
            case PluginDoctorActionsEnum.FIX_KEYBINDING_CONFLICTS: {
                const conflicts = KeybindingUtils_1.KeybindingUtils.getConflictingKeybindings({
                    knownConflicts: constants_1.KNOWN_KEYBINDING_CONFLICTS,
                });
                if (conflicts.length > 0) {
                    await KeybindingUtils_1.KeybindingUtils.showKeybindingConflictPreview({ conflicts });
                    analytics_1.AnalyticsUtils.track(common_all_1.ExtensionEvents.KeybindingConflictDetected, {
                        source: common_all_1.KeybindingConflictDetectedSource.doctor,
                    });
                }
                else {
                    vscode_1.window.showInformationMessage(`There are no keybinding conflicts!`);
                }
                break;
            }
            case engine_server_1.DoctorActionsEnum.FIX_FRONTMATTER: {
                await new engine_server_1.BackfillService().updateNotes({
                    engine,
                    note,
                    // fix notes with broken ids if necessary
                    overwriteFields: ["id"],
                });
                break;
            }
            case engine_server_1.DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES: {
                let notes;
                if (lodash_1.default.isUndefined(note)) {
                    notes = await engine.findNotes({ excludeStub: true });
                }
                else {
                    notes = [note];
                }
                const ds = new engine_server_1.DoctorService();
                const uniqueCandidates = ds.getBrokenLinkDestinations(notes, engine);
                if (uniqueCandidates.length > 0) {
                    // show preview before creating
                    await this.showMissingNotePreview(uniqueCandidates);
                    const options = ["proceed", "cancel"];
                    const shouldProceed = await vsCodeUtils_1.VSCodeUtils.showQuickPick(options, {
                        placeHolder: "proceed",
                        ignoreFocusOut: true,
                    });
                    if (shouldProceed !== "proceed") {
                        vscode_1.window.showInformationMessage("cancelled");
                        break;
                    }
                    vscode_1.window.showInformationMessage("creating missing links...");
                    if (this.extension.fileWatcher) {
                        this.extension.fileWatcher.pause = true;
                    }
                    await ds.executeDoctorActions({
                        action: opts.action,
                        candidates: notes,
                        engine,
                        exit: false,
                    });
                }
                else {
                    vscode_1.window.showInformationMessage(`There are no missing links!`);
                }
                ds.dispose();
                if (this.extension.fileWatcher) {
                    this.extension.fileWatcher.pause = false;
                }
                break;
            }
            case engine_server_1.DoctorActionsEnum.FIND_BROKEN_LINKS: {
                let notes;
                if (lodash_1.default.isUndefined(note)) {
                    notes = await engine.findNotes({ excludeStub: true });
                }
                else {
                    notes = [note];
                }
                const ds = new engine_server_1.DoctorService();
                const out = await ds.executeDoctorActions({
                    action: opts.action,
                    candidates: notes,
                    engine,
                    exit: false,
                    quiet: true,
                });
                ds.dispose();
                if (out.resp.length === 0) {
                    vscode_1.window.showInformationMessage(`There are no broken links!`);
                    break;
                }
                await this.showBrokenLinkPreview(out.resp, engine);
                break;
            }
            case engine_server_1.DoctorActionsEnum.FIX_AIRTABLE_METADATA: {
                const selection = await this.getHierarchy();
                // break if no hierarchy is selected.
                if (!selection)
                    break;
                // get hierarchy of notes to be updated
                const { hierarchy, vault } = selection;
                // get podId used to export the notes
                const podId = await PodControls_1.PodUIControls.promptToSelectCustomPodId();
                if (!podId)
                    break;
                const ds = new engine_server_1.DoctorService();
                await ds.executeDoctorActions({
                    action: opts.action,
                    engine,
                    podId,
                    hierarchy,
                    vault,
                });
                break;
            }
            case engine_server_1.DoctorActionsEnum.REMOVE_DEPRECATED_CONFIGS:
            case engine_server_1.DoctorActionsEnum.ADD_MISSING_DEFAULT_CONFIGS: {
                const ds = new engine_server_1.DoctorService();
                const out = await ds.executeDoctorActions({
                    action: opts.action,
                    engine,
                });
                if (out.error) {
                    vscode_1.window.showErrorMessage(out.error.message);
                }
                if (out.resp) {
                    const OPEN_CONFIG = "Open dendron.yml and Backup";
                    const message = opts.action === engine_server_1.DoctorActionsEnum.REMOVE_DEPRECATED_CONFIGS
                        ? `Deprecated configs removed. Backup of dendron.yml created in ${out.resp.backupPath}`
                        : `Missing defaults added. Backup of dendron.yml created in ${out.resp.backupPath}`;
                    vscode_1.window
                        .showInformationMessage(message, OPEN_CONFIG)
                        .then(async (resp) => {
                        if (resp === OPEN_CONFIG) {
                            const configPath = common_server_1.DConfig.configPath(wsRoot);
                            const configUri = vscode_1.Uri.file(configPath);
                            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(configUri);
                            const backupUri = vscode_1.Uri.file(out.resp.backupPath);
                            await vsCodeUtils_1.VSCodeUtils.openFileInEditor(backupUri, {
                                column: vscode_1.ViewColumn.Beside,
                            });
                        }
                    });
                    break;
                }
                else {
                    // nothing happened.
                    const message = opts.action === engine_server_1.DoctorActionsEnum.REMOVE_DEPRECATED_CONFIGS
                        ? "There are no deprecated configs. Exiting."
                        : "There are no missing defaults. Exiting";
                    vscode_1.window.showInformationMessage(message);
                }
                ds.dispose();
                break;
            }
            case engine_server_1.DoctorActionsEnum.FIX_INVALID_FILENAMES: {
                const ds = new engine_server_1.DoctorService();
                const notes = await engine.queryNotes({ qs: "*", originalQS: "*" });
                if (notes.length !== 0) {
                    const notesById = common_all_1.NoteDictsUtils.createNotePropsByIdDict(notes);
                    const notesByFname = common_all_1.NoteFnameDictUtils.createNotePropsByFnameDict(notesById);
                    const noteDicts = { notesById, notesByFname };
                    const { canRename, cantRename, stats } = ds.findInvalidFileNames({
                        notes,
                        noteDicts,
                    });
                    extra = stats;
                    let changes = [];
                    if (canRename.length > 0 || cantRename.length > 0) {
                        await this.showFixInvalidFileNamePreview({ canRename, cantRename });
                        if (canRename.length > 0) {
                            const options = ["proceed", "cancel"];
                            const shouldProceed = await vsCodeUtils_1.VSCodeUtils.showQuickPick(options, {
                                placeHolder: "proceed",
                                ignoreFocusOut: true,
                            });
                            if (shouldProceed !== "proceed") {
                                vscode_1.window.showInformationMessage("cancelled");
                                break;
                            }
                            vscode_1.window.showInformationMessage("Fixing invalid filenames...");
                            changes = await ds.fixInvalidFileNames({
                                canRename,
                                engine,
                            });
                            const maybeReminder = cantRename.length > 0
                                ? " Don't forget to manually rename invalid notes that cannot be automatically fixed."
                                : "";
                            vscode_1.window.showInformationMessage(`Invalid filenames fixed.${maybeReminder}`);
                        }
                    }
                    else {
                        vscode_1.window.showInformationMessage("There are no invalid filenames!");
                    }
                    ds.dispose();
                    const changeCounts = (0, common_all_1.extractNoteChangeEntryCounts)(changes);
                    extra = {
                        ...extra,
                        ...changeCounts,
                    };
                }
                else {
                    vscode_1.window.showErrorMessage("Doctor failed. Please reload and try again");
                }
                break;
            }
            default: {
                const candidates = lodash_1.default.isUndefined(note)
                    ? undefined
                    : [note];
                const ds = new engine_server_1.DoctorService();
                await ds.executeDoctorActions({
                    action: opts.action,
                    candidates,
                    engine,
                    exit: false,
                });
                ds.dispose();
            }
        }
        if (this.extension.fileWatcher) {
            this.extension.fileWatcher.pause = false;
        }
        if (shouldDoctorReloadWorkspaceAfterDoctorAction(opts.action)) {
            await this.reload();
            // Decorations don't auto-update here, I think because the contents of the
            // note haven't updated within VSCode yet. Regenerate the decorations, but
            // do so after a delay so that VSCode can update the file contents. Not a
            // perfect solution, but the simplest.
            (0, windowDecorations_1.delayedUpdateDecorations)();
        }
        return { data: findings, extra };
    }
    async showResponse(findings) {
        findings.data.forEach((f) => {
            vscode_1.window.showInformationMessage(`issue: ${f.issue}. fix: ${f.fix}`);
        });
        vscode_1.window.showInformationMessage(`Doctor finished checkup 🍭`);
    }
}
exports.DoctorCommand = DoctorCommand;
//# sourceMappingURL=Doctor.js.map