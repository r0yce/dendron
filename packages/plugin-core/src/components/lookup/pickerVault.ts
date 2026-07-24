/**
 * Vault selection / recommendation for lookup create-new flows.
 * Extracted from PickerUtilsV2 for maintainability.
 */
import {
  DEngineClient,
  DVault,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import {
  CONTEXT_DETAIL,
  FULL_MATCH_DETAIL,
  HIERARCHY_MATCH_DETAIL,
  VaultPickerItem,
  isDVaultArray,
} from "./utils";
import { VaultSelectionMode } from "./types";

export async function getOrPromptVaultForNewNote({
  vault,
  fname,
  vaultSelectionMode = VaultSelectionMode.smart,
}: {
  vault: DVault;
  fname: string;
  vaultSelectionMode?: VaultSelectionMode;
}): Promise<DVault | undefined> {
    const engine = ExtensionProvider.getEngine();
    const vaultSuggestions = await getVaultRecommendations({
      vault,
      vaults: engine.vaults,
      engine,
      fname,
    });

    if (
      vaultSuggestions?.length === 1 ||
      vaultSelectionMode === VaultSelectionMode.auto
    ) {
      return vaultSuggestions[0]!.vault;
    }

    // Auto select for the user if either the hierarchy pattern matches in the
    // current vault context, or if there are no hierarchy matches
    if (vaultSelectionMode === VaultSelectionMode.smart) {
      const topSuggestion = vaultSuggestions[0]!;
      if (
        topSuggestion.detail === FULL_MATCH_DETAIL ||
        topSuggestion.detail === CONTEXT_DETAIL
      ) {
        return topSuggestion.vault;
      }
    }

    return promptVault(vaultSuggestions);
  }

export function promptVault(overrides?: DVault[]): Promise<DVault | undefined>;
export function promptVault(
  overrides?: VaultPickerItem[]
): Promise<DVault | undefined>;
export async function promptVault(
  overrides?: VaultPickerItem[] | DVault[]
): Promise<DVault | undefined> {
    const { vaults: wsVaults } = ExtensionProvider.getDWorkspace();
    const pickerOverrides = isDVaultArray(overrides)
      ? overrides.map((value) => {
          return { vault: value, label: VaultUtils.getName(value) };
        })
      : overrides;

    const vaults: VaultPickerItem[] =
      pickerOverrides ??
      wsVaults.map((vault) => {
        return { vault, label: VaultUtils.getName(vault) };
      });

    const items = vaults.map((ent) => ({
      ...ent,
      label: ent.label ? ent.label : ent.vault.fsPath,
    }));
    const resp = await VSCodeUtils.showQuickPick(items, {
      title: "Select Vault",
    });

    return resp ? resp.vault : undefined;
  }

  /**
   * Determine which vault(s) are the most appropriate to create this note in.
   * Vaults determined as better matches appear earlier in the returned array
   * @param
   * @returns
   */
export async function getVaultRecommendations({
  vault,
  vaults,
  engine,
  fname,
}: {
  vault: DVault;
  vaults: DVault[];
  engine: DEngineClient;
  fname: string;
}): Promise<VaultPickerItem[]> {
    let vaultSuggestions: VaultPickerItem[] = [];

    // Only 1 vault, no other options to choose from:
    if (vaults.length <= 1) {
      return Array.of({ vault, label: VaultUtils.getName(vault) });
    }

    const domain = fname.split(".").slice(0, -1);
    const newQs = domain.join(".");
    const queryResponse = await engine.queryNotes({
      qs: newQs,
      originalQS: newQs,
      createIfNew: false,
    });

    // Sort Alphabetically by the Path Name
    const sortByPathNameFn = (a: DVault, b: DVault) => {
      return a.fsPath <= b.fsPath ? -1 : 1;
    };
    let allVaults = engine.vaults.sort(sortByPathNameFn);

    const vaultsWithMatchingHierarchy: VaultPickerItem[] | undefined =
      queryResponse
        .filter((value) => value.fname === newQs)
        .map((value) => value.vault)
        .sort(sortByPathNameFn)
        .map((value) => {
          return {
            vault: value,
            detail: HIERARCHY_MATCH_DETAIL,
            label: VaultUtils.getName(value),
          };
        });

    if (!vaultsWithMatchingHierarchy) {
      // Suggest current vault context as top suggestion
      vaultSuggestions.push({
        vault,
        detail: CONTEXT_DETAIL,
        label: VaultUtils.getName(vault),
      });

      allVaults.forEach((cmpVault) => {
        if (cmpVault !== vault) {
          vaultSuggestions.push({
            vault: cmpVault,
            label: VaultUtils.getName(vault),
          });
        }
      });
    }
    // One of the vaults with a matching hierarchy is also the current note context:
    else if (
      vaultsWithMatchingHierarchy.find(
        (value) => value.vault.fsPath === vault.fsPath
      ) !== undefined
    ) {
      // Prompt with matching hierarchies & current context, THEN other matching contexts; THEN any other vaults
      vaultSuggestions.push({
        vault,
        detail: FULL_MATCH_DETAIL,
        label: VaultUtils.getName(vault),
      });

      // remove from allVaults the one we already pushed.
      allVaults = _.filter(allVaults, (v) => {
        return !_.isEqual(v, vault);
      });
      vaultsWithMatchingHierarchy.forEach((ent) => {
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
          // remove from allVaults the one we already pushed.
          allVaults = _.filter(allVaults, (v) => {
            return !_.isEqual(v, ent.vault);
          });
        }
      });

      // push the rest of the vaults
      allVaults.forEach((wsVault) => {
        vaultSuggestions.push({
          vault: wsVault,
          label: VaultUtils.getName(wsVault),
        });
      });
    } else {
      // Suggest vaults with matching hierarchy, THEN current note context, THEN any other vaults
      vaultSuggestions = vaultSuggestions.concat(vaultsWithMatchingHierarchy);
      vaultSuggestions.push({
        vault,
        detail: CONTEXT_DETAIL,
        label: VaultUtils.getName(vault),
      });

      allVaults = _.filter(allVaults, (v) => {
        return !_.isEqual(v, vault);
      });

      allVaults.forEach((wsVault) => {
        vaultSuggestions.push({
          vault: wsVault,
          label: VaultUtils.getName(wsVault),
        });
      });
    }

    return vaultSuggestions;
  }

