#!/usr/bin/env node
/**
 * Node-only smoke for pure lookup helpers (no VS Code host).
 * Run after: yarn workspace @dendronhq/plugin-core compile
 *
 *   node scripts/smoke-lookup-pure.js
 */
/* eslint-disable no-console */
const path = require("path");
const root = path.join(__dirname, "..");
const out = (rel) =>
  require(path.join(root, "packages/plugin-core/out/src", rel));

const rank = out("components/lookup/pickerVaultRank.js");
const filter = out("components/lookup/pickerFilterResults.js");
const policy = out("components/lookup/pickerCreateNewPolicy.js");
const value = out("components/lookup/pickerValue.js");
const pagination = out("components/lookup/pickerPagination.js");
const schemaComp = out("components/lookup/noteLookupSchemaCompletions.js");
const schemaHelpers = out("components/lookup/schemaLookupHelpers.js");
const selMode = out("commands/noteLookupSelectionMode.js");
const acceptHelp = out("commands/noteLookupAcceptHelpers.js");
// noteLookupGatherInputs pulls ExtensionProvider/vscode — do not require here.
const hierarchy = out("commands/hierarchySchemaModels.js");
const doctorActions = out("commands/doctorActions.js");
const moveNoteOps = out("commands/moveNoteOps.js");
const refactorOps = out("commands/refactorHierarchyOps.js");
const constants = out("components/lookup/vaultPickerConstants.js");
const completionHelpers = out("features/completionHelpers.js");
const keybindingHelpers = out("keybindingConflictHelpers.js");

let failed = 0;
function check(name, cond) {
  if (!cond) {
    console.error("FAIL:", name);
    failed += 1;
  } else {
    console.log("ok:", name);
  }
}

// --- vault selection mode ---
const v1 = { fsPath: "vault1", name: "vault1" };
const v2 = { fsPath: "vault2", name: "vault2" };
const multiFull = [
  { vault: v1, label: "v1", detail: constants.FULL_MATCH_DETAIL },
  { vault: v2, label: "v2" },
];
const multiHier = [
  { vault: v1, label: "v1", detail: constants.HIERARCHY_MATCH_DETAIL },
  { vault: v2, label: "v2", detail: constants.CONTEXT_DETAIL },
];
check(
  "resolveVaultSelectionMode smart+full",
  rank.resolveVaultSelectionMode({
    vaultSuggestions: multiFull,
    vaultSelectionMode: "smart",
  }).vault?.fsPath === "vault1"
);
check(
  "resolveVaultSelectionMode smart+hier prompts",
  rank.resolveVaultSelectionMode({
    vaultSuggestions: multiHier,
    vaultSelectionMode: "smart",
  }).prompt === true
);

// --- filterPickerResults ---
const note = (fname, vaultName = "vault1") => ({
  fname,
  vault: { fsPath: vaultName, name: vaultName },
});
const wiki = filter.filterPickerResults({
  itemsToFilter: [note("foo"), note("foo.bar")],
  transformedQuery: {
    originalQuery: "foo",
    queryString: "foo",
    wasMadeFromWikiLink: true,
  },
});
check("filterPickerResults wiki exact", wiki.length === 1 && wiki[0].fname === "foo");

// --- create-new policy ---
check(
  "shouldAddCreateNewOption happy path",
  policy.shouldAddCreateNewOption({
    allowNewNote: true,
    queryOrig: "hello",
    canSelectMany: false,
    wasMadeFromWikiLink: false,
    numberOfExactMatches: 0,
    vaultCount: 2,
  }) === true
);
check(
  "shouldAddCreateNewOption rejects trailing dot",
  policy.shouldAddCreateNewOption({
    allowNewNote: true,
    queryOrig: "hello.",
    canSelectMany: false,
    wasMadeFromWikiLink: false,
    numberOfExactMatches: 0,
    vaultCount: 2,
  }) === false
);
check(
  "countExactFnameMatches",
  policy.countExactFnameMatches(
    [{ fname: "Foo" }, { fname: "foo" }, { fname: "bar" }],
    "foo"
  ) === 2
);

// --- picker value compose ---
check(
  "getPickerValue joins parts",
  value.getPickerValue({
    prefix: "journal",
    noteModifierValue: "2026.07.24",
    selectionModifierValue: undefined,
  }) === "journal.2026.07.24"
);

// --- pagination ---
const page = pagination.sliceForPaginationLimit([1, 2, 3, 4, 5], 2);
check(
  "sliceForPaginationLimit",
  page.hasMore === true &&
    page.page.length === 2 &&
    page.allResults.length === 5
);

// --- schema candidate select ---
const selected = schemaComp.selectNewSchemaCandidates({
  candidates: [{ fname: "a.b" }, { fname: "a.c" }],
  existingItems: [{ fname: "a.b" }],
  originalQuery: "a.",
});
check(
  "selectNewSchemaCandidates drops existing",
  selected.length === 1 && selected[0].fname === "a.c"
);

// --- schema lookup helpers ---
check(
  "isMultiLevelSchemaQuery",
  schemaHelpers.isMultiLevelSchemaQuery("a.b") === true &&
    schemaHelpers.isMultiLevelSchemaQuery("a") === false
);

// --- note lookup command pure helpers ---
check(
  "selectionModeConfigToType",
  selMode.selectionModeConfigToType("link") === "selection2link" &&
    selMode.selectionModeConfigToType("none") === "none"
);
check(
  "getSelectedLookupItems",
  acceptHelp.getSelectedLookupItems({
    canSelectMany: false,
    selectedItems: [{ fname: "a" }, { fname: "b" }],
  }).length === 1
);
check(
  "getFNameForNewLookupItem journal",
  acceptHelp.getFNameForNewLookupItem({
    item: { fname: "x" },
    isJournal: true,
    pickerValue: "j.1",
  }) === "j.1"
);

// --- hierarchy / doctor pure ---
const h = new hierarchy.Hierarchy("a.b.c");
check("Hierarchy depth", h.depth() === 3 && h.topId() === "a");
check(
  "doctor reload-before frontmatter",
  doctorActions.shouldDoctorReloadWorkspaceBeforeDoctorAction(
    "fixFrontmatter"
  ) === true
);

// --- move note / refactor pure ---
check(
  "isMoveNecessary same vault+name",
  moveNoteOps.isMoveNecessary({
    oldLoc: { fname: "a", vaultName: "v1" },
    newLoc: { fname: "a", vaultName: "v1" },
  }) === false
);
check(
  "isMultiMove",
  moveNoteOps.isMultiMove([{}, {}]) === true &&
    moveNoteOps.isMultiMove([{}]) === false
);
check(
  "getRefactorRenamePathOps produces dest fname",
  (() => {
    const ops = refactorOps.getRefactorRenamePathOps({
      capturedNotes: [
        { fname: "foo.bar", vault: { fsPath: "v1", name: "v1" } },
      ],
      matchRE: /^foo\./,
      replace: "baz.",
      wsRoot: "/tmp/ws",
    });
    return ops.length === 1 && ops[0].newPath.includes("baz.bar");
  })()
);

// --- completion pure helpers (wave 20) ---
check(
  "padWithZero",
  completionHelpers.padWithZero(3) === "003" &&
    completionHelpers.padWithZero(12) === "012" &&
    completionHelpers.padWithZero(100) === "100"
);
check(
  "findMatchAtCharacter wikilink",
  (() => {
    const line = "see [[foo.bar]] now";
    const m = completionHelpers.findMatchAtCharacter(
      line,
      line.indexOf("foo") + 1,
      completionHelpers.NOTE_AUTOCOMPLETEABLE_REGEX
    );
    return m && m.groups && m.groups.note === "foo.bar";
  })()
);
check(
  "computeNoteCompletionRange",
  (() => {
    const r = completionHelpers.computeNoteCompletionRange({
      foundIndex: 4,
      groups: { beforeNote: "[[", note: "abc" },
    });
    return r.start === 6 && r.end === 9;
  })()
);
check(
  "computeBlockCompletionRange after hash",
  (() => {
    const r = completionHelpers.computeBlockCompletionRange({
      foundIndex: 0,
      groups: { beforeAnchor: "#", afterAnchor: "hdr" },
    });
    // start after [[ + beforeAnchor
    return r.start === 3 && r.end === 6;
  })()
);

// --- keybinding pure helpers (wave 20) ---
check(
  "generateKeybindingBlockForCopy disable",
  keybindingHelpers
    .generateKeybindingBlockForCopy({
      entry: { key: "ctrl+j", command: "ext.cmd" },
      disable: true,
    })
    .includes('"command": "-ext.cmd"')
);
check(
  "filterConflictsByInstallAndOS",
  (() => {
    const conflicts = keybindingHelpers.filterConflictsByInstallAndOS({
      knownConflicts: [
        {
          extensionId: "vscodevim.vim",
          commandId: "extension.vim_escape",
          conflictsWith: "dendron.lookup",
        },
        {
          extensionId: "other.ext",
          commandId: "other.cmd",
          conflictsWith: "dendron.x",
        },
      ],
      installedExtensionIds: ["vscodevim.vim"],
      osType: "Darwin",
    });
    return conflicts.length === 1 && conflicts[0].extensionId === "vscodevim.vim";
  })()
);
check(
  "filterResolvedKeybindingConflicts",
  (() => {
    const remaining = keybindingHelpers.filterResolvedKeybindingConflicts({
      conflicts: [
        {
          extensionId: "vscodevim.vim",
          commandId: "extension.vim_escape",
          conflictsWith: "dendron.lookup",
        },
      ],
      userKeybindings: [{ command: "-extension.vim_escape" }],
    });
    return remaining.length === 0;
  })()
);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nsmoke-lookup-pure: all ok");
