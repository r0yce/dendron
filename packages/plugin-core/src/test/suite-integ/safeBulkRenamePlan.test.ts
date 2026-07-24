import { DVault, NotePropsMeta } from "@dendronhq/common-all";
import { describe, it } from "mocha";
import { expect } from "../testUtilsv2";
import { planBulkRename } from "../../services/safeBulkRenamePlan";

function note(fname: string, vault: DVault): NotePropsMeta {
  return {
    id: fname,
    fname,
    title: fname,
    desc: "",
    type: "note",
    updated: 1,
    created: 1,
    vault,
    links: [],
    anchors: {},
    parent: null,
    children: [],
    data: {},
    contentHash: undefined,
    custom: {},
  } as NotePropsMeta;
}

describe("planBulkRename", () => {
  const vault: DVault = { fsPath: "/tmp/v", name: "v" };

  it("plans renames from regex", () => {
    const notes = [note("old.foo", vault), note("old.bar", vault), note("keep", vault)];
    const { plan, conflicts } = planBulkRename({
      notes,
      match: "^old\\.",
      replace: "new.",
    });
    expect(plan.length).toEqual(2);
    expect(plan[0]!.newFname).toEqual("new.foo");
    expect(conflicts.length).toEqual(0);
  });

  it("detects conflicts with existing fnames", () => {
    const notes = [note("old.foo", vault), note("new.foo", vault)];
    const { plan, conflicts } = planBulkRename({
      notes,
      match: "^old\\.",
      replace: "new.",
    });
    expect(plan.length).toEqual(1);
    expect(conflicts.length).toEqual(1);
    expect(conflicts[0]!.newFname).toEqual("new.foo");
  });
});
