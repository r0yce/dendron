import { VaultUtils } from "@dendronhq/common-all";
import { GotoNoteCommand } from "../commands/GotoNote";
import { IDendronExtension } from "../dendronExtensionInterface";

/**
 * Shared host-side actions for HTML webview postMessage handlers.
 * Keeps Hub Home / Task Board / future panels from re-implementing vault lookup.
 */
export async function gotoNoteByVaultName(
  ext: IDendronExtension,
  opts: { fname: string; vaultName?: string }
): Promise<void> {
  const vault = opts.vaultName
    ? ext
        .getDWorkspace()
        .vaults.find((v) => VaultUtils.getName(v) === opts.vaultName)
    : undefined;
  await new GotoNoteCommand(ext).execute({
    qs: opts.fname,
    ...(vault ? { vault } : {}),
  });
}
