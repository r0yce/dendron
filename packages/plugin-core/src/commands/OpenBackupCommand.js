"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenBackupCommand = void 0;
const common_server_1 = require("@dendronhq/common-server");
const vscode_1 = require("vscode");
const vsCodeUtils_1 = require("../vsCodeUtils");
const constants_1 = require("../constants");
const base_1 = require("./base");
const path_1 = __importDefault(require("path"));
class OpenBackupCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.OPEN_BACKUP.key;
    extension;
    constructor(ext) {
        super();
        this.extension = ext;
    }
    async promptBackupEntrySelection(opts) {
        const { backups } = opts;
        const options = backups.map((backupName) => {
            return {
                label: backupName,
            };
        });
        const selectedBackupName = await vsCodeUtils_1.VSCodeUtils.showQuickPick(options, {
            title: "Pick which backup file you want to open.",
            ignoreFocusOut: true,
            canPickMany: false,
        });
        return selectedBackupName;
    }
    async promptBackupKeySelection(opts) {
        const { allBackups, backupService } = opts;
        const options = allBackups
            .filter((keyEntry) => {
            return keyEntry.backups.length > 0;
        })
            .map((keyEntry) => {
            return {
                label: keyEntry.key,
                detail: `${keyEntry.backups.length} backup(s)`,
            };
        });
        if (options.length > 0) {
            const backupKey = await vsCodeUtils_1.VSCodeUtils.showQuickPick(options, {
                title: "Pick which kind of backup you want to open.",
                ignoreFocusOut: true,
                canPickMany: false,
            });
            if (backupKey) {
                const selected = allBackups.find((keyEntry) => {
                    return keyEntry.key === backupKey.label;
                });
                if (selected) {
                    const selectedBackupName = await this.promptBackupEntrySelection({
                        backups: selected.backups,
                    });
                    if (selectedBackupName) {
                        const backupFile = await vscode_1.workspace.openTextDocument(vscode_1.Uri.file(path_1.default.join(backupService.backupRoot, selected.key, selectedBackupName.label)));
                        await vscode_1.window.showTextDocument(backupFile);
                    }
                    else {
                        vscode_1.window.showInformationMessage("No backup selected.");
                    }
                }
                else {
                    vscode_1.window.showInformationMessage("There are no backups saved for this key.");
                }
            }
        }
        else {
            vscode_1.window.showInformationMessage("There are no backups saved.");
        }
    }
    async execute(opts) {
        const ws = this.extension.getDWorkspace();
        const backupService = new common_server_1.BackupService({ wsRoot: ws.wsRoot });
        try {
            const ctx = "execute";
            this.L.info({ ctx, opts });
            const allBackups = backupService.getAllBackups();
            await this.promptBackupKeySelection({ allBackups, backupService });
        }
        finally {
            backupService.dispose();
        }
    }
}
exports.OpenBackupCommand = OpenBackupCommand;
//# sourceMappingURL=OpenBackupCommand.js.map