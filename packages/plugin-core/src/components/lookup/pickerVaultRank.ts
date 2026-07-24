/**
 * Pure vault-ranking for lookup create-new (no VS Code / engine deps).
 */
import { DVault, VaultUtils } from "@dendronhq/common-all";
import _ from "lodash";
import {
  CONTEXT_DETAIL,
  FULL_MATCH_DETAIL,
  HIERARCHY_MATCH_DETAIL,
} from "./vaultPickerConstants";

/** Local structural type (no vscode import). */
export type VaultPickerItem = {
  vault: DVault;
  label: string;
  detail?: string;
};

/**
 * Pure ranking of vault suggestions given hierarchy matches.
 * Testable without engine/VS Code.
 *
 * Order priorities:
 * 1. FULL_MATCH (context vault also has hierarchy match)
 * 2. HIERARCHY_MATCH other vaults
 * 3. CONTEXT_DETAIL (active vault, no hierarchy match)
 * 4. remaining vaults alphabetically by fsPath
 */
export function rankVaultSuggestions(opts: {
  contextVault: DVault;
  allVaults: DVault[];
  hierarchyMatchVaults: DVault[];
}): VaultPickerItem[] {
  const { contextVault, hierarchyMatchVaults } = opts;
  let allVaults = [...opts.allVaults].sort((a, b) =>
    a.fsPath <= b.fsPath ? -1 : 1
  );
  const hierarchyItems: VaultPickerItem[] = hierarchyMatchVaults
    .slice()
    .sort((a, b) => (a.fsPath <= b.fsPath ? -1 : 1))
    .map((value) => ({
      vault: value,
      detail: HIERARCHY_MATCH_DETAIL,
      label: VaultUtils.getName(value),
    }));

  let vaultSuggestions: VaultPickerItem[] = [];
  const contextInHierarchy = hierarchyItems.find(
    (value) => value.vault.fsPath === contextVault.fsPath
  );

  if (hierarchyItems.length === 0) {
    vaultSuggestions.push({
      vault: contextVault,
      detail: CONTEXT_DETAIL,
      label: VaultUtils.getName(contextVault),
    });
    allVaults.forEach((cmpVault) => {
      if (cmpVault.fsPath !== contextVault.fsPath) {
        vaultSuggestions.push({
          vault: cmpVault,
          label: VaultUtils.getName(cmpVault),
        });
      }
    });
    return vaultSuggestions;
  }

  if (contextInHierarchy) {
    vaultSuggestions.push({
      vault: contextVault,
      detail: FULL_MATCH_DETAIL,
      label: VaultUtils.getName(contextVault),
    });
    allVaults = _.filter(
      allVaults,
      (v) => v.fsPath !== contextVault.fsPath
    );
    hierarchyItems.forEach((ent) => {
      if (
        !vaultSuggestions.find(
          (suggestion) => suggestion.vault.fsPath === ent.vault.fsPath
        )
      ) {
        vaultSuggestions.push({
          vault: ent.vault,
          detail: HIERARCHY_MATCH_DETAIL,
          label: VaultUtils.getName(ent.vault),
        });
        allVaults = _.filter(
          allVaults,
          (v) => v.fsPath !== ent.vault.fsPath
        );
      }
    });
    allVaults.forEach((wsVault) => {
      vaultSuggestions.push({
        vault: wsVault,
        label: VaultUtils.getName(wsVault),
      });
    });
    return vaultSuggestions;
  }

  // Hierarchy matches exist but not in context vault
  vaultSuggestions = vaultSuggestions.concat(hierarchyItems);
  vaultSuggestions.push({
    vault: contextVault,
    detail: CONTEXT_DETAIL,
    label: VaultUtils.getName(contextVault),
  });
  allVaults = _.filter(
    allVaults,
    (v) =>
      v.fsPath !== contextVault.fsPath &&
      !hierarchyItems.find((h) => h.vault.fsPath === v.fsPath)
  );
  allVaults.forEach((wsVault) => {
    vaultSuggestions.push({
      vault: wsVault,
      label: VaultUtils.getName(wsVault),
    });
  });
  return vaultSuggestions;
}

