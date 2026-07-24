/**
 * Vault selection / recommendation for lookup create-new flows.
 * Extracted from PickerUtilsV2 for maintainability.
 */
import { DEngineClient, DVault, VaultUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
import { VaultPickerItem, isDVaultArray } from "./utils";
import { VaultSelectionMode } from "./types";
import {
  rankVaultSuggestions,
  resolveVaultSelectionMode,
} from "./pickerVaultRank";

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

  const resolved = resolveVaultSelectionMode({
    vaultSuggestions,
    vaultSelectionMode,
  });
  if ("prompt" in resolved) {
    return promptVault(vaultSuggestions);
  }
  return resolved.vault;
}

export function promptVault(overrides?: DVault[]): Promise<DVault | undefined>;
export function promptVault(
  overrides?: VaultPickerItem[],
): Promise<DVault | undefined>;
export async function promptVault(
  overrides?: VaultPickerItem[] | DVault[],
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

  const hierarchyMatchVaults = queryResponse
    .filter((value) => value.fname === newQs)
    .map((value) => value.vault);

  return rankVaultSuggestions({
    contextVault: vault,
    allVaults: engine.vaults,
    hierarchyMatchVaults,
  });
}
