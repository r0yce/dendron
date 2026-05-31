"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrateSelfContainedVaultCommand = exports.MigrateVaultContinueOption = void 0;
const common_all_1 = require("@dendronhq/common-all");
const engine_server_1 = require("@dendronhq/engine-server");
const constants_1 = require("../constants");
const ExtensionProvider_1 = require("../ExtensionProvider");
const vsCodeUtils_1 = require("../vsCodeUtils");
const base_1 = require("./base");
var MigrateVaultContinueOption;
(function (MigrateVaultContinueOption) {
    MigrateVaultContinueOption["continue"] = "continue";
    MigrateVaultContinueOption["cancel"] = "cancel";
})(MigrateVaultContinueOption || (exports.MigrateVaultContinueOption = MigrateVaultContinueOption = {}));
class MigrateSelfContainedVaultCommand extends base_1.BasicCommand {
    key = constants_1.DENDRON_COMMANDS.MIGRATE_SELF_CONTAINED.key;
    extension;
    async sanityCheck(opts) {
        if (opts?.vault && common_all_1.VaultUtils.isSelfContained(opts.vault)) {
            return "Already a self contained vault";
        }
        return undefined;
    }
    constructor(ext) {
        super();
        this.extension = ext;
    }
    async gatherInputs(opts) {
        if (opts === undefined)
            opts = {};
        if (opts.vault === undefined) {
            const nonSCVaults = this.extension
                .getDWorkspace()
                .vaults.filter((vault) => !common_all_1.VaultUtils.isSelfContained(vault) && !vault.seed);
            if (nonSCVaults.length === 0) {
                throw new common_all_1.DendronError({
                    message: "There are no vaults that can be migrated to self contained vaults right now.",
                });
            }
            const vault = await vsCodeUtils_1.VSCodeUtils.showQuickPick(nonSCVaults.map((vault) => {
                return {
                    label: common_all_1.VaultUtils.getName(vault),
                    description: common_all_1.VaultUtils.getRelPath(vault),
                };
            }), {
                ignoreFocusOut: true,
                canPickMany: false,
                matchOnDescription: true,
                title: "Select vault to migrate to self contained vault format",
            });
            // Dismissed prompt
            if (!vault)
                return undefined;
            opts.vault = common_all_1.VaultUtils.getVaultByNameOrThrow({
                vaults: nonSCVaults,
                vname: vault.label,
            });
        }
        const cont = await vsCodeUtils_1.VSCodeUtils.showQuickPick([
            {
                label: MigrateVaultContinueOption.continue,
                detail: "I have backed up my notes",
            },
            {
                label: MigrateVaultContinueOption.cancel,
            },
        ], {
            canPickMany: false,
            title: "Please back up your notes before you continue",
            ignoreFocusOut: true,
        });
        if (cont?.label !== MigrateVaultContinueOption.continue)
            return undefined;
        return opts;
    }
    async execute(opts) {
        const { vault } = opts;
        if (!vault)
            return { newVault: null };
        const ws = new engine_server_1.WorkspaceService({
            wsRoot: ExtensionProvider_1.ExtensionProvider.getDWorkspace().wsRoot,
        });
        const newVault = await ws.migrateVaultToSelfContained({ vault });
        ws.dispose();
        vsCodeUtils_1.VSCodeUtils.reloadWindow();
        return { newVault };
    }
}
exports.MigrateSelfContainedVaultCommand = MigrateSelfContainedVaultCommand;
//# sourceMappingURL=MigrateSelfContainedVault.js.map