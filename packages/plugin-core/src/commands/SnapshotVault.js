"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapshotVaultCommand = void 0;
const pods_core_1 = require("@dendronhq/pods-core");
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const base_1 = require("./base");
class SnapshotVaultCommand extends base_1.BaseCommand {
    _ext;
    key = constants_1.DENDRON_COMMANDS.SNAPSHOT_VAULT.key;
    constructor(_ext) {
        super();
        this._ext = _ext;
    }
    async gatherInputs() {
        return {};
    }
    async enrichInputs(_inputs) {
        return {};
    }
    async execute(_opts) {
        const pod = new pods_core_1.SnapshotExportPod();
        const { engine } = this._ext.getDWorkspace();
        const vault = engine.vaults[0];
        const { wsRoot } = this._ext.getDWorkspace();
        const { data: snapshotDirPath } = await pod.execute({
            vaults: [vault],
            wsRoot,
            engine,
            // @ts-ignore
            config: {},
        });
        vscode_1.window.showInformationMessage(`snapshot made to ${snapshotDirPath}`);
        return { snapshotDirPath };
    }
}
exports.SnapshotVaultCommand = SnapshotVaultCommand;
//# sourceMappingURL=SnapshotVault.js.map