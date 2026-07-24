import { DVault, VaultUtils } from "@dendronhq/common-all";
import { describe, it } from "mocha";
import { expect } from "../testUtilsv2";
import { WorkspaceModesService } from "../../services/WorkspaceModesService";

describe("WorkspaceModesService.filterNotesByFocus", () => {
  const vaultA: DVault = { fsPath: "/tmp/a", name: "a" };
  const vaultB: DVault = { fsPath: "/tmp/b", name: "b" };

  it("returns all notes when no focus is set", () => {
    const notes = [
      { fname: "foo", vault: vaultA },
      { fname: "bar", vault: vaultB },
    ];
    // Without extension context, getFocusedVault is undefined
    const out = WorkspaceModesService.filterNotesByFocus(notes);
    expect(out.length).toEqual(2);
  });

  it("VaultUtils.isEqualV2 distinguishes vaults", () => {
    expect(VaultUtils.isEqualV2(vaultA, vaultA)).toBeTruthy();
    expect(VaultUtils.isEqualV2(vaultA, vaultB)).toBeFalsy();
  });
});
