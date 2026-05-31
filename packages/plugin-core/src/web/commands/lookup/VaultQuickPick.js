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
exports.VaultQuickPick = void 0;
const common_all_1 = require("@dendronhq/common-all");
const lodash_1 = __importDefault(require("lodash"));
const types_1 = require("../../../components/lookup/types");
const vscode = __importStar(require("vscode"));
class VaultQuickPick {
    CONTEXT_DETAIL = "current note context";
    HIERARCHY_MATCH_DETAIL = "hierarchy match";
    FULL_MATCH_DETAIL = "hierarchy match and current note context";
    _engine;
    constructor(engine) {
        this._engine = engine;
    }
    async getOrPromptVaultForNewNote({ vault, fname, vaults, vaultSelectionMode = types_1.VaultSelectionMode.smart, }) {
        const vaultSuggestions = await this.getVaultRecommendations({
            vault,
            vaults,
            fname,
        });
        if (vaultSuggestions?.length === 1 ||
            vaultSelectionMode === types_1.VaultSelectionMode.auto) {
            return vaultSuggestions[0].vault;
        }
        // Auto select for the user if either the hierarchy pattern matches in the
        // current vault context, or if there are no hierarchy matches
        if (vaultSelectionMode === types_1.VaultSelectionMode.smart) {
            if (vaultSuggestions[0].detail === this.FULL_MATCH_DETAIL ||
                vaultSuggestions[0].detail === this.CONTEXT_DETAIL) {
                return vaultSuggestions[0].vault;
            }
        }
        return this.promptVault(vaultSuggestions);
    }
    /**
     * Determine which vault(s) are the most appropriate to create this note in.
     * Vaults determined as better matches appear earlier in the returned array
     * @param
     * @returns
     */
    async getVaultRecommendations({ vault, vaults, fname, }) {
        // TODO: Filter out any vaults where a note with that fname already exists.
        let vaultSuggestions = [];
        // Only 1 vault, no other options to choose from:
        if (vaults.length <= 1) {
            return Array.of({ vault: vaults[0], label: common_all_1.VaultUtils.getName(vault) });
        }
        const domain = fname.split(".").slice(0, -1);
        const newQs = domain.join(".");
        const queryResponse = await this._engine.queryNotes({
            qs: newQs,
            originalQS: newQs,
            createIfNew: false,
        });
        // Sort Alphabetically by the Path Name
        const sortByPathNameFn = (a, b) => {
            return a.fsPath <= b.fsPath ? -1 : 1;
        };
        let allVaults = vaults.sort(sortByPathNameFn);
        const vaultsWithMatchingHierarchy = queryResponse
            .filter((value) => value.fname === newQs)
            .map((value) => value.vault)
            .sort(sortByPathNameFn)
            .map((value) => {
            return {
                vault: value,
                detail: this.HIERARCHY_MATCH_DETAIL,
                label: common_all_1.VaultUtils.getName(value),
            };
        });
        if (!vaultsWithMatchingHierarchy) {
            // Suggest current vault context as top suggestion
            vaultSuggestions.push({
                vault,
                detail: this.CONTEXT_DETAIL,
                label: common_all_1.VaultUtils.getName(vault),
            });
            allVaults.forEach((cmpVault) => {
                if (cmpVault !== vault) {
                    vaultSuggestions.push({
                        vault: cmpVault,
                        label: common_all_1.VaultUtils.getName(vault),
                    });
                }
            });
        }
        // One of the vaults with a matching hierarchy is also the current note context:
        else if (vaultsWithMatchingHierarchy.find((value) => value.vault.fsPath === vault.fsPath) !== undefined) {
            // Prompt with matching hierarchies & current context, THEN other matching contexts; THEN any other vaults
            vaultSuggestions.push({
                vault,
                detail: this.FULL_MATCH_DETAIL,
                label: common_all_1.VaultUtils.getName(vault),
            });
            // remove from allVaults the one we already pushed.
            allVaults = lodash_1.default.filter(allVaults, (v) => {
                return !lodash_1.default.isEqual(v, vault);
            });
            vaultsWithMatchingHierarchy.forEach((ent) => {
                if (!vaultSuggestions.find((suggestion) => suggestion.vault.fsPath === ent.vault.fsPath)) {
                    vaultSuggestions.push({
                        vault: ent.vault,
                        detail: this.HIERARCHY_MATCH_DETAIL,
                        label: common_all_1.VaultUtils.getName(ent.vault),
                    });
                    // remove from allVaults the one we already pushed.
                    allVaults = lodash_1.default.filter(allVaults, (v) => {
                        return !lodash_1.default.isEqual(v, ent.vault);
                    });
                }
            });
            // push the rest of the vaults
            allVaults.forEach((wsVault) => {
                vaultSuggestions.push({
                    vault: wsVault,
                    label: common_all_1.VaultUtils.getName(wsVault),
                });
            });
        }
        else {
            // Suggest vaults with matching hierarchy, THEN current note context, THEN any other vaults
            vaultSuggestions = vaultSuggestions.concat(vaultsWithMatchingHierarchy);
            vaultSuggestions.push({
                vault,
                detail: this.CONTEXT_DETAIL,
                label: common_all_1.VaultUtils.getName(vault),
            });
            allVaults = lodash_1.default.filter(allVaults, (v) => {
                return !lodash_1.default.isEqual(v, vault);
            });
            allVaults.forEach((wsVault) => {
                vaultSuggestions.push({
                    vault: wsVault,
                    label: common_all_1.VaultUtils.getName(wsVault),
                });
            });
        }
        return vaultSuggestions;
    }
    async promptVault(pickerItems) {
        const items = pickerItems.map((ent) => ({
            ...ent,
            label: ent.label ? ent.label : ent.vault.fsPath,
        }));
        const resp = await vscode.window.showQuickPick(items, {
            title: "Select Vault",
        });
        return resp ? resp.vault : undefined;
    }
}
exports.VaultQuickPick = VaultQuickPick;
//# sourceMappingURL=VaultQuickPick.js.map