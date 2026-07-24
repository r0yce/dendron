import { NotePropsMeta, VaultUtils } from "@dendronhq/common-all";

export type BulkRenamePlanRow = {
  oldFname: string;
  newFname: string;
  vaultName: string;
  note: NotePropsMeta;
};

/** Pure planner for Safe Bulk Rename (testable without VS Code). */
export function planBulkRename(opts: {
  notes: NotePropsMeta[];
  match: string;
  replace: string;
}): { plan: BulkRenamePlanRow[]; conflicts: BulkRenamePlanRow[] } {
  const re = new RegExp(opts.match);
  const plan: BulkRenamePlanRow[] = [];
  for (const note of opts.notes) {
    if (!re.test(note.fname)) continue;
    const newFname = note.fname.replace(re, opts.replace);
    if (newFname === note.fname || !newFname.trim()) continue;
    plan.push({
      oldFname: note.fname,
      newFname,
      vaultName: VaultUtils.getName(note.vault),
      note,
    });
  }
  const existing = new Set(
    opts.notes.map((n) => `${n.vault.fsPath}::${n.fname}`)
  );
  const conflicts = plan.filter((p) =>
    existing.has(`${p.note.vault.fsPath}::${p.newFname}`)
  );
  return { plan, conflicts };
}
