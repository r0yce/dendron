/**
 * Resolve vault for create-new note from lookup (avoid collisions).
 * Uses ExtensionProvider / QuickPick — not Node-smokeable alone.
 */
import { DVault, ErrorFactory, ErrorMessages } from "@dendronhq/common-all";
import { ExtensionProvider } from "../ExtensionProvider";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { PickerUtilsV2 } from "../components/lookup/utils";

/**
 * Prefer picker vault / open-editor vault; if that vault already has fname,
 * prompt among remaining vaults (or pick the only free one).
 */
export async function resolveVaultForNewNote(opts: {
  fname: string;
  picker: DendronQuickPickerV2;
}): Promise<DVault | undefined> {
  const { fname, picker } = opts;
  const engine = ExtensionProvider.getEngine();

  const vaultsWithMatchingFile = new Set(
    (await engine.findNotesMeta({ fname })).map((n) => n.vault.fsPath)
  );

  // Try to get the default vault value.
  let vault: DVault | undefined = picker.vault
    ? picker.vault
    : PickerUtilsV2.getVaultForOpenEditor();

  // If our current context does not have vault or if our current context vault
  // already has a matching file name we want to ask the user for a different vault.
  if (vault === undefined || vaultsWithMatchingFile.has(vault.fsPath)) {
    // Available vaults are vaults that do not have the desired file name.
    const availVaults = engine.vaults.filter(
      (v) => !vaultsWithMatchingFile.has(v.fsPath)
    );

    if (availVaults.length > 1) {
      const promptedVault = await PickerUtilsV2.promptVault(availVaults);
      if (promptedVault === undefined) {
        // User must have cancelled vault selection.
        vault = undefined;
      } else {
        vault = promptedVault;
      }
    } else if (availVaults.length === 1) {
      // There is only a single vault that is available so we dont have to ask the user.
      vault = availVaults[0];
    } else {
      // We should never reach this as "Create New" should not be available as option
      // to the user when there are no available vaults.
      throw ErrorFactory.createInvalidStateError({
        message: ErrorMessages.formatShouldNeverOccurMsg(
          `No available vaults for file name.`
        ),
      });
    }
  }

  return vault;
}
